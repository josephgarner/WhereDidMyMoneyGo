import { apiClient } from './client';
import { AccountBook, Account, Transaction, ApiResponse } from '@finances/shared';

export interface TransactionMetadata {
  minDate: string | null;
  maxDate: string | null;
  availableMonths: string[];
}

export interface TransactionFilters {
  month?: string; // YYYY-MM
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
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
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();

    if (filters?.month) {
      params.append('month', filters.month);
    } else if (filters?.startDate && filters?.endDate) {
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = `/api/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ApiResponse<Transaction[]>>(url);
    return response.data.data || [];
  },
};
