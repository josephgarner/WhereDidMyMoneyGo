import { useMemo } from 'react';
import { Box, Card, CardBody, Heading, Text } from '@chakra-ui/react';
import { ResponsivePie } from '@nivo/pie';
import { CategoryTotal } from '../../api';

export interface CategoryPieChartProps {
  categoryTotals: CategoryTotal[];
}

export function CategoryPieChart({ categoryTotals }: CategoryPieChartProps) {
  const pieData = useMemo(() => {
    return categoryTotals
      .filter((c) => c.debits > 0)
      .sort((a, b) => b.debits - a.debits)
      .map((c) => ({
        id: c.category,
        label: c.category,
        value: c.debits,
      }));
  }, [categoryTotals]);

  if (pieData.length === 0) {
    return (
      <Card>
        <CardBody>
          <Heading size="sm" color="cream.100" mb={3}>
            Spending Distribution
          </Heading>
          <Box display="flex" alignItems="center" justifyContent="center" minH="300px">
            <Text color="cream.400">No spending data available</Text>
          </Box>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Heading size="sm" color="cream.100" mb={3}>
          Spending Distribution
        </Heading>
        <Box height="350px">
          <ResponsivePie
            data={pieData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            innerRadius={0.5}
            padAngle={1}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: 'set2' }}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={pieData.length <= 8}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#f5f3e7"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={15}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
            tooltip={({ datum }) => (
              <Box bg="navy.800" p={2} borderRadius="md" borderWidth="1px" borderColor="navy.700">
                <Text color="cream.100" fontSize="xs" fontWeight="bold">
                  {datum.label}
                </Text>
                <Text color="teal.300" fontSize="xs">
                  ${Number(datum.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </Box>
            )}
            theme={{
              tooltip: {
                container: {
                  background: 'transparent',
                  boxShadow: 'none',
                  padding: 0,
                },
              },
            }}
          />
        </Box>
      </CardBody>
    </Card>
  );
}
