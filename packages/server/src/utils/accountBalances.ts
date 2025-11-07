import { db, accounts, transactions } from '../db';
import { eq, sql } from 'drizzle-orm';

/**
 * Recalculate and update an account's balance totals from all its transactions
 */
export async function updateAccountBalance(accountId: string): Promise<void> {
  try {
    // Calculate totals from all transactions for this account
    const result = await db
      .select({
        totalDebits: sql<string>`COALESCE(SUM(${transactions.debitAmount}::numeric), 0)`,
        totalCredits: sql<string>`COALESCE(SUM(${transactions.creditAmount}::numeric), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.accountId, accountId));

    const totals = result[0];
    const totalDebits = parseFloat(totals.totalDebits || '0');
    const totalCredits = parseFloat(totals.totalCredits || '0');
    const balance = totalCredits - totalDebits;

    // Update the account with new totals
    await db
      .update(accounts)
      .set({
        totalMonthlyBalance: balance.toFixed(2),
        totalMonthlyDebits: totalDebits.toFixed(2),
        totalMonthlyCredits: totalCredits.toFixed(2),
      })
      .where(eq(accounts.id, accountId));
  } catch (error) {
    console.error('Error updating account balance:', error);
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
