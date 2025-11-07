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
} from '@chakra-ui/react';
import { FaPlus, FaMinus } from 'react-icons/fa6';
import { accountBooksApi, CreateTransactionData } from '../../api';
import { useCategorySuggestions } from '../../hooks';

export interface AddTransactionFormProps {
  accountId: string;
  onSuccess: () => void;
}

export function AddTransactionForm({ accountId, onSuccess }: AddTransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { suggestions } = useCategorySuggestions(accountId);

  const [formData, setFormData] = useState<CreateTransactionData>({
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    subCategory: '',
    debitAmount: '',
    creditAmount: '',
  });

  const handleChange = (field: keyof CreateTransactionData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    // Validate that at least one amount is provided
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

      // Reset form
      setFormData({
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        subCategory: '',
        debitAmount: '',
        creditAmount: '',
      });

      setIsOpen(false);
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
    <Box
      p={4}
      bg="navy.800"
      borderRadius="md"
      borderWidth="1px"
      borderColor="navy.700"
    >
      <HStack justify="space-between" mb={isOpen ? 4 : 0}>
        <Text fontWeight="bold" color="cream.100" fontSize="sm">
          Add Transaction
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
              <FormLabel color="cream.300" fontSize="sm">Transaction Date</FormLabel>
              <Input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => handleChange('transactionDate', e.target.value)}
                size="sm"
                bg="navy.900"
                borderColor="navy.700"
                color="cream.100"
                _hover={{ borderColor: 'teal.500' }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="cream.300" fontSize="sm">Description</FormLabel>
              <Input
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter transaction description"
                size="sm"
                bg="navy.900"
                borderColor="navy.700"
                color="cream.100"
                _hover={{ borderColor: 'teal.500' }}
                _placeholder={{ color: 'cream.500' }}
              />
            </FormControl>

            <HStack spacing={3}>
              <FormControl isRequired>
                <FormLabel color="cream.300" fontSize="sm">Category</FormLabel>
                <Input
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g., Food, Transport"
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: 'teal.500' }}
                  _placeholder={{ color: 'cream.500' }}
                  list="category-suggestions"
                  autoComplete="off"
                />
                <datalist id="category-suggestions">
                  {suggestions.categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </FormControl>

              <FormControl>
                <FormLabel color="cream.300" fontSize="sm">Sub Category</FormLabel>
                <Input
                  value={formData.subCategory}
                  onChange={(e) => handleChange('subCategory', e.target.value)}
                  placeholder="Optional"
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: 'teal.500' }}
                  _placeholder={{ color: 'cream.500' }}
                  list="subcategory-suggestions"
                  autoComplete="off"
                />
                <datalist id="subcategory-suggestions">
                  {suggestions.subCategories.map((subCat) => (
                    <option key={subCat} value={subCat} />
                  ))}
                </datalist>
              </FormControl>
            </HStack>

            <HStack spacing={3}>
              <FormControl>
                <FormLabel color="cream.300" fontSize="sm">Debit Amount</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.debitAmount}
                  onChange={(e) => handleChange('debitAmount', e.target.value)}
                  placeholder="0.00"
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: 'teal.500' }}
                  _placeholder={{ color: 'cream.500' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="cream.300" fontSize="sm">Credit Amount</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.creditAmount}
                  onChange={(e) => handleChange('creditAmount', e.target.value)}
                  placeholder="0.00"
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: 'teal.500' }}
                  _placeholder={{ color: 'cream.500' }}
                />
              </FormControl>
            </HStack>

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
                Add Transaction
              </Button>
            </HStack>
          </VStack>
        </form>
      </Collapse>
    </Box>
  );
}
