import { Box, Card, CardBody, Heading, Text } from "@chakra-ui/react";
import { ResponsiveBar } from "@nivo/bar";
import { AccountMonthlyDebitCredit } from "../../api";

export interface MonthlyDebitCreditChartProps {
  accountData: AccountMonthlyDebitCredit;
}

export function MonthlyDebitCreditChart({ accountData }: MonthlyDebitCreditChartProps) {
  // Transform data for Nivo bar chart
  const chartData = accountData.data.map((item) => ({
    month: item.month.substring(5), // Show only MM part (e.g., "01", "02")
    Debits: item.debits,
    Credits: item.credits,
  }));

  const hasData = accountData.data.some(item => item.debits > 0 || item.credits > 0);

  return (
    <Card maxW="300px" minW="300px">
      <CardBody p={3}>
        <Heading
          size="xs"
          color="cream.100"
          mb={2}
          noOfLines={1}
          title={accountData.accountName}
        >
          {accountData.accountName}
        </Heading>
        {hasData ? (
          <Box height="150px" width="100%">
            <ResponsiveBar
              data={chartData}
              keys={['Debits', 'Credits']}
              indexBy="month"
              margin={{ top: 5, right: 5, bottom: 20, left: 40 }}
              padding={0.2}
              groupMode="grouped"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={['#FC8181', '#4FD1C5']} // coral for debits, teal for credits
              borderColor={{
                from: 'color',
                modifiers: [['darker', 1.6]],
              }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 3,
                tickPadding: 3,
                tickRotation: 0,
                legendPosition: 'middle',
                legendOffset: 32,
              }}
              axisLeft={{
                tickSize: 3,
                tickPadding: 3,
                tickRotation: 0,
                format: (value: any) => {
                  if (value >= 1000) {
                    return `$${(value / 1000).toFixed(0)}k`;
                  }
                  return `$${value}`;
                },
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{
                from: 'color',
                modifiers: [['darker', 3]],
              }}
              legends={[]}
              role="application"
              ariaLabel={`Monthly debits and credits for ${accountData.accountName}`}
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fill: '#c9c4b5',
                      fontSize: 9,
                    },
                  },
                },
                grid: {
                  line: {
                    stroke: '#2d3748',
                    strokeWidth: 1,
                  },
                },
                tooltip: {
                  container: {
                    background: '#1a2332',
                    color: '#f5f3e7',
                    fontSize: '11px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                    padding: '6px 10px',
                  },
                },
              }}
              tooltip={({ id, value, indexValue }: any) => (
                <Box
                  bg="navy.800"
                  p={2}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="navy.700"
                >
                  <Text color="cream.100" fontSize="xs" fontWeight="bold">
                    {indexValue}
                  </Text>
                  <Text
                    color={id === 'Debits' ? 'coral.400' : 'teal.300'}
                    fontSize="xs"
                    fontWeight="medium"
                  >
                    {id}: ${Number(value).toLocaleString()}
                  </Text>
                </Box>
              )}
            />
          </Box>
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" height="150px">
            <Text color="cream.400" fontSize="xs">
              No data
            </Text>
          </Box>
        )}
      </CardBody>
    </Card>
  );
}
