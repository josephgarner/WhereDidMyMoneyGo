import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  Select,
  FormControl,
  FormLabel,
  Text,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';

export interface CategoryFilterValue {
  type: 'all' | 'category';
  category?: string;
}

interface TransactionCategoryFilterProps {
  availableCategories: string[];
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export function TransactionCategoryFilter({
  availableCategories,
  value,
  onChange,
}: TransactionCategoryFilterProps) {
  const [filterType, setFilterType] = useState<'all' | 'category'>(value.type);
  const [selectedCategory, setSelectedCategory] = useState(value.category || '');

  useEffect(() => {
    // Update parent when filter changes
    const newValue: CategoryFilterValue = { type: filterType };

    if (filterType === 'category' && selectedCategory) {
      newValue.category = selectedCategory;
    }

    onChange(newValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, selectedCategory]);

  const handleFilterTypeChange = (newType: string) => {
    setFilterType(newType as 'all' | 'category');
  };

  const handleReset = () => {
    setFilterType('all');
    setSelectedCategory('');
    onChange({ type: 'all' });
  };

  // Sort categories alphabetically
  const sortedCategories = [...availableCategories].sort((a, b) => a.localeCompare(b));

  return (
    <Box
      p={4}
      bg="navy.800"
      borderRadius="md"
      borderWidth="1px"
      borderColor="navy.700"
    >
      <VStack align="stretch" spacing={4}>
        <Text fontWeight="bold" color="cream.100" fontSize="sm">
          Filter by Category
        </Text>

        <RadioGroup value={filterType} onChange={handleFilterTypeChange}>
          <Stack direction="row" spacing={4}>
            <Radio value="all" colorScheme="teal">
              <Text fontSize="sm" color="cream.200">All</Text>
            </Radio>
            <Radio value="category" colorScheme="teal">
              <Text fontSize="sm" color="cream.200">Category</Text>
            </Radio>
          </Stack>
        </RadioGroup>

        {filterType === 'category' && (
          <FormControl>
            <FormLabel color="cream.300" fontSize="sm">Select Category</FormLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              placeholder="Choose a category"
              size="sm"
              bg="navy.900"
              borderColor="navy.700"
              color="cream.100"
              _hover={{ borderColor: 'teal.500' }}
              sx={{
                option: {
                  bg: 'navy.900',
                  color: 'cream.100',
                  _hover: {
                    bg: 'teal.700',
                  },
                  _checked: {
                    bg: 'teal.800',
                  },
                }
              }}
            >
              {sortedCategories.map((category) => (
                <option key={category} value={category} style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}>
                  {category}
                </option>
              ))}
            </Select>
          </FormControl>
        )}

        {filterType !== 'all' && (
          <Button
            size="sm"
            variant="outline"
            colorScheme="teal"
            onClick={handleReset}
          >
            Reset Filter
          </Button>
        )}
      </VStack>
    </Box>
  );
}
