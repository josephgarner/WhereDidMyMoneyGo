import { SimpleGrid, Card, CardBody, Text, Heading } from '@chakra-ui/react';

export interface ReportSummaryCardsProps {
  totals: { debits: number; credits: number; combined: number };
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ReportSummaryCards({ totals }: ReportSummaryCardsProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      <Card>
        <CardBody>
          <Text color="cream.300" fontSize="xs" textTransform="uppercase" fontWeight="semibold">
            Total Debits
          </Text>
          <Heading size="md" color="coral.400" mt={1}>
            {formatCurrency(totals.debits)}
          </Heading>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Text color="cream.300" fontSize="xs" textTransform="uppercase" fontWeight="semibold">
            Total Credits
          </Text>
          <Heading size="md" color="teal.300" mt={1}>
            {formatCurrency(totals.credits)}
          </Heading>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Text color="cream.300" fontSize="xs" textTransform="uppercase" fontWeight="semibold">
            Net
          </Text>
          <Heading size="md" color={totals.combined >= 0 ? 'teal.300' : 'coral.400'} mt={1}>
            {formatCurrency(totals.combined)}
          </Heading>
        </CardBody>
      </Card>
    </SimpleGrid>
  );
}
