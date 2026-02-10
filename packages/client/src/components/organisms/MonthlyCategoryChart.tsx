import { useMemo } from 'react';
import { Box, Card, CardBody, Heading, Text } from '@chakra-ui/react';
import { ResponsiveBar } from '@nivo/bar';
import { MonthlyCategoryTotal } from '../../api';

export interface MonthlyCategoryChartProps {
  monthlyCategoryTotals: MonthlyCategoryTotal[];
}

export function MonthlyCategoryChart({ monthlyCategoryTotals }: MonthlyCategoryChartProps) {
  const { chartData, categories } = useMemo(() => {
    // Collect unique months and categories
    const monthSet = new Set<string>();
    const categorySet = new Set<string>();

    monthlyCategoryTotals.forEach((r) => {
      monthSet.add(r.month);
      categorySet.add(r.category);
    });

    const months = Array.from(monthSet).sort();
    const cats = Array.from(categorySet).sort();

    // Build one entry per month with a key per category (debit values)
    const data = months.map((month) => {
      const entry: Record<string, string | number> = { month };
      cats.forEach((cat) => {
        const match = monthlyCategoryTotals.find(
          (r) => r.month === month && r.category === cat
        );
        entry[cat] = match ? match.debits : 0;
      });
      return entry;
    });

    return { chartData: data, categories: cats };
  }, [monthlyCategoryTotals]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardBody>
          <Heading size="sm" color="cream.100" mb={3}>
            Monthly Spending by Category
          </Heading>
          <Box display="flex" alignItems="center" justifyContent="center" minH="300px">
            <Text color="cream.400">No data available</Text>
          </Box>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Heading size="sm" color="cream.100" mb={3}>
          Monthly Spending by Category
        </Heading>
        <Box height="400px">
          <ResponsiveBar
            data={chartData}
            keys={categories}
            indexBy="month"
            groupMode="stacked"
            margin={{ top: 20, right: 130, bottom: 60, left: 80 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={{ scheme: 'set2' }}
            theme={{
              axis: {
                ticks: { text: { fill: '#c9c4b5', fontSize: 11 } },
                legend: { text: { fill: '#c9c4b5', fontSize: 12, fontWeight: 600 } },
              },
              grid: { line: { stroke: '#2d3748', strokeWidth: 1 } },
              tooltip: {
                container: {
                  background: '#1a2332',
                  color: '#f5f3e7',
                  fontSize: '12px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                },
              },
              legends: { text: { fill: '#f5f3e7', fontSize: 11 } },
            }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Month',
              legendPosition: 'middle',
              legendOffset: 50,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Spending ($)',
              legendPosition: 'middle',
              legendOffset: -60,
              format: (value) => `$${Number(value).toLocaleString()}`,
            }}
            labelSkipWidth={16}
            labelSkipHeight={16}
            labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemTextColor: '#f5f3e7',
                symbolSize: 12,
              },
            ]}
          />
        </Box>
      </CardBody>
    </Card>
  );
}
