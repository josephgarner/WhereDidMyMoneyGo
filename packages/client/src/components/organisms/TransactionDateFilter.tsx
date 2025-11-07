import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Select,
  FormControl,
  FormLabel,
  Input,
  Text,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';

export interface DateFilterValue {
  type: 'all' | 'month' | 'range';
  month?: string; // Format: YYYY-MM
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
}

interface TransactionDateFilterProps {
  availableMonths: string[]; // Array of YYYY-MM strings
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

export function TransactionDateFilter({
  availableMonths,
  minDate,
  maxDate,
  value,
  onChange,
}: TransactionDateFilterProps) {
  const [filterType, setFilterType] = useState<'all' | 'month' | 'range'>(value.type);
  const [selectedMonth, setSelectedMonth] = useState(value.month || '');
  const [startDate, setStartDate] = useState(value.startDate || '');
  const [endDate, setEndDate] = useState(value.endDate || '');

  useEffect(() => {
    // Update parent when filter changes
    const newValue: DateFilterValue = { type: filterType };

    if (filterType === 'month' && selectedMonth) {
      newValue.month = selectedMonth;
    } else if (filterType === 'range' && startDate && endDate) {
      newValue.startDate = startDate;
      newValue.endDate = endDate;
    }

    onChange(newValue);
  }, [filterType, selectedMonth, startDate, endDate]);

  const handleFilterTypeChange = (newType: string) => {
    setFilterType(newType as 'all' | 'month' | 'range');
  };

  const handleReset = () => {
    setFilterType('all');
    setSelectedMonth('');
    setStartDate('');
    setEndDate('');
    onChange({ type: 'all' });
  };

  // Format month for display (YYYY-MM -> Month Year)
  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Sort months in descending order (newest first)
  const sortedMonths = [...availableMonths].sort((a, b) => b.localeCompare(a));

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
          Filter by Date
        </Text>

        <RadioGroup value={filterType} onChange={handleFilterTypeChange}>
          <Stack direction="row" spacing={4}>
            <Radio value="all" colorScheme="teal">
              <Text fontSize="sm" color="cream.200">All</Text>
            </Radio>
            <Radio value="month" colorScheme="teal">
              <Text fontSize="sm" color="cream.200">Month</Text>
            </Radio>
            <Radio value="range" colorScheme="teal">
              <Text fontSize="sm" color="cream.200">Date Range</Text>
            </Radio>
          </Stack>
        </RadioGroup>

        {filterType === 'month' && (
          <FormControl>
            <FormLabel color="cream.300" fontSize="sm">Select Month</FormLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              placeholder="Choose a month"
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
              {sortedMonths.map((month) => (
                <option key={month} value={month} style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}>
                  {formatMonthDisplay(month)}
                </option>
              ))}
            </Select>
          </FormControl>
        )}

        {filterType === 'range' && (
          <HStack spacing={3}>
            <FormControl>
              <FormLabel color="cream.300" fontSize="sm">Start Date</FormLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={minDate}
                max={maxDate}
                size="sm"
                bg="navy.900"
                borderColor="navy.700"
                color="cream.100"
                _hover={{ borderColor: 'teal.500' }}
              />
            </FormControl>
            <FormControl>
              <FormLabel color="cream.300" fontSize="sm">End Date</FormLabel>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || minDate}
                max={maxDate}
                size="sm"
                bg="navy.900"
                borderColor="navy.700"
                color="cream.100"
                _hover={{ borderColor: 'teal.500' }}
              />
            </FormControl>
          </HStack>
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
