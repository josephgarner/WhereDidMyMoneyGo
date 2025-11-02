export interface AccountBook {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  name: string;
  totalMonthlyBalance: string;
  totalMonthlyDebits: string;
  totalMonthlyCredits: string;
  accountBookId: string;
  historicalBalance: {
    month: string;
    debits: number;
    credits: number;
    balance?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  transactionDate: Date;
  description: string;
  category: string;
  subCategory: string;
  debitAmount: string;
  creditAmount: string;
  linkedTransactionId?: string;
  accountId: string;
  accountBookId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryRule {
  id: string;
  accountBookId: string;
  keyword: string;
  category: string;
  subCategory: string;
  createdAt: Date;
  updatedAt: Date;
}
