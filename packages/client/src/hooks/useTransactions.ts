import { useState, useEffect } from 'react';
import { Transaction } from '@finances/shared';
import { accountBooksApi } from '../api';

export function useTransactions(accountId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    async function fetchTransactions() {
      try {
        setLoading(true);
        const fetchedTransactions = await accountBooksApi.getTransactionsByAccountId(accountId);
        setTransactions(fetchedTransactions);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch transactions');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [accountId]);

  return { transactions, loading, error };
}
