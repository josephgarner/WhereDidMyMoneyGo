import { useState, useEffect } from 'react';
import { AccountBook } from '@finances/shared';
import { accountBooksApi } from '../api';

export function useAccountBooks() {
  const [accountBooks, setAccountBooks] = useState<AccountBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccountBooks() {
      try {
        setLoading(true);
        const books = await accountBooksApi.getAllAccountBooks();
        setAccountBooks(books);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch account books');
        console.error('Error fetching account books:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountBooks();
  }, []);

  return { accountBooks, loading, error };
}
