import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  VStack,
  Card,
  CardBody,
  Spinner,
  Text,
  Checkbox,
  CheckboxGroup,
  Stack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Input,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";
import { ResponsiveBar } from "@nivo/bar";
import { useAccounts } from "../../hooks";
import { accountBooksApi, MonthlyReportData, ReportFilters } from "../../api";

// Helper function to get date 6 months ago
const getSixMonthsAgo = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date.toISOString().split("T")[0];
};

// Helper function to get today's date
const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

export function ReportsPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();

  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts(accountBookId || null);

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(getSixMonthsAgo());
  const [endDate, setEndDate] = useState<string>(getToday());
  const [categories, setCategories] = useState<string[]>([]);
  const [reportData, setReportData] = useState<MonthlyReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'combined' | 'debits' | 'credits'>('combined');

  // Fetch available categories
  useEffect(() => {
    if (!accountBookId) return;

    const fetchCategories = async () => {
      try {
        const categoryData = await accountBooksApi.getCategories(accountBookId);
        const categoryList = categoryData.map((c) => c.category).sort();
        setCategories(categoryList);
      } catch (err: any) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [accountBookId]);

  // Fetch report data whenever filters change
  useEffect(() => {
    if (!accountBookId) return;

    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filters: ReportFilters = {};
        if (selectedAccountIds.length > 0) {
          filters.accountIds = selectedAccountIds;
        }
        if (selectedCategories.length > 0) {
          filters.categories = selectedCategories;
        }
        if (startDate) {
          filters.startDate = startDate;
        }
        if (endDate) {
          filters.endDate = endDate;
        }

        const data = await accountBooksApi.getReportData(
          accountBookId,
          filters
        );
        setReportData(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch report data");
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [
    accountBookId,
    selectedAccountIds,
    selectedCategories,
    startDate,
    endDate,
  ]);

  // Calculate linear regression for trend line
  const trendLineData = useMemo(() => {
    if (reportData.length < 2) return [];

    // Calculate linear regression using least squares method
    const n = reportData.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    reportData.forEach((item, index) => {
      const x = index;
      const y = Number(item[metric]) || 0;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const denominator = n * sumXX - sumX * sumX;

    // Avoid division by zero
    if (denominator === 0) {
      const avgY = sumY / n;
      return reportData.map((item) => ({
        month: item.month,
        trend: avgY,
      }));
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return reportData.map((item, index) => ({
      month: item.month,
      trend: slope * index + intercept,
    }));
  }, [reportData, metric]);

  // Transform data for the chart (use absolute value for display)
  const chartData = reportData.map((item, index) => ({
    month: item.month,
    value: Math.abs(item[metric]),
    trend: Math.abs(trendLineData[index]?.trend || 0),
  }));

  const handleAccountChange = (values: string[]) => {
    setSelectedAccountIds(values);
  };

  const handleCategoryChange = (values: string[]) => {
    setSelectedCategories(values);
  };

  if (accountsLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="50vh"
      >
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Box>
    );
  }

  if (accountsError) {
    return (
      <Box>
        <Text color="coral.500">Error: {accountsError}</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="cream.100">
        Reports
      </Heading>

      <Text color="cream.300" fontSize="sm">
        Filter transactions by account and category to view monthly totals.
      </Text>

      <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={4}>
        <GridItem>
          <VStack spacing={2} align="stretch">
            {/* Account Filter */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Heading size="sm" color="cream.100">
                    Accounts
                  </Heading>
                  {accounts.length === 0 ? (
                    <Text color="cream.400" fontSize="sm">
                      No accounts available
                    </Text>
                  ) : (
                    <CheckboxGroup
                      value={selectedAccountIds}
                      onChange={handleAccountChange}
                    >
                      <Stack spacing={2}>
                        {accounts.map((account) => (
                          <Checkbox
                            key={account.id}
                            value={account.id}
                            colorScheme="teal"
                          >
                            <Text fontSize="sm" color="cream.200">
                              {account.name}
                            </Text>
                          </Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Date Range Filter */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <Heading size="sm" color="cream.100">
                    Date Range
                  </Heading>
                  <FormControl>
                    <FormLabel color="cream.300" fontSize="sm">
                      Start Date
                    </FormLabel>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      size="sm"
                      bg="navy.900"
                      borderColor="navy.700"
                      color="cream.100"
                      _hover={{ borderColor: "teal.500" }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="cream.300" fontSize="sm">
                      End Date
                    </FormLabel>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      size="sm"
                      bg="navy.900"
                      borderColor="navy.700"
                      color="cream.100"
                      _hover={{ borderColor: "teal.500" }}
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Category Filter */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Heading size="sm" color="cream.100">
                    Categories
                  </Heading>
                  {categories.length === 0 ? (
                    <Text color="cream.400" fontSize="sm">
                      No categories available
                    </Text>
                  ) : (
                    <CheckboxGroup
                      value={selectedCategories}
                      onChange={handleCategoryChange}
                    >
                      <Stack spacing={2} maxH="400px" overflowY="auto">
                        {categories.map((category) => (
                          <Checkbox
                            key={category}
                            value={category}
                            colorScheme="teal"
                          >
                            <Text fontSize="sm" color="cream.200">
                              {category}
                            </Text>
                          </Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>

        <GridItem>
          <Card minH="500px">
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Heading size="md" color="cream.100">
                    Monthly Transaction {metric === 'combined' ? 'Combined (Credits - Debits)' : metric === 'debits' ? 'Debits' : 'Credits'}
                  </Heading>

                  <ButtonGroup size="sm" isAttached>
                    <Button
                      variant={metric === 'combined' ? 'solid' : 'outline'}
                      colorScheme={metric === 'combined' ? 'teal' : 'gray'}
                      onClick={() => setMetric('combined')}
                    >
                      Combined
                    </Button>
                    <Button
                      variant={metric === 'debits' ? 'solid' : 'outline'}
                      colorScheme={metric === 'debits' ? 'red' : 'gray'}
                      onClick={() => setMetric('debits')}
                    >
                      Debits
                    </Button>
                    <Button
                      variant={metric === 'credits' ? 'solid' : 'outline'}
                      colorScheme={metric === 'credits' ? 'teal' : 'gray'}
                      onClick={() => setMetric('credits')}
                    >
                      Credits
                    </Button>
                  </ButtonGroup>
                </Box>

                {error ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minH="400px"
                  >
                    <Text color="coral.500">Error: {error}</Text>
                  </Box>
                ) : loading ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minH="400px"
                  >
                    <Spinner size="lg" color="teal.500" thickness="3px" />
                  </Box>
                ) : chartData.length === 0 ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minH="400px"
                  >
                    <Text color="cream.400">
                      No data available. Select accounts and/or categories to
                      view report.
                    </Text>
                  </Box>
                ) : (
                  <Box height="450px">
                    <ResponsiveBar
                      layout="vertical"
                      data={chartData}
                      keys={["value"]}
                      indexBy="month"
                      margin={{ top: 20, right: 30, bottom: 60, left: 80 }}
                      padding={0.3}
                      valueScale={{ type: "linear" }}
                      indexScale={{ type: "band", round: true }}
                      colors={metric === 'debits' ? ['#FC8181'] : metric === 'credits' ? ['#4FD1C5'] : { scheme: "nivo" }}
                      layers={[
                        "grid",
                        "axes",
                        "bars",
                        "markers",
                        // Custom trend line layer
                        ({ bars, yScale, innerHeight }) => {
                          if (chartData.length < 2) return null;

                          const linePoints = bars
                            .map((bar, i) => {
                              const dataPoint = chartData.find(
                                (d) => d.month === bar.data.indexValue
                              );
                              if (!dataPoint || dataPoint.trend === undefined)
                                return null;

                              // Use the yScale with the trend value
                              const y = yScale(dataPoint.trend);

                              return {
                                x: bar.x + bar.width / 2,
                                y: y,
                              };
                            })
                            .filter((p) => p !== null && !isNaN(p.y));

                          if (linePoints.length < 2) return null;

                          const pathData = linePoints
                            .map(
                              (point, i) =>
                                `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`
                            )
                            .join(" ");

                          return (
                            <g>
                              <path
                                d={pathData}
                                fill="none"
                                stroke="#ff6b6b"
                                strokeWidth={3}
                                strokeDasharray="8,4"
                              />
                              {linePoints.map((point, i) => (
                                <circle
                                  key={i}
                                  cx={point.x}
                                  cy={point.y}
                                  r={4}
                                  fill="#ff6b6b"
                                  stroke="#ffffff"
                                  strokeWidth={1}
                                />
                              ))}
                            </g>
                          );
                        },
                        "legends",
                        "annotations",
                      ]}
                      theme={{
                        axis: {
                          ticks: {
                            text: {
                              fill: "#f5f3e7",
                              fontSize: 11,
                            },
                          },
                          legend: {
                            text: {
                              fill: "#f5f3e7",
                              fontSize: 12,
                            },
                          },
                        },
                        grid: {
                          line: {
                            stroke: "#4a5568",
                            strokeWidth: 1,
                          },
                        },
                        labels: {
                          text: {
                            fill: "#f5f3e7",
                            fontSize: 11,
                          },
                        },
                        tooltip: {
                          container: {
                            background: "#1a2332",
                            color: "#f5f3e7",
                            fontSize: 12,
                            borderRadius: 4,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                          },
                        },
                      }}
                      borderColor={{
                        from: "color",
                        modifiers: [["darker", 1.6]],
                      }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                        legend: "Month",
                        legendPosition: "middle",
                        legendOffset: 50,
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Total ($)",
                        legendPosition: "middle",
                        legendOffset: -60,
                        format: (value) => `$${value.toLocaleString()}`,
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor={{
                        from: "color",
                        modifiers: [["darker", 1.6]],
                      }}
                      animate={true}
                      motionConfig={{
                        mass: 1,
                        tension: 170,
                        friction: 26,
                        clamp: false,
                      }}
                      role="application"
                      ariaLabel="Monthly transaction totals bar chart"
                    />
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </VStack>
  );
}
