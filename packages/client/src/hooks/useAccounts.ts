import { useState, useEffect } from 'react';
import { Account } from '@finances/shared';
import { accountBooksApi } from '../api';

export function useAccounts(accountBookId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountBookId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    async function fetchAccounts() {
      try {
        setLoading(true);
        const fetchedAccounts = await accountBooksApi.getAccountsByBookId(accountBookId);
        setAccounts(fetchedAccounts);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch accounts');
        console.error('Error fetching accounts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, [accountBookId]);

  return { accounts, loading, error };
}
