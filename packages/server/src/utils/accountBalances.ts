import { db, accounts, transactions } from '../db';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { logger } from './logger';

/**
 * Get the start and end of the current month
 */
function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * Calculate historical balance data for an account
 * Generates monthly balance snapshots for the last 24 months
 */
export async function calculateHistoricalBalance(accountId: string): Promise<{
  month: string;
  debits: number;
  credits: number;
  balance: number;
}[]> {
  const now = new Date();
  const historicalData = [];

  // Calculate for last 24 months
  for (let i = 23; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
    const monthEnd = i === 0
      ? now
      : new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

    // Calculate cumulative balance up to end of this month
    const cumulativeResult = await db
      .select({
        totalDebits: sql<string>`COALESCE(SUM(${transactions.debitAmount}::numeric), 0)`,
        totalCredits: sql<string>`COALESCE(SUM(${transactions.creditAmount}::numeric), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          lte(transactions.transactionDate, monthEnd)
        )
      );

    // Calculate monthly debits/credits for this month only
    const monthlyResult = await db
      .select({
        monthlyDebits: sql<string>`COALESCE(SUM(${transactions.debitAmount}::numeric), 0)`,
        monthlyCredits: sql<string>`COALESCE(SUM(${transactions.creditAmount}::numeric), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          gte(transactions.transactionDate, monthStart),
          lte(transactions.transactionDate, monthEnd)
        )
      );

    const totalDebits = parseFloat(cumulativeResult[0].totalDebits || '0');
    const totalCredits = parseFloat(cumulativeResult[0].totalCredits || '0');
    const balance = totalCredits - totalDebits;

    const monthlyDebits = parseFloat(monthlyResult[0].monthlyDebits || '0');
    const monthlyCredits = parseFloat(monthlyResult[0].monthlyCredits || '0');

    historicalData.push({
      month: monthKey,
      debits: parseFloat(monthlyDebits.toFixed(2)),
      credits: parseFloat(monthlyCredits.toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
    });
  }

  return historicalData;
}

/**
 * Recalculate and update an account's current month totals and historical balance
 */
export async function updateAccountBalance(accountId: string): Promise<void> {
  try {
    logger.info('Updating account balance', { accountId });

    const { start, end } = getCurrentMonthRange();

    // Calculate current month totals
    const monthlyResult = await db
      .select({
        totalDebits: sql<string>`COALESCE(SUM(${transactions.debitAmount}::numeric), 0)`,
        totalCredits: sql<string>`COALESCE(SUM(${transactions.creditAmount}::numeric), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          gte(transactions.transactionDate, start),
          lte(transactions.transactionDate, end)
        )
      );

    const monthlyDebits = parseFloat(monthlyResult[0].totalDebits || '0');
    const monthlyCredits = parseFloat(monthlyResult[0].totalCredits || '0');

    // Calculate current total balance (all time)
    const totalResult = await db
      .select({
        totalDebits: sql<string>`COALESCE(SUM(${transactions.debitAmount}::numeric), 0)`,
        totalCredits: sql<string>`COALESCE(SUM(${transactions.creditAmount}::numeric), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.accountId, accountId));

    const totalDebits = parseFloat(totalResult[0].totalDebits || '0');
    const totalCredits = parseFloat(totalResult[0].totalCredits || '0');
    const currentBalance = totalCredits - totalDebits;

    // Calculate historical balance data
    const historicalBalance = await calculateHistoricalBalance(accountId);

    // Update the account with new totals
    await db
      .update(accounts)
      .set({
        totalMonthlyBalance: currentBalance.toFixed(2),
        totalMonthlyDebits: monthlyDebits.toFixed(2),
        totalMonthlyCredits: monthlyCredits.toFixed(2),
        historicalBalance,
      })
      .where(eq(accounts.id, accountId));

    logger.info('Account balance updated', {
      accountId,
      currentBalance: currentBalance.toFixed(2),
      monthlyDebits: monthlyDebits.toFixed(2),
      monthlyCredits: monthlyCredits.toFixed(2),
      historicalMonths: historicalBalance.length,
    });
  } catch (error) {
    logger.error('Error updating account balance', { accountId, error });
    throw error;
  }
}

/**
 * Recalculate and update balances for multiple accounts
 */
export async function updateAccountBalances(accountIds: string[]): Promise<void> {
  for (const accountId of accountIds) {
    await updateAccountBalance(accountId);
  }
}
