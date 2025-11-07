import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  useToast,
  Collapse,
  Text,
  IconButton,
  FormHelperText,
} from '@chakra-ui/react';
import { FaPlus, FaMinus } from 'react-icons/fa6';
import { accountBooksApi, CreateAccountData } from '../../api';

export interface AddAccountFormProps {
  accountBookId: string;
  onSuccess: () => void;
}

export function AddAccountForm({ accountBookId, onSuccess }: AddAccountFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    startingBalance: '',
  });

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

      // Reset form
      setFormData({
        name: '',
        startingBalance: '',
      });

      setIsOpen(false);
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
    <Box
      p={4}
      bg="navy.800"
      borderRadius="md"
      borderWidth="1px"
      borderColor="navy.700"
    >
      <HStack justify="space-between" mb={isOpen ? 4 : 0}>
        <Text fontWeight="bold" color="cream.100" fontSize="sm">
          Add Account
        </Text>
        <IconButton
          aria-label={isOpen ? 'Close form' : 'Open form'}
          icon={isOpen ? <FaMinus /> : <FaPlus />}
          size="sm"
          variant="ghost"
          colorScheme="teal"
          onClick={() => setIsOpen(!isOpen)}
        />
      </HStack>

      <Collapse in={isOpen} animateOpacity>
        <form onSubmit={handleSubmit}>
          <VStack spacing={3} align="stretch">
            <FormControl isRequired>
              <FormLabel color="cream.300" fontSize="sm">Account Name</FormLabel>
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
              <FormLabel color="cream.300" fontSize="sm">Starting Balance</FormLabel>
              <Input
                type="number"
                step="0.01"
                value={formData.startingBalance}
                onChange={(e) => handleChange('startingBalance', e.target.value)}
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

            <HStack spacing={3} justify="flex-end" pt={2}>
              <Button
                size="sm"
                variant="outline"
                colorScheme="teal"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                colorScheme="teal"
                isLoading={isSubmitting}
              >
                Create Account
              </Button>
            </HStack>
          </VStack>
        </form>
      </Collapse>
    </Box>
  );
}
