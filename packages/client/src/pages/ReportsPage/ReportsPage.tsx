import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import { ResponsiveBar } from "@nivo/bar";
import { useAccounts } from "../../hooks";
import { accountBooksApi, MonthlyReportData, ReportFilters } from "../../api";

export function ReportsPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();

  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts(accountBookId || null);

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [reportData, setReportData] = useState<MonthlyReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available categories
  useEffect(() => {
    if (!accountBookId) return;

    const fetchCategories = async () => {
      try {
        const categoryData = await accountBooksApi.getCategories(accountBookId);
        const categoryList = categoryData.map(c => c.category).sort();
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

        const data = await accountBooksApi.getReportData(accountBookId, filters);
        setReportData(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch report data");
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [accountBookId, selectedAccountIds, selectedCategories]);

  // Transform data for the chart
  const chartData = reportData.map((item) => ({
    month: item.month,
    total: item.total,
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
          <VStack spacing={4} align="stretch">
            {/* Account Filter */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={3}>
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

            {/* Category Filter */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={3}>
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
                <Heading size="md" color="cream.100">
                  Monthly Transaction Totals
                </Heading>

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
                      No data available. Select accounts and/or categories to view report.
                    </Text>
                  </Box>
                ) : (
                  <Box height="450px">
                    <ResponsiveBar
                      data={chartData}
                      keys={["total"]}
                      indexBy="month"
                      margin={{ top: 20, right: 30, bottom: 60, left: 80 }}
                      padding={0.3}
                      valueScale={{ type: "linear" }}
                      indexScale={{ type: "band", round: true }}
                      colors={{ scheme: "nivo" }}
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
