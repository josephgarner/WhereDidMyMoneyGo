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
} from '@chakra-ui/react';
import { useAccounts } from '../hooks';

export function AccountsPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();
  const { accounts, loading, error } = useAccounts(accountBookId || null);

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

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="cream.100">
        Accounts
      </Heading>

      {accounts.length === 0 ? (
        <Card>
          <CardBody>
            <Text color="cream.300">No accounts found for this account book.</Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <Heading size="md" color="cream.100">
                    {account.name}
                  </Heading>

                  <Box w="full">
                    <Text color="cream.300" fontSize="sm">
                      Monthly Balance
                    </Text>
                    <Text color="teal.300" fontSize="2xl" fontWeight="bold">
                      ${parseFloat(account.totalMonthlyBalance).toFixed(2)}
                    </Text>
                  </Box>

                  <SimpleGrid columns={2} spacing={4} w="full">
                    <Box>
                      <Text color="cream.400" fontSize="xs">
                        Debits
                      </Text>
                      <Text color="coral.400" fontWeight="medium">
                        ${parseFloat(account.totalMonthlyDebits).toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="cream.400" fontSize="xs">
                        Credits
                      </Text>
                      <Text color="powder.400" fontWeight="medium">
                        ${parseFloat(account.totalMonthlyCredits).toFixed(2)}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
}
