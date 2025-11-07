import { useState, useEffect, useCallback } from 'react';
import { Transaction, PaginationMeta } from '@finances/shared';
import { accountBooksApi, TransactionFilters } from '../api';

export function useTransactions(accountId: string | null, filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!accountId) {
      setTransactions([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    async function fetchTransactions() {
      try {
        setLoading(true);
        const result = await accountBooksApi.getTransactionsByAccountId(
          accountId,
          filters
        );
        setTransactions(result.transactions);
        setPagination(result.pagination);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch transactions');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [accountId, filters?.month, filters?.startDate, filters?.endDate, filters?.page, filters?.limit, refreshKey]);

  return { transactions, pagination, loading, error, refetch };
}
