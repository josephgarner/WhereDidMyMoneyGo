import { Router } from 'express';
import { db, accounts, transactions } from '../db';
import { eq, desc, sql, gte, lte, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiResponse } from '@finances/shared';
import multer from 'multer';
import { parseQIFFile } from '../utils/qifParser';
import { updateAccountBalance } from '../utils/accountBalances';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only .qif files
    if (file.originalname.toLowerCase().endsWith('.qif')) {
      cb(null, true);
    } else {
      cb(new Error('Only .qif files are allowed'));
    }
  },
});

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

    // Update account balance after adding transaction
    await updateAccountBalance(accountId);

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

// POST /api/accounts/:accountId/transactions/upload-qif - Upload and import transactions from QIF file
router.post('/:accountId/transactions/upload-qif', upload.single('qifFile'), async (req, res) => {
  try {
    const { accountId } = req.params;

    // Verify account exists and get account book ID
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

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Parse the QIF file
    const fileContent = req.file.buffer.toString('utf-8');
    const parseResult = parseQIFFile(fileContent);

    // If there are parse errors and no transactions, return error
    if (parseResult.transactions.length === 0 && parseResult.errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse QIF file',
        details: parseResult.errors,
      });
    }

    // Insert all valid transactions
    const insertedTransactions = [];
    const insertErrors: string[] = [];

    for (const transaction of parseResult.transactions) {
      try {
        const newTransaction = await db
          .insert(transactions)
          .values({
            accountId,
            accountBookId: account[0].accountBookId,
            transactionDate: transaction.transactionDate,
            description: transaction.description,
            category: transaction.category,
            subCategory: transaction.subCategory || '',
            debitAmount: transaction.debitAmount,
            creditAmount: transaction.creditAmount,
          })
          .returning();

        insertedTransactions.push(newTransaction[0]);
      } catch (error: any) {
        insertErrors.push(`Failed to insert transaction "${transaction.description}": ${error.message}`);
      }
    }

    // Update account balance after importing all transactions
    if (insertedTransactions.length > 0) {
      await updateAccountBalance(accountId);
    }

    // Return results
    const response: ApiResponse = {
      success: true,
      data: {
        imported: insertedTransactions.length,
        failed: insertErrors.length,
        parseErrors: parseResult.errors.length,
        transactions: insertedTransactions,
      },
    };

    // Include errors in response if there were any
    if (insertErrors.length > 0 || parseResult.errors.length > 0) {
      response.data.errors = [...parseResult.errors, ...insertErrors];
    }

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error uploading QIF file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload QIF file',
    });
  }
});

// PUT /api/accounts/:accountId/transactions/:transactionId - Update a transaction
router.put('/:accountId/transactions/:transactionId', async (req, res) => {
  try {
    const { accountId, transactionId } = req.params;
    const {
      transactionDate,
      description,
      category,
      subCategory,
      debitAmount,
      creditAmount,
    } = req.body;

    // Verify transaction exists and belongs to this account
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (transaction.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    if (transaction[0].accountId !== accountId) {
      return res.status(403).json({
        success: false,
        error: 'Transaction does not belong to this account',
      });
    }

    // Validate required fields
    if (!transactionDate || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: transactionDate, description, category',
      });
    }

    // Update the transaction
    const updatedTransaction = await db
      .update(transactions)
      .set({
        transactionDate: new Date(transactionDate),
        description,
        category,
        subCategory: subCategory || '',
        debitAmount: debitAmount || '0',
        creditAmount: creditAmount || '0',
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    // Update account balance after updating transaction
    await updateAccountBalance(accountId);

    const response: ApiResponse = {
      success: true,
      data: updatedTransaction[0],
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction',
    });
  }
});

// DELETE /api/accounts/:accountId/transactions/:transactionId - Delete a single transaction
router.delete('/:accountId/transactions/:transactionId', async (req, res) => {
  try {
    const { accountId, transactionId } = req.params;

    // Verify transaction exists and belongs to this account
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (transaction.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    if (transaction[0].accountId !== accountId) {
      return res.status(403).json({
        success: false,
        error: 'Transaction does not belong to this account',
      });
    }

    // Delete the transaction
    await db.delete(transactions).where(eq(transactions.id, transactionId));

    // Update account balance after deleting transaction
    await updateAccountBalance(accountId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Transaction deleted successfully' },
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete transaction',
    });
  }
});

// DELETE /api/accounts/:accountId/transactions/bulk/by-month - Delete all transactions for a specific month
router.delete('/:accountId/transactions/bulk/by-month', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { month } = req.query; // Format: YYYY-MM

    if (!month || typeof month !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Month parameter is required (format: YYYY-MM)',
      });
    }

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

    // Calculate month range
    const [year, monthNum] = month.split('-');
    const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);

    // Delete all transactions in this month for this account
    const result = await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          gte(transactions.transactionDate, startOfMonth),
          lte(transactions.transactionDate, endOfMonth)
        )
      )
      .returning();

    // Update account balance after deleting transactions
    await updateAccountBalance(accountId);

    const response: ApiResponse = {
      success: true,
      data: {
        message: `Deleted ${result.length} transaction(s) for ${month}`,
        deletedCount: result.length,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting transactions by month:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete transactions',
    });
  }
});

export default router;
