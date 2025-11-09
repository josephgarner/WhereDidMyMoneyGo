import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardBody,
  Heading,
  VStack,
  Select,
  Spinner,
  Text,
  HStack,
} from "@chakra-ui/react";
import { ResponsiveLine } from "@nivo/line";
import { Account } from "@finances/shared";
import { accountBooksApi, AccountBalanceHistory } from "../../api";

export interface AccountBalanceChartProps {
  accountBookId: string;
  accounts: Account[];
  selectedAccountId: string | null;
  onAccountChange: (accountId: string) => void;
}

export function AccountBalanceChart({
  accountBookId,
  accounts,
  selectedAccountId,
  onAccountChange,
}: AccountBalanceChartProps) {
  const [balanceHistory, setBalanceHistory] = useState<AccountBalanceHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAccountId || accounts.length === 0) {
      return;
    }

    const fetchBalanceHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await accountBooksApi.getAccountBalanceHistory(
          accountBookId,
          selectedAccountId
        );
        setBalanceHistory(data);
      } catch (err: any) {
        // If we get a 404, the selected account doesn't belong to this account book
        // Reset to the first account in the list
        if (err.response?.status === 404 && accounts.length > 0) {
          console.warn(
            "Selected account not found in this account book, resetting to first account"
          );
          onAccountChange(accounts[0].id);
          return;
        }
        setError(err.message || "Failed to fetch balance history");
        setBalanceHistory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceHistory();
  }, [accountBookId, selectedAccountId, accounts, onAccountChange]);

  if (accounts.length === 0) {
    return null;
  }

  // Format data for Nivo chart
  const chartData = balanceHistory
    ? [
        {
          id: balanceHistory.accountName,
          data: balanceHistory.data.map((item) => ({
            x: item.month,
            y: item.balance,
          })),
        },
      ]
    : [];

  return (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between" align="center">
            <Heading size="md" color="cream.100">
              Account Balance History (24 Months)
            </Heading>
            <Select
              value={selectedAccountId || ""}
              onChange={(e) => onAccountChange(e.target.value)}
              maxW="300px"
              size="sm"
              bg="navy.900"
              borderColor="navy.700"
              color="cream.100"
              _hover={{ borderColor: "teal.500" }}
              sx={{
                option: {
                  bg: "navy.900",
                  color: "cream.100",
                },
              }}
            >
              <option value="" disabled>
                Select an account
              </option>
              {accounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                  style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}
                >
                  {account.name}
                </option>
              ))}
            </Select>
          </HStack>

          {loading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minH="400px"
            >
              <Spinner size="lg" color="teal.500" thickness="3px" />
            </Box>
          )}

          {error && !loading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minH="400px"
            >
              <Text color="coral.500">Error: {error}</Text>
            </Box>
          )}

          {!selectedAccountId && !loading && !error && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minH="400px"
            >
              <Text color="cream.400">
                Select an account to view balance history
              </Text>
            </Box>
          )}

          {balanceHistory && !loading && !error && (
            <Box height="400px">
              <ResponsiveLine
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                xScale={{ type: "point" }}
                yScale={{
                  type: "linear",
                  min: "auto",
                  max: "auto",
                  stacked: false,
                  reverse: false,
                }}
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: "Month",
                  legendOffset: 50,
                  legendPosition: "middle",
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Balance ($)",
                  legendOffset: -50,
                  legendPosition: "middle",
                  format: (value) => `$${value.toLocaleString()}`,
                }}
                colors={["#4FD1C5"]}
                lineWidth={3}
                pointSize={8}
                pointColor={{ theme: "background" }}
                pointBorderWidth={2}
                pointBorderColor={{ from: "serieColor" }}
                pointLabelYOffset={-12}
                useMesh={true}
                enableSlices="x"
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fill: "#c9c4b5",
                        fontSize: 11,
                      },
                    },
                    legend: {
                      text: {
                        fill: "#c9c4b5",
                        fontSize: 12,
                        fontWeight: 600,
                      },
                    },
                  },
                  grid: {
                    line: {
                      stroke: "#2d3748",
                      strokeWidth: 1,
                    },
                  },
                  crosshair: {
                    line: {
                      stroke: "#4FD1C5",
                      strokeWidth: 1,
                      strokeOpacity: 0.5,
                    },
                  },
                  tooltip: {
                    container: {
                      background: "#1a2332",
                      color: "#f5f3e7",
                      fontSize: "12px",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                      padding: "8px 12px",
                    },
                  },
                }}
                tooltip={({ point }) => (
                  <Box
                    bg="navy.800"
                    p={2}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="navy.700"
                  >
                    <Text color="cream.100" fontSize="xs" fontWeight="bold">
                      {point.data.xFormatted}
                    </Text>
                    <Text color="teal.300" fontSize="sm" fontWeight="medium">
                      ${Number(point.data.yFormatted).toLocaleString()}
                    </Text>
                  </Box>
                )}
              />
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
