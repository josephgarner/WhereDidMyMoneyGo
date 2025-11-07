import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Spinner,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
} from '@chakra-ui/react';
import { useAccounts, useTransactions, useTransactionMetadata } from '../../hooks';
import { TransactionDateFilter, DateFilterValue } from '../../components/organisms/TransactionDateFilter';
import { TransactionFilters } from '../../api';

export function AccountsPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts(accountBookId || null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ type: 'all' });

  // Get transaction metadata for the selected account
  const { metadata } = useTransactionMetadata(selectedAccountId);

  // Build filters for the transactions query
  const transactionFilters: TransactionFilters | undefined = useMemo(() => {
    if (dateFilter.type === 'month' && dateFilter.month) {
      return { month: dateFilter.month };
    } else if (dateFilter.type === 'range' && dateFilter.startDate && dateFilter.endDate) {
      return { startDate: dateFilter.startDate, endDate: dateFilter.endDate };
    }
    return undefined;
  }, [dateFilter]);

  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions(
    selectedAccountId,
    transactionFilters
  );

  if (accountsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Box>
    );
  }

  if (accountsError) {
    return (
      <Box>
        <Text color="coral.500">Error: {accountsError}</Text>
      </Box>
    );
  }

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  // Format dates for the date picker
  const minDate = metadata.minDate ? metadata.minDate.split('T')[0] : undefined;
  const maxDate = metadata.maxDate ? metadata.maxDate.split('T')[0] : undefined;

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
        <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={6}>
          <GridItem>
            <VStack spacing={3} align="stretch">
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  cursor="pointer"
                  bg={selectedAccountId === account.id ? 'teal.900' : undefined}
                  borderColor={selectedAccountId === account.id ? 'teal.500' : 'navy.700'}
                  borderWidth="2px"
                  onClick={() => setSelectedAccountId(account.id)}
                  _hover={{
                    borderColor: 'teal.600',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s',
                  }}
                >
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Heading size="sm" color="cream.100">
                        {account.name}
                      </Heading>
                      <Text color="cream.300" fontSize="xs">
                        Balance
                      </Text>
                      <Text color="teal.300" fontSize="lg" fontWeight="bold">
                        ${parseFloat(account.totalMonthlyBalance).toFixed(2)}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </GridItem>

          <GridItem>
            <VStack spacing={4} align="stretch">
              {selectedAccountId && metadata.availableMonths.length > 0 && (
                <TransactionDateFilter
                  availableMonths={metadata.availableMonths}
                  minDate={minDate}
                  maxDate={maxDate}
                  value={dateFilter}
                  onChange={setDateFilter}
                />
              )}

              <Card minH="500px">
                <CardBody>
                  {!selectedAccountId ? (
                    <Box display="flex" alignItems="center" justifyContent="center" minH="400px">
                      <Text color="cream.400">Select an account to view transactions</Text>
                    </Box>
                  ) : transactionsLoading ? (
                    <Box display="flex" alignItems="center" justifyContent="center" minH="400px">
                      <Spinner size="lg" color="teal.500" thickness="3px" />
                    </Box>
                  ) : transactionsError ? (
                    <Box display="flex" alignItems="center" justifyContent="center" minH="400px">
                      <Text color="coral.500">Error: {transactionsError}</Text>
                    </Box>
                  ) : (
                    <VStack align="stretch" spacing={4}>
                      <Heading size="md" color="cream.100">
                        {selectedAccount?.name} - Transactions
                      </Heading>

                      {transactions.length === 0 ? (
                        <Box display="flex" alignItems="center" justifyContent="center" minH="300px">
                          <Text color="cream.400">No transactions found for this account</Text>
                        </Box>
                      ) : (
                        <TableContainer>
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th color="cream.300" width="110px">Date</Th>
                                <Th color="cream.300" width="250px">Description</Th>
                                <Th color="cream.300" width="150px">Category</Th>
                                <Th color="cream.300" width="100px" isNumeric>Debit</Th>
                                <Th color="cream.300" width="100px" isNumeric>Credit</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {transactions.map((transaction) => (
                                <Tr key={transaction.id}>
                                  <Td color="cream.200" width="110px">
                                    {new Date(transaction.transactionDate).toLocaleDateString()}
                                  </Td>
                                  <Td color="cream.200" width="250px" maxW="250px">
                                    <Text
                                      whiteSpace="normal"
                                      wordBreak="break-word"
                                      noOfLines={2}
                                      title={transaction.description}
                                    >
                                      {transaction.description}
                                    </Text>
                                  </Td>
                                  <Td width="150px">
                                    <VStack align="start" spacing={1}>
                                      <Badge colorScheme="teal" fontSize="xs">
                                        {transaction.category}
                                      </Badge>
                                      {transaction.subCategory && (
                                        <Badge colorScheme="purple" fontSize="xs">
                                          {transaction.subCategory}
                                        </Badge>
                                      )}
                                    </VStack>
                                  </Td>
                                  <Td color="coral.400" width="100px" isNumeric fontWeight="medium">
                                    {parseFloat(transaction.debitAmount) > 0
                                      ? `$${parseFloat(transaction.debitAmount).toFixed(2)}`
                                      : '-'}
                                  </Td>
                                  <Td color="powder.400" width="100px" isNumeric fontWeight="medium">
                                    {parseFloat(transaction.creditAmount) > 0
                                      ? `$${parseFloat(transaction.creditAmount).toFixed(2)}`
                                      : '-'}
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      )}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </GridItem>
        </Grid>
      )}
    </VStack>
  );
}
