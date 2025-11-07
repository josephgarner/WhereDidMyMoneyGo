/**
 * QIF (Quicken Interchange Format) Parser
 *
 * QIF Format:
 * - Lines starting with specific codes represent different fields
 * - ^ indicates end of transaction
 *
 * Common codes:
 * D = Date
 * T = Amount (negative for debits, positive for credits)
 * P = Payee/Description
 * M = Memo
 * L = Category (can include subcategory as Category:SubCategory)
 * N = Number (check number, etc.)
 * C = Cleared status
 * ^ = End of transaction
 */

export interface ParsedQIFTransaction {
  transactionDate: Date;
  description: string;
  category: string;
  subCategory?: string;
  debitAmount: string;
  creditAmount: string;
  memo?: string;
}

export interface QIFParseResult {
  transactions: ParsedQIFTransaction[];
  errors: string[];
}

/**
 * Parse a date from QIF format
 * QIF dates can be in various formats: MM/DD/YYYY, MM/DD/YY, M/D/YY, etc.
 */
function parseQIFDate(dateString: string): Date {
  // Remove any extra whitespace
  dateString = dateString.trim();

  // Handle various date formats
  // Try MM/DD/YYYY or M/D/YYYY or MM/DD/YY
  const parts = dateString.split('/');
  if (parts.length === 3) {
    let month = parseInt(parts[0], 10);
    let day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    return new Date(year, month - 1, day);
  }

  // If we can't parse it, try using Date constructor as fallback
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  return date;
}

/**
 * Parse category and subcategory from QIF format
 * Format: "Category:SubCategory" or just "Category"
 */
function parseCategory(categoryString: string): { category: string; subCategory?: string } {
  const parts = categoryString.split(':');
  return {
    category: parts[0].trim(),
    subCategory: parts[1]?.trim(),
  };
}

/**
 * Parse QIF file content into transactions
 */
export function parseQIFFile(content: string): QIFParseResult {
  const transactions: ParsedQIFTransaction[] = [];
  const errors: string[] = [];

  const lines = content.split(/\r?\n/);

  let currentTransaction: Partial<ParsedQIFTransaction> = {};
  let lineNumber = 0;
  let transactionNumber = 0;

  for (const line of lines) {
    lineNumber++;
    const trimmedLine = line.trim();

    // Skip empty lines and header lines
    if (!trimmedLine || trimmedLine.startsWith('!')) {
      continue;
    }

    const code = trimmedLine.charAt(0);
    const value = trimmedLine.substring(1).trim();

    try {
      switch (code) {
        case 'D': // Date
          currentTransaction.transactionDate = parseQIFDate(value);
          break;

        case 'T': // Amount
          const amount = parseFloat(value);
          if (isNaN(amount)) {
            errors.push(`Line ${lineNumber}: Invalid amount "${value}"`);
          } else {
            // Negative amounts are debits, positive are credits
            if (amount < 0) {
              currentTransaction.debitAmount = Math.abs(amount).toFixed(2);
              currentTransaction.creditAmount = '0.00';
            } else {
              currentTransaction.debitAmount = '0.00';
              currentTransaction.creditAmount = amount.toFixed(2);
            }
          }
          break;

        case 'P': // Payee/Description
          currentTransaction.description = value;
          break;

        case 'M': // Memo
          currentTransaction.memo = value;
          break;

        case 'L': // Category
          if (value) {
            const { category, subCategory } = parseCategory(value);
            currentTransaction.category = category;
            currentTransaction.subCategory = subCategory;
          }
          break;

        case 'N': // Number (check number, etc.) - we'll ignore this for now
          break;

        case 'C': // Cleared status - we'll ignore this for now
          break;

        case '^': // End of transaction
          transactionNumber++;

          // Validate required fields
          if (!currentTransaction.transactionDate) {
            errors.push(`Transaction ${transactionNumber}: Missing date`);
          } else if (!currentTransaction.description) {
            errors.push(`Transaction ${transactionNumber}: Missing description`);
          } else if (!currentTransaction.debitAmount && !currentTransaction.creditAmount) {
            errors.push(`Transaction ${transactionNumber}: Missing amount`);
          } else if (!currentTransaction.category) {
            errors.push(`Transaction ${transactionNumber}: Missing category`);
          } else {
            // Transaction is valid, add it
            transactions.push(currentTransaction as ParsedQIFTransaction);
          }

          // Reset for next transaction
          currentTransaction = {};
          break;

        default:
          // Unknown code, we'll just skip it
          break;
      }
    } catch (error: any) {
      errors.push(`Line ${lineNumber}: ${error.message}`);
    }
  }

  // Check if there's an incomplete transaction at the end
  if (Object.keys(currentTransaction).length > 0) {
    errors.push(`Incomplete transaction at end of file (missing ^ terminator)`);
  }

  return { transactions, errors };
}
