import { useState, useMemo, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { Transaction } from '@finances/shared';
import { accountBooksApi, CreateTransactionData } from '../../api';
import { TransactionForm } from './TransactionForm';

export interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  accountBookId: string;
  onSuccess: () => void;
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  accountBookId,
  onSuccess,
}: EditTransactionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formDataRef = useRef<CreateTransactionData | null>(null);
  const toast = useToast();

  const initialData = useMemo<CreateTransactionData>(
    () => ({
      transactionDate: new Date(transaction.transactionDate)
        .toISOString()
        .split('T')[0],
      description: transaction.description,
      category: transaction.category,
      subCategory: transaction.subCategory || '',
      debitAmount: transaction.debitAmount || '',
      creditAmount: transaction.creditAmount || '',
    }),
    [transaction]
  );

  const handleDataChange = (data: CreateTransactionData) => {
    formDataRef.current = data;
  };

  const handleSubmit = async () => {
    const formData = formDataRef.current || initialData;

    if (!formData.description || !formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Description and Category are required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const debit = parseFloat(formData.debitAmount || '0');
    const credit = parseFloat(formData.creditAmount || '0');

    if (debit === 0 && credit === 0) {
      toast({
        title: 'Validation Error',
        description: 'Either Debit or Credit amount must be greater than 0',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await accountBooksApi.updateTransaction(
        transaction.accountId,
        transaction.id,
        {
          ...formData,
          debitAmount: formData.debitAmount || '0',
          creditAmount: formData.creditAmount || '0',
        }
      );

      toast({
        title: 'Transaction Updated',
        description: 'Your transaction has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="navy.800" borderColor="navy.700" borderWidth="1px">
        <ModalHeader color="cream.100">Edit Transaction</ModalHeader>
        <ModalCloseButton color="cream.100" />
        <ModalBody>
          <TransactionForm
            accountId={transaction.accountId}
            accountBookId={accountBookId}
            initialData={initialData}
            onDataChange={handleDataChange}
            isOpen={isOpen}
          />
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="teal"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="teal"
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              Update Transaction
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
