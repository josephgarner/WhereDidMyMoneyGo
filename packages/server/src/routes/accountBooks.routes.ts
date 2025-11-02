import { Router } from 'express';
import { db, accountBooks, accounts } from '../db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiResponse } from '@finances/shared';

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

export default router;
