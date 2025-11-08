import { Router } from 'express';
import { db, categoryRules } from '../db';
import { eq, and, ilike } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiResponse } from '@finances/shared';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/account-books/:accountBookId/rules - Get all rules for an account book
router.get('/:accountBookId/rules', async (req, res) => {
  try {
    const { accountBookId } = req.params;

    const rules = await db
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.accountBookId, accountBookId))
      .orderBy(categoryRules.createdAt);

    const response: ApiResponse = {
      success: true,
      data: rules,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rules',
    });
  }
});

// POST /api/account-books/:accountBookId/rules - Create a new rule
router.post('/:accountBookId/rules', async (req, res) => {
  try {
    const { accountBookId } = req.params;
    const { keyword, category, subCategory } = req.body;

    // Validate required fields
    if (!keyword || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: keyword, category',
      });
    }

    // Check if rule with same keyword already exists for this account book
    const existingRule = await db
      .select()
      .from(categoryRules)
      .where(
        and(
          eq(categoryRules.accountBookId, accountBookId),
          eq(categoryRules.keyword, keyword.trim())
        )
      )
      .limit(1);

    if (existingRule.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A rule with this keyword already exists',
      });
    }

    const newRule = await db
      .insert(categoryRules)
      .values({
        accountBookId,
        keyword: keyword.trim(),
        category: category.trim(),
        subCategory: subCategory?.trim() || '',
      })
      .returning();

    const response: ApiResponse = {
      success: true,
      data: newRule[0],
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create rule',
    });
  }
});

// PUT /api/account-books/:accountBookId/rules/:ruleId - Update a rule
router.put('/:accountBookId/rules/:ruleId', async (req, res) => {
  try {
    const { accountBookId, ruleId } = req.params;
    const { keyword, category, subCategory } = req.body;

    // Validate required fields
    if (!keyword || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: keyword, category',
      });
    }

    // Verify rule exists and belongs to this account book
    const rule = await db
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.id, ruleId))
      .limit(1);

    if (rule.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
    }

    if (rule[0].accountBookId !== accountBookId) {
      return res.status(403).json({
        success: false,
        error: 'Rule does not belong to this account book',
      });
    }

    // Check if another rule with same keyword already exists (excluding current rule)
    const existingRule = await db
      .select()
      .from(categoryRules)
      .where(
        and(
          eq(categoryRules.accountBookId, accountBookId),
          eq(categoryRules.keyword, keyword.trim())
        )
      )
      .limit(2);

    if (existingRule.length > 0 && existingRule.find(r => r.id !== ruleId)) {
      return res.status(400).json({
        success: false,
        error: 'A rule with this keyword already exists',
      });
    }

    const updatedRule = await db
      .update(categoryRules)
      .set({
        keyword: keyword.trim(),
        category: category.trim(),
        subCategory: subCategory?.trim() || '',
        updatedAt: new Date(),
      })
      .where(eq(categoryRules.id, ruleId))
      .returning();

    const response: ApiResponse = {
      success: true,
      data: updatedRule[0],
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update rule',
    });
  }
});

// DELETE /api/account-books/:accountBookId/rules/:ruleId - Delete a rule
router.delete('/:accountBookId/rules/:ruleId', async (req, res) => {
  try {
    const { accountBookId, ruleId } = req.params;

    // Verify rule exists and belongs to this account book
    const rule = await db
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.id, ruleId))
      .limit(1);

    if (rule.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
    }

    if (rule[0].accountBookId !== accountBookId) {
      return res.status(403).json({
        success: false,
        error: 'Rule does not belong to this account book',
      });
    }

    await db.delete(categoryRules).where(eq(categoryRules.id, ruleId));

    const response: ApiResponse = {
      success: true,
      data: { message: 'Rule deleted successfully' },
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete rule',
    });
  }
});

export default router;
