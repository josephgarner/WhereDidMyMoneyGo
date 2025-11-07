import { Router } from 'express';
import { db, accountBooks, accounts, transactions } from '../db';
import { eq, sql, and, lte } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiResponse } from '@finances/shared';
import { updateAccountBalance } from '../utils/accountBalances';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/account-books - Get all account books
router.get('/', async (req, res) => {
  try {
    const allAccountBooks = await db.select().from(accountBooks);

    const response: ApiResponse = {
      success: true,
      data: allAccountBooks,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching account books:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account books',
    });
  }
});

// GET /api/account-books/:id/accounts - Get all accounts for a specific account book
router.get('/:id/accounts', async (req, res) => {
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
        error: 'Account book not found',
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
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts',
    });
  }
});

// DELETE /api/account-books/:id/accounts/:accountId - Delete an account
router.delete('/:id/accounts/:accountId', async (req, res) => {
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
        error: 'Account not found',
      });
    }

    if (account[0].accountBookId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Account does not belong to this account book',
      });
    }

    // Delete the account (cascade will delete associated transactions)
    await db.delete(accounts).where(eq(accounts.id, accountId));

    const response: ApiResponse = {
      success: true,
      data: { message: 'Account deleted successfully' },
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
    });
  }
});

// POST /api/account-books/:id/accounts - Create a new account for a specific account book
router.post('/:id/accounts', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startingBalance } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Account name is required',
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
        error: 'Account book not found',
      });
    }

    // Create the account with initial zero balance
    const newAccount = await db
      .insert(accounts)
      .values({
        name,
        accountBookId: id,
        totalMonthlyBalance: '0',
        totalMonthlyCredits: '0',
        totalMonthlyDebits: '0',
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
        description: 'Starting Balance',
        category: 'Opening Balance',
        subCategory: '',
        debitAmount: isPositive ? '0' : Math.abs(balanceAmount).toFixed(2),
        creditAmount: isPositive ? balanceAmount.toFixed(2) : '0',
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
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account',
    });
  }
});

// GET /api/account-books/:id/dashboard-data - Get dashboard data including historical balances and recent transactions
router.get('/:id/dashboard-data', async (req, res) => {
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
        error: 'Account book not found',
      });
    }

    // Get all accounts for this book
    const bookAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountBookId, id));

    // Calculate last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Build historical balance data for each account
    const historicalData = [];
    for (const account of bookAccounts) {
      const monthlyBalances = [];

      // For each of the last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

        // Calculate balance up to end of this month
        const result = await db
          .select({
            totalDebits: sql<string>`COALESCE(SUM(${transactions.debitAmount}::numeric), 0)`,
            totalCredits: sql<string>`COALESCE(SUM(${transactions.creditAmount}::numeric), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.accountId, account.id),
              lte(transactions.transactionDate, monthEnd)
            )
          );

        const totalDebits = parseFloat(result[0].totalDebits || '0');
        const totalCredits = parseFloat(result[0].totalCredits || '0');
        const balance = totalCredits - totalDebits;

        monthlyBalances.push({
          month: monthKey,
          balance: parseFloat(balance.toFixed(2)),
        });
      }

      historicalData.push({
        accountId: account.id,
        accountName: account.name,
        data: monthlyBalances,
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
        recentTransactions,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

export default router;
