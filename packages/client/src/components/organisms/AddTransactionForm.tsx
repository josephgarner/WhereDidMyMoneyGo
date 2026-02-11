import { useState, useRef } from 'react';
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
import { accountBooksApi, CreateTransactionData } from '../../api';
import { TransactionForm } from './TransactionForm';

export interface AddTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountBookId: string;
  onSuccess: () => void;
}

export function AddTransactionForm({
  isOpen,
  onClose,
  accountId,
  accountBookId,
  onSuccess,
}: AddTransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formDataRef = useRef<CreateTransactionData | null>(null);
  const toast = useToast();

  const handleDataChange = (data: CreateTransactionData) => {
    formDataRef.current = data;
  };

  const handleSubmit = async () => {
    const formData = formDataRef.current;

    if (!formData || !formData.description || !formData.category) {
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

      await accountBooksApi.createTransaction(accountId, {
        ...formData,
        debitAmount: formData.debitAmount || '0',
        creditAmount: formData.creditAmount || '0',
      });

      toast({
        title: 'Transaction Created',
        description: 'Your transaction has been added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
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
        <ModalHeader color="cream.100">Add Transaction</ModalHeader>
        <ModalCloseButton color="cream.100" />
        <ModalBody>
          <TransactionForm
            accountId={accountId}
            accountBookId={accountBookId}
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
              Add Transaction
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
