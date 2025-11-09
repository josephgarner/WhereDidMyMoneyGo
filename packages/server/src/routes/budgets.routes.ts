import { Router } from 'express';
import { db, flowBudgets } from '../db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiResponse } from '@finances/shared';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/account-books/:id/budgets - Get all budgets for an account book
router.get('/:id/budgets', async (req, res) => {
  try {
    const { id } = req.params;

    const budgets = await db
      .select()
      .from(flowBudgets)
      .where(eq(flowBudgets.accountBookId, id));

    const response: ApiResponse = {
      success: true,
      data: budgets,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budgets',
    });
  }
});

// POST /api/account-books/:id/budgets - Create a new budget
router.post('/:id/budgets', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, incomeAmount, incomeAccountId } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Budget name is required',
      });
    }

    const newBudget = await db
      .insert(flowBudgets)
      .values({
        name,
        accountBookId: id,
        incomeAmount: incomeAmount || '0',
        incomeAccountId: incomeAccountId || null,
        rules: [],
      })
      .returning();

    const response: ApiResponse = {
      success: true,
      data: newBudget[0],
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create budget',
    });
  }
});

// PUT /api/account-books/:id/budgets/:budgetId - Update a budget
router.put('/:id/budgets/:budgetId', async (req, res) => {
  try {
    const { id, budgetId } = req.params;
    const { name, incomeAmount, incomeAccountId, rules } = req.body;

    // Verify budget exists and belongs to this account book
    const budget = await db
      .select()
      .from(flowBudgets)
      .where(eq(flowBudgets.id, budgetId))
      .limit(1);

    if (budget.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found',
      });
    }

    if (budget[0].accountBookId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Budget does not belong to this account book',
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (incomeAmount !== undefined) updateData.incomeAmount = incomeAmount;
    if (incomeAccountId !== undefined) updateData.incomeAccountId = incomeAccountId;
    if (rules !== undefined) updateData.rules = rules;
    updateData.updatedAt = new Date();

    const updatedBudget = await db
      .update(flowBudgets)
      .set(updateData)
      .where(eq(flowBudgets.id, budgetId))
      .returning();

    const response: ApiResponse = {
      success: true,
      data: updatedBudget[0],
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update budget',
    });
  }
});

// DELETE /api/account-books/:id/budgets/:budgetId - Delete a budget
router.delete('/:id/budgets/:budgetId', async (req, res) => {
  try {
    const { id, budgetId } = req.params;

    // Verify budget exists and belongs to this account book
    const budget = await db
      .select()
      .from(flowBudgets)
      .where(eq(flowBudgets.id, budgetId))
      .limit(1);

    if (budget.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found',
      });
    }

    if (budget[0].accountBookId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Budget does not belong to this account book',
      });
    }

    await db.delete(flowBudgets).where(eq(flowBudgets.id, budgetId));

    const response: ApiResponse = {
      success: true,
      data: { message: 'Budget deleted successfully' },
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete budget',
    });
  }
});

export default router;
