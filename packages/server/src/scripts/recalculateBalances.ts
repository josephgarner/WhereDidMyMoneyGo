/**
 * Script to recalculate historical balances for all accounts
 * Run this script once to populate the historicalBalance field for existing accounts
 *
 * Usage: npx tsx src/scripts/recalculateBalances.ts
 */
import { db, accounts } from '../db';
import { updateAccountBalance } from '../utils/accountBalances';
import { logger } from '../utils/logger';

async function recalculateAllBalances() {
  try {
    logger.info('Starting balance recalculation for all accounts');

    // Get all accounts
    const allAccounts = await db.select().from(accounts);

    logger.info(`Found ${allAccounts.length} accounts to process`);

    let successCount = 0;
    let errorCount = 0;

    // Recalculate balance for each account
    for (const account of allAccounts) {
      try {
        logger.info(`Processing account: ${account.name} (${account.id})`);
        await updateAccountBalance(account.id);
        successCount++;
        logger.info(`✓ Successfully updated account: ${account.name}`);
      } catch (error) {
        errorCount++;
        logger.error(`✗ Failed to update account: ${account.name}`, { error });
      }
    }

    logger.info('Balance recalculation complete', {
      total: allAccounts.length,
      successful: successCount,
      failed: errorCount,
    });

    console.log('\n=== Summary ===');
    console.log(`Total accounts: ${allAccounts.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Fatal error during balance recalculation', { error });
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

recalculateAllBalances();
