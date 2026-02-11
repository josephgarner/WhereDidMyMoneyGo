import { useState, useMemo, useEffect } from 'react';
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
  IconButton,
  HStack,
  Button,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { FaTrash, FaPen } from 'react-icons/fa6';
import { Transaction } from '@finances/shared';
import {
  useTransactions,
  useTransactionMetadata,
  useCategorySuggestions,
} from '../../hooks';
import {
  TransactionDateFilter,
  DateFilterValue,
  TransactionCategoryFilter,
  CategoryFilterValue,
  AddTransactionForm,
  EditTransactionModal,
  UploadQIFForm,
} from './index';
import { Pagination } from '../molecules';
import { ConfirmDialog } from '../molecules';
import { TransactionFilters, accountBooksApi } from '../../api';

export interface TransactionPanelProps {
  selectedAccountId: string | null;
  selectedAccountName?: string;
  accountBookId: string;
  onTransactionChange: () => void;
}

export function TransactionPanel({
  selectedAccountId,
  selectedAccountName,
  accountBookId,
  onTransactionChange,
}: TransactionPanelProps) {
  const toast = useToast();

  // Filter state
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ type: 'all' });
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>({ type: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal/dialog state
  const { isOpen: isAddTransactionOpen, onOpen: onAddTransactionOpen, onClose: onAddTransactionClose } = useDisclosure();
  const { isOpen: isEditTransactionOpen, onOpen: onEditTransactionOpen, onClose: onEditTransactionClose } = useDisclosure();
  const { isOpen: isUploadQIFOpen, onOpen: onUploadQIFOpen, onClose: onUploadQIFClose } = useDisclosure();
  const { isOpen: isDeleteTransactionOpen, onOpen: onDeleteTransactionOpen, onClose: onDeleteTransactionClose } = useDisclosure();
  const { isOpen: isDeleteMonthOpen, onOpen: onDeleteMonthOpen, onClose: onDeleteMonthClose } = useDisclosure();

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Hooks
  const { metadata } = useTransactionMetadata(selectedAccountId);
  const { suggestions } = useCategorySuggestions(selectedAccountId);

  // Reset filters when account changes
  useEffect(() => {
    setDateFilter({ type: 'all' });
    setCategoryFilter({ type: 'all' });
    setCurrentPage(1);
  }, [selectedAccountId]);

  const handleDateFilterChange = (newFilter: DateFilterValue) => {
    setDateFilter(newFilter);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (newFilter: CategoryFilterValue) => {
    setCategoryFilter(newFilter);
    setCurrentPage(1);
  };

  // Build filters
  const transactionFilters: TransactionFilters | undefined = useMemo(() => {
    const filters: TransactionFilters = {
      page: currentPage,
      limit: pageSize,
    };

    if (dateFilter.type === 'month' && dateFilter.month) {
      filters.month = dateFilter.month;
    } else if (dateFilter.type === 'range' && dateFilter.startDate && dateFilter.endDate) {
      filters.startDate = dateFilter.startDate;
      filters.endDate = dateFilter.endDate;
    }

    if (categoryFilter.type === 'category' && categoryFilter.category) {
      filters.category = categoryFilter.category;
    }

    return filters;
  }, [dateFilter, categoryFilter, currentPage, pageSize]);

  const {
    transactions,
    pagination,
    loading: transactionsLoading,
    error: transactionsError,
    refetch,
  } = useTransactions(selectedAccountId, transactionFilters);

  // Handlers
  const handleTransactionAdded = () => {
    refetch();
    onTransactionChange();
    onAddTransactionClose();
  };

  const handleQIFUploadSuccess = () => {
    refetch();
    onTransactionChange();
    onUploadQIFClose();
  };

  const handleEditTransactionClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    onEditTransactionOpen();
  };

  const handleEditTransactionSuccess = () => {
    refetch();
    onTransactionChange();
    onEditTransactionClose();
  };

  const handleDeleteTransactionClick = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    onDeleteTransactionOpen();
  };

  const handleDeleteTransactionConfirm = async () => {
    if (!selectedAccountId || !transactionToDelete) return;

    try {
      await accountBooksApi.deleteTransaction(selectedAccountId, transactionToDelete);
      toast({
        title: 'Transaction Deleted',
        description: 'The transaction has been deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      refetch();
      onTransactionChange();
      onDeleteTransactionClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteMonthConfirm = async () => {
    if (!selectedAccountId || dateFilter.type !== 'month' || !dateFilter.month) return;

    try {
      const result = await accountBooksApi.deleteTransactionsByMonth(selectedAccountId, dateFilter.month);
      toast({
        title: 'Transactions Deleted',
        description: `Deleted ${result.deletedCount} transaction(s) for ${dateFilter.month}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      refetch();
      onTransactionChange();
      onDeleteMonthClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete transactions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const minDate = metadata.minDate ? metadata.minDate.split('T')[0] : undefined;
  const maxDate = metadata.maxDate ? metadata.maxDate.split('T')[0] : undefined;

  return (
    <VStack spacing={2} align="stretch">
      {selectedAccountId && (
        <HStack spacing={2} wrap="wrap">
          <Button
            size="sm"
            colorScheme="teal"
            variant="solid"
            onClick={onAddTransactionOpen}
          >
            Add Transaction
          </Button>
          <Button
            size="sm"
            colorScheme="teal"
            variant="outline"
            onClick={onUploadQIFOpen}
          >
            Import QIF File
          </Button>
          {dateFilter.type === 'month' && dateFilter.month && (
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              leftIcon={<FaTrash />}
              onClick={onDeleteMonthOpen}
            >
              Delete Month Transactions
            </Button>
          )}
        </HStack>
      )}

      {selectedAccountId && (metadata.availableMonths.length > 0 || suggestions.categories.length > 0) && (
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={2}>
          {metadata.availableMonths.length > 0 && (
            <GridItem>
              <TransactionDateFilter
                availableMonths={metadata.availableMonths}
                minDate={minDate}
                maxDate={maxDate}
                value={dateFilter}
                onChange={handleDateFilterChange}
              />
            </GridItem>
          )}

          {suggestions.categories.length > 0 && (
            <GridItem>
              <TransactionCategoryFilter
                availableCategories={suggestions.categories}
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
              />
            </GridItem>
          )}
        </Grid>
      )}

      <Card minH="100px">
        <CardBody position="relative">
          {!selectedAccountId ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="400px"
            >
              <Text color="cream.400">
                Select an account to view transactions
              </Text>
            </Box>
          ) : transactionsError ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="400px"
            >
              <Text color="coral.500">Error: {transactionsError}</Text>
            </Box>
          ) : transactions.length === 0 && transactionsLoading ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="400px"
            >
              <Spinner size="lg" color="teal.500" thickness="3px" />
            </Box>
          ) : (
            <Box position="relative">
              {transactionsLoading && (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  bg="rgba(26, 35, 50, 0.7)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  zIndex={10}
                  borderRadius="md"
                >
                  <Spinner size="lg" color="teal.500" thickness="3px" />
                </Box>
              )}
              <VStack align="stretch" spacing={4}>
                <Heading size="md" color="cream.100">
                  {selectedAccountName} - Transactions
                </Heading>

                {transactions.length === 0 ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minH="300px"
                  >
                    <Text color="cream.400">
                      No transactions found for this account
                    </Text>
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
                          <Th color="cream.300" width="80px"></Th>
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
                            <Td width="80px">
                              <HStack spacing={1}>
                                <IconButton
                                  aria-label="Edit transaction"
                                  icon={<FaPen />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="teal"
                                  onClick={() => handleEditTransactionClick(transaction)}
                                />
                                <IconButton
                                  aria-label="Delete transaction"
                                  icon={<FaTrash />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDeleteTransactionClick(transaction.id)}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}

                {pagination && pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalCount}
                    pageSize={pagination.limit}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  />
                )}
              </VStack>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Add Transaction Modal */}
      {selectedAccountId && (
        <AddTransactionForm
          isOpen={isAddTransactionOpen}
          onClose={onAddTransactionClose}
          accountId={selectedAccountId}
          accountBookId={accountBookId}
          onSuccess={handleTransactionAdded}
        />
      )}

      {/* Edit Transaction Modal */}
      {transactionToEdit && (
        <EditTransactionModal
          isOpen={isEditTransactionOpen}
          onClose={onEditTransactionClose}
          transaction={transactionToEdit}
          accountBookId={accountBookId}
          onSuccess={handleEditTransactionSuccess}
        />
      )}

      {/* Upload QIF Modal */}
      {selectedAccountId && (
        <UploadQIFForm
          isOpen={isUploadQIFOpen}
          onClose={onUploadQIFClose}
          accountId={selectedAccountId}
          onSuccess={handleQIFUploadSuccess}
        />
      )}

      {/* Delete Transaction Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteTransactionOpen}
        onClose={onDeleteTransactionClose}
        onConfirm={handleDeleteTransactionConfirm}
        title="Delete Transaction"
        message="Are you sure? This will permanently delete this transaction. This action cannot be undone."
      />

      {/* Delete Month Transactions Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteMonthOpen}
        onClose={onDeleteMonthClose}
        onConfirm={handleDeleteMonthConfirm}
        title="Delete Month Transactions"
        message={`Are you sure? This will permanently delete all transactions for ${dateFilter.type === 'month' ? dateFilter.month : 'this month'}. This action cannot be undone.`}
        confirmLabel="Delete All"
      />
    </VStack>
  );
}
