import { useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Grid,
  GridItem,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { useAccounts } from '../../hooks';
import { AccountSidebar, TransactionPanel } from '../../components/organisms';
import { ConfirmDialog } from '../../components/molecules';
import { accountBooksApi } from '../../api';

export function AccountsPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();
  const toast = useToast();

  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = useAccounts(accountBookId || null);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const { isOpen: isDeleteAccountOpen, onOpen: onDeleteAccountOpen, onClose: onDeleteAccountClose } = useDisclosure();

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleRecalculateBalances = async () => {
    if (!accountBookId) return;

    setIsRecalculating(true);
    try {
      const result = await accountBooksApi.recalculateBalances(accountBookId);
      toast({
        title: 'Balances Recalculated',
        description: `Successfully updated ${result.successful} of ${result.total} accounts`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refetchAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to recalculate balances',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleDeleteAccountClick = (accountId: string) => {
    setAccountToDelete(accountId);
    onDeleteAccountOpen();
  };

  const handleDeleteAccountConfirm = async () => {
    if (!accountBookId || !accountToDelete) return;

    try {
      await accountBooksApi.deleteAccount(accountBookId, accountToDelete);
      toast({
        title: 'Account Deleted',
        description: 'The account and all its transactions have been deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (selectedAccountId === accountToDelete) {
        setSelectedAccountId(null);
      }

      refetchAccounts();
      onDeleteAccountClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="cream.100">
        Accounts
      </Heading>

      <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={2}>
        <GridItem>
          {accountBookId && (
            <AccountSidebar
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onAccountSelect={handleAccountChange}
              onAccountDelete={handleDeleteAccountClick}
              accountBookId={accountBookId}
              onAccountAdded={refetchAccounts}
              onRecalculate={handleRecalculateBalances}
              isRecalculating={isRecalculating}
            />
          )}
        </GridItem>

        <GridItem>
          {accountBookId && (
            <TransactionPanel
              selectedAccountId={selectedAccountId}
              selectedAccountName={selectedAccount?.name}
              accountBookId={accountBookId}
              onTransactionChange={refetchAccounts}
            />
          )}
        </GridItem>
      </Grid>

      <ConfirmDialog
        isOpen={isDeleteAccountOpen}
        onClose={onDeleteAccountClose}
        onConfirm={handleDeleteAccountConfirm}
        title="Delete Account"
        message="Are you sure? This will permanently delete the account and all its transactions. This action cannot be undone."
      />
    </VStack>
  );
}
