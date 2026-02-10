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
} from '@chakra-ui/react';
import { CategoryTotal } from '../../api';

export interface CategoryBreakdownTableProps {
  categoryTotals: CategoryTotal[];
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CategoryBreakdownTable({ categoryTotals }: CategoryBreakdownTableProps) {
  const totalDebits = useMemo(
    () => categoryTotals.reduce((sum, c) => sum + c.debits, 0),
    [categoryTotals]
  );

  const sorted = useMemo(
    () => [...categoryTotals].sort((a, b) => b.debits - a.debits),
    [categoryTotals]
  );

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
                return (
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
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  );
}
