import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  useToast,
  FormHelperText,
} from '@chakra-ui/react';
import { accountBooksApi, CreateAccountData } from '../../api';

export interface AddAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  accountBookId: string;
  onSuccess: () => void;
}

export function AddAccountForm({
  isOpen,
  onClose,
  accountBookId,
  onSuccess,
}: AddAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    startingBalance: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', startingBalance: '' });
    }
  }, [isOpen]);

  const handleChange = (field: keyof CreateAccountData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Account name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await accountBooksApi.createAccount(accountBookId, {
        name: formData.name.trim(),
        startingBalance: formData.startingBalance || '0',
      });

      toast({
        title: 'Account Created',
        description: `Account "${formData.name}" has been created successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="navy.800" borderColor="navy.700" borderWidth="1px">
        <ModalHeader color="cream.100">Add Account</ModalHeader>
        <ModalCloseButton color="cream.100" />
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={3} align="stretch">
              <FormControl isRequired>
                <FormLabel color="cream.300" fontSize="sm">
                  Account Name
                </FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Checking, Savings, Credit Card"
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: 'teal.500' }}
                  _placeholder={{ color: 'cream.500' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="cream.300" fontSize="sm">
                  Starting Balance
                </FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.startingBalance}
                  onChange={(e) =>
                    handleChange('startingBalance', e.target.value)
                  }
                  placeholder="0.00"
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: 'teal.500' }}
                  _placeholder={{ color: 'cream.500' }}
                />
                <FormHelperText color="cream.500" fontSize="xs">
                  Optional: Enter the account's current balance
                </FormHelperText>
              </FormControl>
            </VStack>
          </form>
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
              Create Account
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
