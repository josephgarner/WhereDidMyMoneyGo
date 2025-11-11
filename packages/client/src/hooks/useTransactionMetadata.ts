import { useState, useEffect } from 'react';
import { accountBooksApi, TransactionMetadata } from '../api';

export function useTransactionMetadata(accountId: string | null) {
  const [metadata, setMetadata] = useState<TransactionMetadata>({
    minDate: null,
    maxDate: null,
    availableMonths: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setMetadata({ minDate: null, maxDate: null, availableMonths: [] });
      setLoading(false);
      return;
    }

    const accId = accountId; // Capture for closure

    async function fetchMetadata() {
      try {
        setLoading(true);
        const fetchedMetadata = await accountBooksApi.getTransactionMetadata(accId);
        setMetadata(fetchedMetadata);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch transaction metadata');
        console.error('Error fetching transaction metadata:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [accountId]);

  return { metadata, loading, error };
}
