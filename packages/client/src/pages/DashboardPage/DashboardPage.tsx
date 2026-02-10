import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
} from '@chakra-ui/react';
import { useAccountBooks, useAccounts, useLocalStorage, useSurplusAnalysis } from '../../hooks';
import { accountBooksApi, DashboardData } from '../../api';
import {
  AccountBalanceChart,
  AccountSparklineGrid,
  SurplusAnalysisTable,
} from '../../components/organisms';

export function DashboardPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();
  const { accountBooks } = useAccountBooks();
  const { accounts } = useAccounts(accountBookId || null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local storage for selected account - keyed by accountBookId
  const [selectedAccountId, setSelectedAccountId] = useLocalStorage<string | null>(
    `dashboard-selected-account-${accountBookId}`,
    null
  );

  // Auto-select first account if none selected and accounts are loaded
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId, setSelectedAccountId]);

  const currentAccountBook = accountBooks.find(book => book.id === accountBookId);

  // Surplus analysis
  const { surplusData } = useSurplusAnalysis(accountBookId || null);

  useEffect(() => {
    if (!accountBookId) {
      setLoading(false);
      return;
    }

    async function fetchDashboardData() {
      try {
        setLoading(true);
        const data = await accountBooksApi.getDashboardData(accountBookId!);
        setDashboardData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [accountBookId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="coral.500">Error: {error}</Text>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box>
        <Text color="cream.300">No dashboard data available</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="cream.100">
        {currentAccountBook?.name || 'Dashboard'}
      </Heading>

      {/* Surplus Analysis */}
      <Heading size="md" color="cream.100">
        Surplus Analysis (Last 6 Months)
      </Heading>
      <SurplusAnalysisTable surplusData={surplusData} />

      {/* Account Balance Sparklines */}
      <Heading size="md" color="cream.100">
        Account Balances (Last 6 Months)
      </Heading>
      <AccountSparklineGrid historicalBalances={dashboardData.historicalBalances} />

      {/* 24-Month Balance Chart for Selected Account */}
      {accountBookId && accounts.length > 0 && (
        <AccountBalanceChart
          accountBookId={accountBookId}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
        />
      )}
    </VStack>
  );
}
