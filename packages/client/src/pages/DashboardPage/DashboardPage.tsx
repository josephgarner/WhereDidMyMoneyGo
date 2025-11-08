import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Spinner,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
} from '@chakra-ui/react';
import { ResponsiveLine } from '@nivo/line';
import { useAccountBooks, useAccounts, useLocalStorage } from '../../hooks';
import { accountBooksApi, DashboardData } from '../../api';
import { AccountBalanceChart } from '../../components/organisms';

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

      {/* Account Balance Charts */}
      <Heading size="md" color="cream.100">
        Account Balances (Last 6 Months)
      </Heading>

      {dashboardData.historicalBalances.length === 0 ? (
        <Card>
          <CardBody>
            <Text color="cream.400" textAlign="center">
              No accounts or historical data available
            </Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
          {dashboardData.historicalBalances.map((accountData) => {
            const chartData = [{
              id: accountData.accountName,
              data: accountData.data.map((point) => ({
                x: point.month,
                y: point.balance,
              })),
            }];

            const hasData = accountData.data.length > 0;

            return (
              <Card key={accountData.accountId} maxW="150px">
                <CardBody p={3}>
                  <Heading size="xs" color="cream.100" mb={2} noOfLines={1} title={accountData.accountName}>
                    {accountData.accountName}
                  </Heading>
                  {hasData ? (
                    <Box height="100px" width="100%">
                      <ResponsiveLine
                        data={chartData}
                        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                        xScale={{ type: 'point' }}
                        yScale={{
                          type: 'linear',
                          min: 'auto',
                          max: 'auto',
                          stacked: false,
                          reverse: false,
                        }}
                        yFormat=" >-$.2f"
                        curve="monotoneX"
                        axisTop={null}
                        axisRight={null}
                        axisBottom={null}
                        axisLeft={null}
                        colors={['#4FD1C5']}
                        pointSize={0}
                        pointColor={{ theme: 'background' }}
                        pointBorderWidth={0}
                        pointBorderColor={{ from: 'serieColor' }}
                        enableGridX={false}
                        enableGridY={false}
                        useMesh={true}
                        theme={{
                          tooltip: {
                            container: {
                              background: '#1a2332',
                              color: '#f5f3e7',
                              fontSize: '11px',
                              borderRadius: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100px">
                      <Text color="cream.400" fontSize="xs">No data</Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {/* 24-Month Balance Chart for Selected Account */}
      {accountBookId && accounts.length > 0 && (
        <AccountBalanceChart
          accountBookId={accountBookId}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
        />
      )}

      {/* Recent Transactions by Account */}
      <Heading size="md" color="cream.100" mt={4}>
        Recent Transactions
      </Heading>

      {dashboardData.recentTransactions.length === 0 ? (
        <Card>
          <CardBody>
            <Text color="cream.400" textAlign="center">
              No recent transactions to display
            </Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {dashboardData.recentTransactions.map((accountData) => (
            <Card key={accountData.accountId}>
              <CardBody>
                <Heading size="sm" color="cream.100" mb={3}>
                  {accountData.accountName}
                </Heading>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="cream.300" fontSize="xs">Date</Th>
                        <Th color="cream.300" fontSize="xs">Description</Th>
                        <Th color="cream.300" fontSize="xs" isNumeric>Amount</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {accountData.transactions.map((transaction) => {
                        const debit = parseFloat(transaction.debitAmount);
                        const credit = parseFloat(transaction.creditAmount);
                        const amount = credit > 0 ? credit : -debit;
                        const isPositive = amount > 0;

                        return (
                          <Tr key={transaction.id}>
                            <Td color="cream.200" fontSize="xs">
                              {new Date(transaction.transactionDate).toLocaleDateString()}
                            </Td>
                            <Td color="cream.200" fontSize="xs">
                              <VStack align="start" spacing={0}>
                                <Text noOfLines={1}>{transaction.description}</Text>
                                <Badge colorScheme="teal" fontSize="xx-small">
                                  {transaction.category}
                                </Badge>
                              </VStack>
                            </Td>
                            <Td
                              color={isPositive ? 'powder.400' : 'coral.400'}
                              fontSize="xs"
                              isNumeric
                              fontWeight="medium"
                            >
                              {isPositive ? '+' : ''}${Math.abs(amount).toFixed(2)}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
}
