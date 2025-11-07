import { Router } from 'express';
import { db, accounts, transactions } from '../db';
import { eq, desc, sql, gte, lte, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiResponse } from '@finances/shared';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/accounts/:accountId/categories - Get distinct categories and subcategories
router.get('/:accountId/categories', async (req, res) => {
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

    // Get distinct categories and subcategories
    const result = await db
      .select({
        categories: sql<string[]>`ARRAY_AGG(DISTINCT ${transactions.category}) FILTER (WHERE ${transactions.category} IS NOT NULL AND ${transactions.category} != '')`,
        subCategories: sql<string[]>`ARRAY_AGG(DISTINCT ${transactions.subCategory}) FILTER (WHERE ${transactions.subCategory} IS NOT NULL AND ${transactions.subCategory} != '')`,
      })
      .from(transactions)
      .where(eq(transactions.accountId, accountId));

    const data = result[0];

    const response: ApiResponse = {
      success: true,
      data: {
        categories: data.categories?.filter(c => c !== null).sort() || [],
        subCategories: data.subCategories?.filter(sc => sc !== null).sort() || [],
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

// GET /api/accounts/:accountId/transactions/metadata - Get transaction date range metadata
router.get('/:accountId/transactions/metadata', async (req, res) => {
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

    // Get min and max transaction dates and distinct months
    const result = await db
      .select({
        minDate: sql<string>`MIN(${transactions.transactionDate})`,
        maxDate: sql<string>`MAX(${transactions.transactionDate})`,
        months: sql<string[]>`ARRAY_AGG(DISTINCT TO_CHAR(${transactions.transactionDate}, 'YYYY-MM'))`,
      })
      .from(transactions)
      .where(eq(transactions.accountId, accountId));

    const metadata = result[0];

    // Filter out null values and sort months
    const availableMonths = metadata.months
      ? metadata.months.filter(m => m !== null).sort((a, b) => b.localeCompare(a))
      : [];

    const response: ApiResponse = {
      success: true,
      data: {
        minDate: metadata.minDate,
        maxDate: metadata.maxDate,
        availableMonths,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching transaction metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction metadata',
    });
  }
});

// GET /api/accounts/:accountId/transactions - Get all transactions for a specific account with pagination
router.get('/:accountId/transactions', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, month, page = '1', limit = '20' } = req.query;

    // Parse pagination params
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

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

    // Build where conditions
    const conditions = [eq(transactions.accountId, accountId)];

    if (month && typeof month === 'string') {
      // Filter by specific month (YYYY-MM)
      const [year, monthNum] = month.split('-');
      const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);

      conditions.push(gte(transactions.transactionDate, startOfMonth));
      conditions.push(lte(transactions.transactionDate, endOfMonth));
    } else if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      // Filter by date range
      conditions.push(gte(transactions.transactionDate, new Date(startDate)));
      conditions.push(lte(transactions.transactionDate, new Date(endDate + 'T23:59:59')));
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(transactions)
      .where(and(...conditions));

    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get paginated transactions for this account, ordered by date (newest first)
    const accountTransactions = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDate))
      .limit(limitNum)
      .offset(offset);

    const response: ApiResponse = {
      success: true,
      data: accountTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
      },
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

// POST /api/accounts/:accountId/transactions - Create a new transaction for an account
router.post('/:accountId/transactions', async (req, res) => {
  try {
    const { accountId } = req.params;
    const {
      transactionDate,
      description,
      category,
      subCategory,
      debitAmount,
      creditAmount,
    } = req.body;

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

    // Validate required fields
    if (!transactionDate || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: transactionDate, description, category',
      });
    }

    // Create the transaction
    const newTransaction = await db
      .insert(transactions)
      .values({
        accountId,
        accountBookId: account[0].accountBookId,
        transactionDate: new Date(transactionDate),
        description,
        category,
        subCategory: subCategory || '',
        debitAmount: debitAmount || '0',
        creditAmount: creditAmount || '0',
      })
      .returning();

    const response: ApiResponse = {
      success: true,
      data: newTransaction[0],
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction',
    });
  }
});

export default router;
