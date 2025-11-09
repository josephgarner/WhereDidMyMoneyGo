import { db, categoryRules } from '../db';
import { eq } from 'drizzle-orm';

interface TransactionInput {
  description: string;
  category: string;
  subCategory: string;
}

/**
 * Apply category rules to a transaction based on its description
 * Returns the transaction with potentially updated category/subcategory
 */
export async function applyRulesToTransaction(
  accountBookId: string,
  transaction: TransactionInput
): Promise<TransactionInput> {
  try {
    // Get all rules for this account book
    const rules = await db
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.accountBookId, accountBookId));

    // If no rules, return transaction unchanged
    if (rules.length === 0) {
      return transaction;
    }

    const description = transaction.description.toLowerCase();

    // Find the first matching rule
    // Rules are checked in order, so first match wins
    for (const rule of rules) {
      // Split keywords by comma and trim whitespace
      const keywords = rule.keyword.split(',').map(k => k.trim().toLowerCase());

      // Check if any of the keywords match
      for (const keyword of keywords) {
        if (keyword && description.includes(keyword)) {
          // Rule matched! Apply the category and subcategory from the rule
          return {
            ...transaction,
            category: rule.category,
            subCategory: rule.subCategory || '',
          };
        }
      }
    }

    // No matching rule found, return transaction unchanged
    return transaction;
  } catch (error) {
    console.error('Error applying rules to transaction:', error);
    // On error, return transaction unchanged to avoid breaking the import
    return transaction;
  }
}

/**
 * Apply rules to multiple transactions
 */
export async function applyRulesToTransactions(
  accountBookId: string,
  transactions: TransactionInput[]
): Promise<TransactionInput[]> {
  const processedTransactions: TransactionInput[] = [];

  for (const transaction of transactions) {
    const processedTransaction = await applyRulesToTransaction(
      accountBookId,
      transaction
    );
    processedTransactions.push(processedTransaction);
  }

  return processedTransactions;
}
