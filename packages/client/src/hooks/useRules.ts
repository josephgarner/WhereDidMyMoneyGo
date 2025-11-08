import { useState, useEffect } from 'react';
import { CategoryRule } from '@finances/shared';
import { accountBooksApi } from '../api';

export function useRules(accountBookId: string | null) {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    if (!accountBookId) {
      setRules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await accountBooksApi.getRules(accountBookId);
      setRules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [accountBookId]);

  return {
    rules,
    loading,
    error,
    refetch: fetchRules,
  };
}
