import { Router } from 'express';
import { db, accounts, transactions } from '../db';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiResponse } from '@finances/shared';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/accounts/:accountId/transactions - Get all transactions for a specific account
router.get('/:accountId/transactions', async (req, res) => {
  try {
    const { accountId } = req.params;

    // Verify account exists
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

    // Get all transactions for this account, ordered by date (newest first)
    const accountTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, accountId))
      .orderBy(desc(transactions.transactionDate));

    const response: ApiResponse = {
      success: true,
      data: accountTransactions,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
    });
  }
});

export default router;
