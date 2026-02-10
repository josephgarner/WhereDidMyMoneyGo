import { useState, useEffect, useCallback } from 'react';
import { accountBooksApi, AccountSurplusData } from '../api';

export function useSurplusAnalysis(accountBookId: string | null) {
  const [surplusData, setSurplusData] = useState<AccountSurplusData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!accountBookId) {
      setSurplusData([]);
      setLoading(false);
      return;
    }

    const bookId = accountBookId;

    async function fetchSurplusData() {
      try {
        setLoading(true);
        const data = await accountBooksApi.getSurplusAnalysis(bookId);
        setSurplusData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch surplus analysis data');
      } finally {
        setLoading(false);
      }
    }

    fetchSurplusData();
  }, [accountBookId, refreshKey]);

  return { surplusData, loading, error, refetch };
}
