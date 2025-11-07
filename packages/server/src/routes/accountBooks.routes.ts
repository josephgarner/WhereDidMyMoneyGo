import { Router } from 'express';
import { db, accountBooks, accounts, transactions } from '../db';
import { eq } from 'drizzle-orm';
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

export default router;
