import { useMemo } from 'react';
import {
  Card,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Badge,
  Box,
} from '@chakra-ui/react';
import { CategoryTotal, SubCategoryTotal } from '../../api';

export interface CategoryBreakdownTableProps {
  categoryTotals: CategoryTotal[];
  subCategoryTotals?: SubCategoryTotal[];
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CategoryBreakdownTable({ categoryTotals, subCategoryTotals = [] }: CategoryBreakdownTableProps) {
  const totalDebits = useMemo(
    () => categoryTotals.reduce((sum, c) => sum + c.debits, 0),
    [categoryTotals]
  );

  const sorted = useMemo(
    () => [...categoryTotals].sort((a, b) => b.debits - a.debits),
    [categoryTotals]
  );

  const subsByCategory = useMemo(() => {
    const map = new Map<string, SubCategoryTotal[]>();
    subCategoryTotals.forEach((sc) => {
      if (!sc.subCategory) return;
      const existing = map.get(sc.category) || [];
      existing.push(sc);
      map.set(sc.category, existing);
    });
    // Sort each group by debits descending
    map.forEach((subs) => subs.sort((a, b) => b.debits - a.debits));
    return map;
  }, [subCategoryTotals]);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text color="cream.400" textAlign="center">No category data available</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Heading size="sm" color="cream.100" mb={3}>
          Spending by Category
        </Heading>
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th color="cream.300" fontSize="xs">Category</Th>
                <Th color="cream.300" fontSize="xs" isNumeric>Debits</Th>
                <Th color="cream.300" fontSize="xs" isNumeric>Credits</Th>
                <Th color="cream.300" fontSize="xs" isNumeric>Net</Th>
                <Th color="cream.300" fontSize="xs" isNumeric>% of Spend</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sorted.map((cat) => {
                const net = cat.credits - cat.debits;
                const pct = totalDebits > 0 ? (cat.debits / totalDebits) * 100 : 0;
                const subs = subsByCategory.get(cat.category) || [];

                return (
                  <>
                    <Tr key={cat.category}>
                      <Td>
                        <Badge colorScheme="teal" fontSize="xs">
                          {cat.category}
                        </Badge>
                      </Td>
                      <Td color="coral.400" fontSize="xs" isNumeric fontWeight="medium">
                        {formatCurrency(cat.debits)}
                      </Td>
                      <Td color="teal.300" fontSize="xs" isNumeric fontWeight="medium">
                        {formatCurrency(cat.credits)}
                      </Td>
                      <Td color={net >= 0 ? 'teal.300' : 'coral.400'} fontSize="xs" isNumeric fontWeight="medium">
                        {formatCurrency(net)}
                      </Td>
                      <Td color="cream.200" fontSize="xs" isNumeric>
                        {pct.toFixed(1)}%
                      </Td>
                    </Tr>
                    {subs.map((sc) => {
                      const subNet = sc.credits - sc.debits;
                      const subPct = totalDebits > 0 ? (sc.debits / totalDebits) * 100 : 0;
                      return (
                        <Tr key={`${sc.category}-${sc.subCategory}`}>
                          <Td>
                            <Box pl={5}>
                              <Text fontSize="xs" color="cream.400" fontStyle="italic">
                                {sc.subCategory}
                              </Text>
                            </Box>
                          </Td>
                          <Td color="coral.400" fontSize="xs" isNumeric opacity={0.8}>
                            {formatCurrency(sc.debits)}
                          </Td>
                          <Td color="teal.300" fontSize="xs" isNumeric opacity={0.8}>
                            {formatCurrency(sc.credits)}
                          </Td>
                          <Td color={subNet >= 0 ? 'teal.300' : 'coral.400'} fontSize="xs" isNumeric opacity={0.8}>
                            {formatCurrency(subNet)}
                          </Td>
                          <Td color="cream.400" fontSize="xs" isNumeric opacity={0.8}>
                            {subPct.toFixed(1)}%
                          </Td>
                        </Tr>
                      );
                    })}
                  </>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  );
}
