import {
  VStack,
  Card,
  CardBody,
  Heading,
  Text,
  HStack,
  IconButton,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { FaTrash, FaPlus, FaRotate } from 'react-icons/fa6';
import { Account } from '@finances/shared';
import { AddAccountForm } from './AddAccountForm';

export interface AccountSidebarProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onAccountSelect: (accountId: string) => void;
  onAccountDelete: (accountId: string) => void;
  accountBookId: string;
  onAccountAdded: () => void;
  onRecalculate: () => void;
  isRecalculating: boolean;
}

export function AccountSidebar({
  accounts,
  selectedAccountId,
  onAccountSelect,
  onAccountDelete,
  accountBookId,
  onAccountAdded,
  onRecalculate,
  isRecalculating,
}: AccountSidebarProps) {
  const {
    isOpen: isAddAccountOpen,
    onOpen: onAddAccountOpen,
    onClose: onAddAccountClose,
  } = useDisclosure();

  const handleAccountAdded = () => {
    onAccountAdded();
    onAddAccountClose();
  };

  return (
    <VStack spacing={2} align="stretch">
      <HStack spacing={2}>
        <Button
          size="sm"
          colorScheme="teal"
          leftIcon={<FaPlus />}
          onClick={onAddAccountOpen}
          flex={1}
        >
          Add Account
        </Button>
        <Button
          size="sm"
          colorScheme="teal"
          variant="outline"
          leftIcon={<FaRotate />}
          onClick={onRecalculate}
          isLoading={isRecalculating}
          loadingText="Recalculating..."
        >
          Recalculate
        </Button>
      </HStack>

      {accounts.length === 0 ? (
        <Card>
          <CardBody>
            <Text color="cream.300" textAlign="center">
              No accounts yet. Create one above to get started.
            </Text>
          </CardBody>
        </Card>
      ) : (
        accounts.map((account) => (
          <Card
            key={account.id}
            cursor="pointer"
            bg={selectedAccountId === account.id ? 'teal.900' : undefined}
            borderColor={
              selectedAccountId === account.id ? 'teal.500' : 'navy.700'
            }
            borderWidth="2px"
            onClick={() => onAccountSelect(account.id)}
            _hover={{
              borderColor: 'teal.600',
              transform: 'translateY(-2px)',
              transition: 'all 0.2s',
            }}
          >
            <CardBody>
              <HStack justify="space-between" align="start" mb={2}>
                <Heading size="sm" color="cream.100">
                  {account.name}
                </Heading>
                <IconButton
                  aria-label="Delete account"
                  icon={<FaTrash />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccountDelete(account.id);
                  }}
                />
              </HStack>
              <VStack align="start" spacing={2}>
                <Text color="cream.300" fontSize="xs">
                  Balance
                </Text>
                <Text color="teal.300" fontSize="lg" fontWeight="bold">
                  ${parseFloat(account.totalMonthlyBalance).toFixed(2)}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ))
      )}

      <AddAccountForm
        isOpen={isAddAccountOpen}
        onClose={onAddAccountClose}
        accountBookId={accountBookId}
        onSuccess={handleAccountAdded}
      />
    </VStack>
  );
}
