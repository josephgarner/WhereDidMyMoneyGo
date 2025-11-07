import { useState, useEffect } from 'react';
import { accountBooksApi, CategorySuggestions } from '../api';

export function useCategorySuggestions(accountId: string | null) {
  const [suggestions, setSuggestions] = useState<CategorySuggestions>({
    categories: [],
    subCategories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setSuggestions({ categories: [], subCategories: [] });
      setLoading(false);
      return;
    }

    async function fetchSuggestions() {
      try {
        setLoading(true);
        const fetchedSuggestions = await accountBooksApi.getCategorySuggestions(accountId);
        setSuggestions(fetchedSuggestions);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch category suggestions');
        console.error('Error fetching category suggestions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [accountId]);

  return { suggestions, loading, error };
}
