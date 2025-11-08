import { apiClient } from './client';
import { AccountBook, Account, Transaction, CategoryRule, ApiResponse, PaginationMeta } from '@finances/shared';

export interface MonthlyBalance {
  month: string;
  balance: number;
}

export interface AccountHistoricalBalance {
  accountId: string;
  accountName: string;
  data: MonthlyBalance[];
}

export interface AccountRecentTransactions {
  accountId: string;
  accountName: string;
  transactions: Transaction[];
}

export interface DashboardData {
  historicalBalances: AccountHistoricalBalance[];
  recentTransactions: AccountRecentTransactions[];
}

export interface TransactionMetadata {
  minDate: string | null;
  maxDate: string | null;
  availableMonths: string[];
}

export interface CategorySuggestions {
  categories: string[];
  subCategories: string[];
}

export interface TransactionFilters {
  month?: string; // YYYY-MM
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface TransactionsResult {
  transactions: Transaction[];
  pagination: PaginationMeta | null;
}

export interface CreateTransactionData {
  transactionDate: string; // ISO date string
  description: string;
  category: string;
  subCategory?: string;
  debitAmount?: string;
  creditAmount?: string;
}

export interface CreateAccountData {
  name: string;
  startingBalance?: string;
}

export interface CreateRuleData {
  keyword: string;
  category: string;
  subCategory?: string;
}

export const accountBooksApi = {
  async getAllAccountBooks(): Promise<AccountBook[]> {
    const response = await apiClient.get<ApiResponse<AccountBook[]>>('/api/account-books');
    return response.data.data || [];
  },

  async getDashboardData(accountBookId: string): Promise<DashboardData> {
    const response = await apiClient.get<ApiResponse<DashboardData>>(
      `/api/account-books/${accountBookId}/dashboard-data`
    );
    if (!response.data.data) {
      throw new Error('No data returned from dashboard');
    }
    return response.data.data;
  },

  async getAccountsByBookId(accountBookId: string): Promise<Account[]> {
    const response = await apiClient.get<ApiResponse<Account[]>>(
      `/api/account-books/${accountBookId}/accounts`
    );
    return response.data.data || [];
  },

  async createAccount(
    accountBookId: string,
    data: CreateAccountData
  ): Promise<Account> {
    const response = await apiClient.post<ApiResponse<Account>>(
      `/api/account-books/${accountBookId}/accounts`,
      data
    );
    if (!response.data.data) {
      throw new Error('No data returned from create account');
    }
    return response.data.data;
  },

  async deleteAccount(accountBookId: string, accountId: string): Promise<void> {
    await apiClient.delete(`/api/account-books/${accountBookId}/accounts/${accountId}`);
  },

  async getTransactionMetadata(accountId: string): Promise<TransactionMetadata> {
    const response = await apiClient.get<ApiResponse<TransactionMetadata>>(
      `/api/accounts/${accountId}/transactions/metadata`
    );
    return response.data.data || { minDate: null, maxDate: null, availableMonths: [] };
  },

  async getCategorySuggestions(accountId: string): Promise<CategorySuggestions> {
    const response = await apiClient.get<ApiResponse<CategorySuggestions>>(
      `/api/accounts/${accountId}/categories`
    );
    return response.data.data || { categories: [], subCategories: [] };
  },

  async getTransactionsByAccountId(
    accountId: string,
    filters?: TransactionFilters
  ): Promise<TransactionsResult> {
    const params = new URLSearchParams();

    if (filters?.month) {
      params.append('month', filters.month);
    } else if (filters?.startDate && filters?.endDate) {
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
    }

    if (filters?.page) {
      params.append('page', filters.page.toString());
    }

    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = `/api/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ApiResponse<Transaction[]>>(url);
    return {
      transactions: response.data.data || [],
      pagination: response.data.pagination || null,
    };
  },

  async createTransaction(
    accountId: string,
    data: CreateTransactionData
  ): Promise<Transaction> {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      `/api/accounts/${accountId}/transactions`,
      data
    );
    return response.data.data as Transaction;
  },

  async updateTransaction(
    accountId: string,
    transactionId: string,
    data: CreateTransactionData
  ): Promise<Transaction> {
    const response = await apiClient.put<ApiResponse<Transaction>>(
      `/api/accounts/${accountId}/transactions/${transactionId}`,
      data
    );
    return response.data.data as Transaction;
  },

  async uploadQIFFile(accountId: string, file: File): Promise<{
    imported: number;
    failed: number;
    parseErrors: number;
    errors?: string[];
  }> {
    const formData = new FormData();
    formData.append('qifFile', file);

    const response = await apiClient.post<ApiResponse<{
      imported: number;
      failed: number;
      parseErrors: number;
      errors?: string[];
    }>>(
      `/api/accounts/${accountId}/transactions/upload-qif`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    if (!response.data.data) {
      throw new Error('No data returned from upload');
    }
    return response.data.data;
  },

  async deleteTransaction(accountId: string, transactionId: string): Promise<void> {
    await apiClient.delete(`/api/accounts/${accountId}/transactions/${transactionId}`);
  },

  async deleteTransactionsByMonth(accountId: string, month: string): Promise<{ deletedCount: number }> {
    const response = await apiClient.delete<ApiResponse<{ deletedCount: number }>>(
      `/api/accounts/${accountId}/transactions/bulk/by-month?month=${month}`
    );
    if (!response.data.data) {
      throw new Error('No data returned from delete');
    }
    return response.data.data;
  },

  // Category Rules API
  async getRules(accountBookId: string): Promise<CategoryRule[]> {
    const response = await apiClient.get<ApiResponse<CategoryRule[]>>(
      `/api/account-books/${accountBookId}/rules`
    );
    return response.data.data || [];
  },

  async createRule(accountBookId: string, data: CreateRuleData): Promise<CategoryRule> {
    const response = await apiClient.post<ApiResponse<CategoryRule>>(
      `/api/account-books/${accountBookId}/rules`,
      data
    );
    if (!response.data.data) {
      throw new Error('No data returned from create rule');
    }
    return response.data.data;
  },

  async updateRule(
    accountBookId: string,
    ruleId: string,
    data: CreateRuleData
  ): Promise<CategoryRule> {
    const response = await apiClient.put<ApiResponse<CategoryRule>>(
      `/api/account-books/${accountBookId}/rules/${ruleId}`,
      data
    );
    if (!response.data.data) {
      throw new Error('No data returned from update rule');
    }
    return response.data.data;
  },

  async deleteRule(accountBookId: string, ruleId: string): Promise<void> {
    await apiClient.delete(`/api/account-books/${accountBookId}/rules/${ruleId}`);
  },
};
