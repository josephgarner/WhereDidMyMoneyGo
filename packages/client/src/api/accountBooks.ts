import { apiClient } from './client';
import { AccountBook, Account, Transaction, ApiResponse } from '@finances/shared';

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

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      `/api/accounts/${accountId}/transactions`
    );
    return response.data.data || [];
  },
};
