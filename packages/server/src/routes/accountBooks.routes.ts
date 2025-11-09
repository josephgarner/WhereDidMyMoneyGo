import { Router } from "express";
import { db, accountBooks, accounts, transactions } from "../db";
import { eq, sql, and, lte, gte } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.middleware";
import { ApiResponse } from "@finances/shared";
import { updateAccountBalance } from "../utils/accountBalances";
import { logger } from "../utils/logger";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/account-books - Get all account books
router.get("/", async (req, res) => {
  try {
    const allAccountBooks = await db.select().from(accountBooks);

    const response: ApiResponse = {
      success: true,
      data: allAccountBooks,
    };

    res.json(response);
  } catch (error) {
    logger.error("Error fetching account books", { error });
    res.status(500).json({
      success: false,
      error: "Failed to fetch account books",
    });
  }
});

// POST /api/account-books - Create a new account book
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Account book name is required",
      });
    }

    const newAccountBook = await db
      .insert(accountBooks)
      .values({
        name: name.trim(),
      })
      .returning();

    const response: ApiResponse = {
      success: true,
      data: newAccountBook[0],
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error("Error creating account book", { error });
    res.status(500).json({
      success: false,
      error: "Failed to create account book",
    });
  }
});

// GET /api/account-books/:id/accounts/:accountId/balance-history - Get 24-month balance history for a specific account
// NOTE: This route must come BEFORE /:id/accounts to avoid route conflict
router.get("/:id/accounts/:accountId/balance-history", async (req, res) => {
  try {
    const { id, accountId } = req.params;
    logger.info("Balance history request", { accountBookId: id, accountId });

    // Debug: Check if account exists at all
    const accountById = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    logger.info("Account lookup by ID", {
      accountId,
      found: accountById.length > 0,
      accountBookId: accountById[0]?.accountBookId,
    });

    // Verify account exists and belongs to this account book
    const account = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.accountBookId, id)))
      .limit(1);

    if (account.length === 0) {
      logger.warn("Account not found for balance history", {
        accountBookId: id,
        accountId,
        accountExists: accountById.length > 0,
        actualAccountBookId: accountById[0]?.accountBookId,
      });
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }

    logger.info("Account found, returning balance history", {
      accountBookId: id,
      accountId,
      accountName: account[0].name,
    });

    // Use the stored historicalBalance from the account
    const historicalBalance = account[0].historicalBalance || [];
    const monthlyBalances = historicalBalance.map((item) => ({
      month: item.month,
      balance: item.balance || 0,
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        accountId: account[0].id,
        accountName: account[0].name,
        data: monthlyBalances,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error("Error fetching balance history", {
      accountBookId: req.params.id,
      accountId: req.params.accountId,
      error,
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch balance history",
    });
  }
});

// GET /api/account-books/:id/accounts - Get all accounts for a specific account book
router.get("/:id/accounts", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify account book exists
    const accountBook = await db
      .select()
      .from(accountBooks)
      .where(eq(accountBooks.id, id))
      .limit(1);

    if (accountBook.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Account book not found",
      });
    }

    // Get all accounts for this account book
    const bookAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountBookId, id));

    const response: ApiResponse = {
      success: true,
      data: bookAccounts,
    };

    res.json(response);
  } catch (error) {
    logger.error("Error fetching accounts", {
      accountBookId: req.params.id,
      error,
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch accounts",
    });
  }
});

// DELETE /api/account-books/:id/accounts/:accountId - Delete an account
router.delete("/:id/accounts/:accountId", async (req, res) => {
  try {
    const { id, accountId } = req.params;

    // Verify account exists and belongs to this account book
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (account.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }

    if (account[0].accountBookId !== id) {
      return res.status(403).json({
        success: false,
        error: "Account does not belong to this account book",
      });
    }

    // Delete the account (cascade will delete associated transactions)
    await db.delete(accounts).where(eq(accounts.id, accountId));

    const response: ApiResponse = {
      success: true,
      data: { message: "Account deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    logger.error("Error deleting account", {
      accountBookId: req.params.id,
      accountId: req.params.accountId,
      error,
    });
    res.status(500).json({
      success: false,
      error: "Failed to delete account",
    });
  }
});

// POST /api/account-books/:id/accounts - Create a new account for a specific account book
router.post("/:id/accounts", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startingBalance } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Account name is required",
      });
    }

    // Verify account book exists
    const accountBook = await db
      .select()
      .from(accountBooks)
      .where(eq(accountBooks.id, id))
      .limit(1);

    if (accountBook.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Account book not found",
      });
    }

    // Create the account with initial zero balance
    const newAccount = await db
      .insert(accounts)
      .values({
        name,
        accountBookId: id,
        totalMonthlyBalance: "0",
        totalMonthlyCredits: "0",
        totalMonthlyDebits: "0",
      })
      .returning();

    // If there's a starting balance, create an initial transaction
    if (startingBalance && parseFloat(startingBalance) !== 0) {
      const balanceAmount = parseFloat(startingBalance);
      const isPositive = balanceAmount > 0;

      await db.insert(transactions).values({
        accountId: newAccount[0].id,
        accountBookId: id,
        transactionDate: new Date(),
        description: "Starting Balance",
        category: "Opening Balance",
        subCategory: "",
        debitAmount: isPositive ? "0" : Math.abs(balanceAmount).toFixed(2),
        creditAmount: isPositive ? balanceAmount.toFixed(2) : "0",
      });

      // Update account balance based on the transaction
      await updateAccountBalance(newAccount[0].id);

      // Fetch the updated account to return with correct balance
      const updatedAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, newAccount[0].id))
        .limit(1);

      const response: ApiResponse = {
        success: true,
        data: updatedAccount[0],
      };

      return res.status(201).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: newAccount[0],
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error("Error creating account", {
      accountBookId: req.params.id,
      error,
    });
    res.status(500).json({
      success: false,
      error: "Failed to create account",
    });
  }
});

// GET /api/account-books/:id/dashboard-data - Get dashboard data including historical balances and recent transactions
router.get("/:id/dashboard-data", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify account book exists
    const accountBook = await db
      .select()
      .from(accountBooks)
      .where(eq(accountBooks.id, id))
      .limit(1);

    if (accountBook.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Account book not found",
      });
    }

    // Get all accounts for this book
    const bookAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountBookId, id));

    // Build historical balance data from the stored historicalBalance field
    const historicalData = [];
    const monthlyDebitCreditData = [];

    for (const account of bookAccounts) {
      // Get last 6 months from historicalBalance
      const historicalBalance = account.historicalBalance || [];
      const last6Months = historicalBalance.slice(-6);

      // Format for balance chart (cumulative balance)
      const monthlyBalances = last6Months.map((item) => ({
        month: item.month,
        balance: item.balance || 0,
      }));

      // Format for debit/credit chart (monthly amounts)
      const monthlyDebitCredit = last6Months.map((item) => ({
        month: item.month,
        debits: item.debits || 0,
        credits: item.credits || 0,
      }));

      historicalData.push({
        accountId: account.id,
        accountName: account.name,
        data: monthlyBalances,
      });

      monthlyDebitCreditData.push({
        accountId: account.id,
        accountName: account.name,
        data: monthlyDebitCredit,
      });
    }

    // Get recent 5 transactions per account
    const recentTransactions = [];
    for (const account of bookAccounts) {
      const accountTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, account.id))
        .orderBy(sql`${transactions.transactionDate} DESC`)
        .limit(5);

      if (accountTransactions.length > 0) {
        recentTransactions.push({
          accountId: account.id,
          accountName: account.name,
          transactions: accountTransactions,
        });
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        historicalBalances: historicalData,
        monthlyDebitCredit: monthlyDebitCreditData,
        recentTransactions,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error("Error fetching dashboard data", {
      accountBookId: req.params.id,
      error,
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
    });
  }
});

// POST /api/account-books/:id/recalculate-balances - Recalculate all account balances for an account book
router.post("/:id/recalculate-balances", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify account book exists
    const accountBook = await db
      .select()
      .from(accountBooks)
      .where(eq(accountBooks.id, id))
      .limit(1);

    if (accountBook.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Account book not found",
      });
    }

    // Get all accounts for this book
    const bookAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountBookId, id));

    logger.info("Recalculating balances for account book", {
      accountBookId: id,
      accountCount: bookAccounts.length,
    });

    let successCount = 0;
    let errorCount = 0;

    // Recalculate balance for each account
    for (const account of bookAccounts) {
      try {
        await updateAccountBalance(account.id);
        successCount++;
      } catch (error) {
        errorCount++;
        logger.error("Failed to update account balance", {
          accountId: account.id,
          error,
        });
      }
    }

    logger.info("Balance recalculation complete", {
      accountBookId: id,
      total: bookAccounts.length,
      successful: successCount,
      failed: errorCount,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        message: "Balance recalculation complete",
        total: bookAccounts.length,
        successful: successCount,
        failed: errorCount,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error("Error recalculating balances", {
      accountBookId: req.params.id,
      error,
    });
    res.status(500).json({
      success: false,
      error: "Failed to recalculate balances",
    });
  }
});

// GET /api/account-books/:id/categories - Get all distinct categories and subcategories for an account book
router.get("/:id/categories", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify account book exists
    const accountBook = await db
      .select()
      .from(accountBooks)
      .where(eq(accountBooks.id, id))
      .limit(1);

    if (accountBook.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Account book not found",
      });
    }

    // Get distinct categories and subcategories from all transactions in this account book
    const result = await db
      .selectDistinct({
        category: transactions.category,
        subCategory: transactions.subCategory,
      })
      .from(transactions)
      .where(eq(transactions.accountBookId, id))
      .orderBy(transactions.category, transactions.subCategory);

    // Group by category with their subcategories
    const categoriesMap = new Map<string, Set<string>>();

    for (const row of result) {
      if (!categoriesMap.has(row.category)) {
        categoriesMap.set(row.category, new Set());
      }
      if (row.subCategory) {
        categoriesMap.get(row.category)!.add(row.subCategory);
      }
    }

    // Convert to array format
    const categories = Array.from(categoriesMap.entries()).map(([category, subCategories]) => ({
      category,
      subCategories: Array.from(subCategories).sort(),
    }));

    const response: ApiResponse = {
      success: true,
      data: categories,
    };

    res.json(response);
  } catch (error) {
    logger.error("Error fetching categories", {
      accountBookId: req.params.id,
      error,
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
});

export default router;
