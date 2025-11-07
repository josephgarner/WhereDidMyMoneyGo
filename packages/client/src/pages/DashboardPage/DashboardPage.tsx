import { useParams } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { useAccounts, useAccountBooks } from '../../hooks';

export function DashboardPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();
  const { accountBooks } = useAccountBooks();
  const { accounts, loading, error } = useAccounts(accountBookId || null);

  const currentAccountBook = accountBooks.find(book => book.id === accountBookId);

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

  const totalBalance = accounts.reduce((sum, account) =>
    sum + parseFloat(account.totalMonthlyBalance), 0
  );
  const totalDebits = accounts.reduce((sum, account) =>
    sum + parseFloat(account.totalMonthlyDebits), 0
  );
  const totalCredits = accounts.reduce((sum, account) =>
    sum + parseFloat(account.totalMonthlyCredits), 0
  );

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="cream.100">
        {currentAccountBook?.name || 'Dashboard'}
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel color="cream.300">Total Monthly Balance</StatLabel>
              <StatNumber color="teal.300" fontSize="3xl">
                ${totalBalance.toFixed(2)}
              </StatNumber>
              <StatHelpText color="cream.400">
                Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel color="cream.300">Total Monthly Debits</StatLabel>
              <StatNumber color="coral.400" fontSize="3xl">
                ${totalDebits.toFixed(2)}
              </StatNumber>
              <StatHelpText color="cream.400">
                Money out
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel color="cream.300">Total Monthly Credits</StatLabel>
              <StatNumber color="powder.400" fontSize="3xl">
                ${totalCredits.toFixed(2)}
              </StatNumber>
              <StatHelpText color="cream.400">
                Money in
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Heading size="md" color="cream.100" mt={4}>
        Recent Activity
      </Heading>

      <Card>
        <CardBody>
          <Text color="cream.300">No recent activity to display.</Text>
        </CardBody>
      </Card>
    </VStack>
  );
}
