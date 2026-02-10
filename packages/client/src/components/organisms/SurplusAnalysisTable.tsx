import { useMemo } from 'react';
import {
  VStack,
  Card,
  CardBody,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { AccountSurplusData, MonthlySurplus } from '../../api';

export interface SurplusAnalysisTableProps {
  surplusData: AccountSurplusData[];
}

function generateLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${yyyy}-${mm}`);
  }
  return months;
}

function computePercentageChanges(monthlyData: MonthlySurplus[]): (number | null)[] {
  return monthlyData.map((item, index) => {
    if (index === 0) return null;
    const prev = monthlyData[index - 1].surplus;
    const curr = item.surplus;
    if (prev === 0) {
      return curr === 0 ? 0 : null;
    }
    return ((curr - prev) / Math.abs(prev)) * 100;
  });
}

function computePredictedBalance(
  currentBalance: number,
  monthlyData: MonthlySurplus[]
): number | null {
  if (monthlyData.length === 0) return null;
  const avgSurplus = monthlyData.reduce((sum, m) => sum + m.surplus, 0) / monthlyData.length;
  return currentBalance + avgSurplus * 6;
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercentage(value: number | null): string {
  if (value === null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function SurplusAnalysisTable({ surplusData }: SurplusAnalysisTableProps) {
  const last6Months = useMemo(() => generateLast6Months(), []);

  const enrichedData = useMemo(() => {
    return surplusData.map((account) => {
      const alignedData: MonthlySurplus[] = last6Months.map((month) => {
        const found = account.monthlyData.find((m) => m.month === month);
        return found || { month, debits: 0, credits: 0, surplus: 0 };
      });
      const percentageChanges = computePercentageChanges(alignedData);
      const predictedBalance = computePredictedBalance(account.currentBalance, alignedData);
      const avgMonthlySurplus = alignedData.reduce((sum, m) => sum + m.surplus, 0) / alignedData.length;
      return { ...account, alignedData, percentageChanges, predictedBalance, avgMonthlySurplus };
    });
  }, [surplusData, last6Months]);

  if (enrichedData.length === 0) return null;

  return (
    <Card>
      <CardBody>
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th color="cream.300" fontSize="xs">Account</Th>
                <Th color="cream.300" fontSize="xs" isNumeric>Current Balance</Th>
                {last6Months.map((month) => (
                  <Th key={month} color="cream.300" fontSize="xs" isNumeric>
                    {month}
                  </Th>
                ))}
                <Th color="cream.300" fontSize="xs" isNumeric>Avg Monthly</Th>
                <Th color="cream.300" fontSize="xs" isNumeric>
                  <Tooltip
                    label="Predicted balance = current balance + (average monthly surplus x 6)"
                    hasArrow
                    placement="top"
                  >
                    <Text as="span" cursor="help" textDecoration="underline dotted">
                      Predicted (6mo)
                    </Text>
                  </Tooltip>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {enrichedData.map((account) => (
                <Tr key={account.accountId}>
                  <Td color="cream.200" fontSize="xs" fontWeight="medium">
                    {account.accountName}
                  </Td>
                  <Td color="cream.200" fontSize="xs" isNumeric>
                    {formatCurrency(account.currentBalance)}
                  </Td>
                  {account.alignedData.map((monthData, idx) => {
                    const pctChange = account.percentageChanges[idx];
                    const surplusColor = monthData.surplus >= 0 ? 'teal.300' : 'coral.400';
                    return (
                      <Td key={monthData.month} isNumeric>
                        <VStack spacing={0} align="end">
                          <Text color={surplusColor} fontSize="xs" fontWeight="medium">
                            {formatCurrency(monthData.surplus)}
                          </Text>
                          {pctChange !== null && (
                            <Badge
                              colorScheme={pctChange >= 0 ? 'green' : 'red'}
                              fontSize="xx-small"
                              variant="subtle"
                            >
                              {formatPercentage(pctChange)}
                            </Badge>
                          )}
                        </VStack>
                      </Td>
                    );
                  })}
                  <Td isNumeric>
                    <Text
                      color={account.avgMonthlySurplus >= 0 ? 'teal.300' : 'coral.400'}
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {formatCurrency(account.avgMonthlySurplus)}
                    </Text>
                  </Td>
                  <Td isNumeric>
                    <Text
                      color={
                        account.predictedBalance !== null && account.predictedBalance >= 0
                          ? 'teal.300'
                          : 'coral.400'
                      }
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {account.predictedBalance !== null
                        ? formatCurrency(account.predictedBalance)
                        : 'N/A'}
                    </Text>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  );
}
