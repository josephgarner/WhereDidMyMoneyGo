import { apiClient } from './client';
import { AccountBook, Account, Transaction, ApiResponse, PaginationMeta } from '@finances/shared';

export interface TransactionMetadata {
  minDate: string | null;
  maxDate: string | null;
  availableMonths: string[];
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

export const accountBooksApi = {
  async getAllAccountBooks(): Promise<AccountBook[]> {
    const response = await apiClient.get<ApiResponse<AccountBook[]>>('/api/account-books');
    return response.data.data || [];
  },

  async getAccountsByBookId(accountBookId: string): Promise<Account[]> {
    const response = await apiClient.get<ApiResponse<Account[]>>(
      `/api/account-books/${accountBookId}/accounts`
    );
    return response.data.data || [];
  },

  async getTransactionMetadata(accountId: string): Promise<TransactionMetadata> {
    const response = await apiClient.get<ApiResponse<TransactionMetadata>>(
      `/api/accounts/${accountId}/transactions/metadata`
    );
    return response.data.data || { minDate: null, maxDate: null, availableMonths: [] };
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
};
