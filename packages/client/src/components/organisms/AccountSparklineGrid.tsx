import {
  Box,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { ResponsiveLine } from '@nivo/line';
import { AccountHistoricalBalance } from '../../api';

export interface AccountSparklineGridProps {
  historicalBalances: AccountHistoricalBalance[];
}

export function AccountSparklineGrid({ historicalBalances }: AccountSparklineGridProps) {
  if (historicalBalances.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text color="cream.400" textAlign="center">
            No accounts or historical data available
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
      {historicalBalances.map((accountData) => {
        const chartData = [{
          id: accountData.accountName,
          data: accountData.data.map((point) => ({
            x: point.month,
            y: point.balance,
          })),
        }];

        const hasData = accountData.data.length > 0;

        return (
          <Card key={accountData.accountId} maxW="150px">
            <CardBody p={3}>
              <Heading size="xs" color="cream.100" mb={2} noOfLines={1} title={accountData.accountName}>
                {accountData.accountName}
              </Heading>
              {hasData ? (
                <Box height="100px" width="100%">
                  <ResponsiveLine
                    data={chartData}
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    xScale={{ type: 'point' }}
                    yScale={{
                      type: 'linear',
                      min: 'auto',
                      max: 'auto',
                      stacked: false,
                      reverse: false,
                    }}
                    yFormat=" >-$.2f"
                    curve="monotoneX"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={null}
                    axisLeft={null}
                    colors={['#4FD1C5']}
                    pointSize={0}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={0}
                    pointBorderColor={{ from: 'serieColor' }}
                    enableGridX={false}
                    enableGridY={false}
                    useMesh={true}
                    theme={{
                      tooltip: {
                        container: {
                          background: '#1a2332',
                          color: '#f5f3e7',
                          fontSize: '11px',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100px">
                  <Text color="cream.400" fontSize="xs">No data</Text>
                </Box>
              )}
            </CardBody>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
