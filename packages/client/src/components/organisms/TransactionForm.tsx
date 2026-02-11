import { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Select,
} from '@chakra-ui/react';
import { CreateTransactionData, accountBooksApi } from '../../api';

export interface TransactionFormProps {
  accountId: string;
  accountBookId: string;
  initialData?: CreateTransactionData;
  onDataChange: (data: CreateTransactionData) => void;
  isOpen: boolean;
}

const emptyFormData: CreateTransactionData = {
  transactionDate: new Date().toISOString().split('T')[0],
  description: '',
  category: '',
  subCategory: '',
  debitAmount: '',
  creditAmount: '',
};

export function TransactionForm({
  accountId,
  accountBookId,
  initialData,
  onDataChange,
  isOpen,
}: TransactionFormProps) {
  const [formData, setFormData] = useState<CreateTransactionData>(
    initialData || emptyFormData
  );

  const [categories, setCategories] = useState<
    { category: string; subCategories: string[] }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availableSubCategories, setAvailableSubCategories] = useState<
    string[]
  >([]);
  const [createNewSubCategory, setCreateNewSubCategory] =
    useState<boolean>(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen && accountBookId) {
      accountBooksApi
        .getCategories(accountBookId)
        .then((data) => {
          setCategories(data);
        })
        .catch((error) => {
          console.error('Failed to fetch categories:', error);
        });
    }
  }, [isOpen, accountBookId]);

  // Reset/populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        setSelectedCategory(initialData.category);
        setCreateNewSubCategory(false);
      } else {
        const data = {
          ...emptyFormData,
          transactionDate: new Date().toISOString().split('T')[0],
        };
        setFormData(data);
        setSelectedCategory('');
        setAvailableSubCategories([]);
        setCreateNewSubCategory(false);
      }
    }
  }, [isOpen, initialData]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const categoryData = categories.find(
        (c) => c.category === selectedCategory
      );
      const subs = categoryData?.subCategories || [];
      setAvailableSubCategories(subs);

      if (
        initialData &&
        formData.subCategory &&
        !subs.includes(formData.subCategory)
      ) {
        setCreateNewSubCategory(true);
      } else {
        setCreateNewSubCategory(false);
      }
    } else {
      setAvailableSubCategories([]);
      setCreateNewSubCategory(false);
    }
  }, [selectedCategory, categories]);

  const updateFormData = (updated: CreateTransactionData) => {
    setFormData(updated);
    onDataChange(updated);
  };

  const handleChange = (field: keyof CreateTransactionData, value: string) => {
    const updated = { ...formData, [field]: value };
    updateFormData(updated);
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'new') {
      setSelectedCategory('');
      updateFormData({ ...formData, category: '', subCategory: '' });
    } else {
      setSelectedCategory(value);
      updateFormData({ ...formData, category: value, subCategory: '' });
    }
  };

  const handleSubCategoryChange = (value: string) => {
    if (value === 'new') {
      setCreateNewSubCategory(true);
      updateFormData({ ...formData, subCategory: '' });
    } else {
      setCreateNewSubCategory(false);
      updateFormData({ ...formData, subCategory: value });
    }
  };

  const isKnownCategory = categories.some(
    (c) => c.category === selectedCategory
  );

  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel color="cream.300" fontSize="sm">
          Transaction Date
        </FormLabel>
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
        <FormLabel color="cream.300" fontSize="sm">
          Description
        </FormLabel>
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

      <HStack spacing={3} align="start">
        <FormControl isRequired>
          <FormLabel color="cream.300" fontSize="sm">
            Category
          </FormLabel>
          <VStack spacing={2} align="stretch">
            <Select
              value={isKnownCategory ? selectedCategory : 'new'}
              onChange={(e) => handleCategoryChange(e.target.value)}
              size="sm"
              bg="navy.900"
              borderColor="navy.700"
              color="cream.100"
              _hover={{ borderColor: 'teal.500' }}
            >
              <option
                value="new"
                style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
              >
                + Create New Category
              </option>
              {categories.map((cat) => (
                <option
                  key={cat.category}
                  value={cat.category}
                  style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
                >
                  {cat.category}
                </option>
              ))}
            </Select>
            {!isKnownCategory && (
              <Input
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="Enter new category name"
                size="sm"
                bg="navy.900"
                borderColor="navy.700"
                color="cream.100"
                _hover={{ borderColor: 'teal.500' }}
                _placeholder={{ color: 'cream.500' }}
              />
            )}
          </VStack>
        </FormControl>

        <FormControl>
          <FormLabel color="cream.300" fontSize="sm">
            Sub Category
          </FormLabel>
          <VStack spacing={2} align="stretch">
            {isKnownCategory &&
              availableSubCategories.length > 0 &&
              !createNewSubCategory && (
                <Select
                  value={formData.subCategory || ''}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: 'teal.500' }}
                >
                  <option
                    value=""
                    style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
                  >
                    None
                  </option>
                  <option
                    value="new"
                    style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
                  >
                    + Create New
                  </option>
                  {availableSubCategories.map((subCat) => (
                    <option
                      key={subCat}
                      value={subCat}
                      style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
                    >
                      {subCat}
                    </option>
                  ))}
                </Select>
              )}
            {(!isKnownCategory ||
              availableSubCategories.length === 0 ||
              createNewSubCategory) && (
              <Input
                value={formData.subCategory}
                onChange={(e) => handleChange('subCategory', e.target.value)}
                placeholder="Optional subcategory"
                size="sm"
                bg="navy.900"
                borderColor="navy.700"
                color="cream.100"
                _hover={{ borderColor: 'teal.500' }}
                _placeholder={{ color: 'cream.500' }}
              />
            )}
          </VStack>
        </FormControl>
      </HStack>

      <HStack spacing={3}>
        <FormControl>
          <FormLabel color="cream.300" fontSize="sm">
            Debit Amount
          </FormLabel>
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
          <FormLabel color="cream.300" fontSize="sm">
            Credit Amount
          </FormLabel>
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
    </VStack>
  );
}
