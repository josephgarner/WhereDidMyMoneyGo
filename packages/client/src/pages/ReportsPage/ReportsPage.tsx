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
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { useAccounts } from "../../hooks";
import { accountBooksApi, CategoryReportData, ReportFilters } from "../../api";
import {
  ReportSummaryCards,
  CategoryBreakdownTable,
  CategoryPieChart,
  MonthlyCategoryChart,
} from "../../components/organisms";

interface CategoryWithSubs {
  category: string;
  subCategories: string[];
}

const getSixMonthsAgo = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date.toISOString().split("T")[0];
};

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
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(getSixMonthsAgo());
  const [endDate, setEndDate] = useState<string>(getToday());
  const [categoryData, setCategoryData] = useState<CategoryWithSubs[]>([]);
  const [reportData, setReportData] = useState<CategoryReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available categories with subcategories
  useEffect(() => {
    if (!accountBookId) return;

    const fetchCategories = async () => {
      try {
        const data = await accountBooksApi.getCategories(accountBookId);
        setCategoryData(data.sort((a, b) => a.category.localeCompare(b.category)));
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
        if (selectedSubCategories.length > 0) {
          filters.subCategories = selectedSubCategories;
        }
        if (startDate) {
          filters.startDate = startDate;
        }
        if (endDate) {
          filters.endDate = endDate;
        }

        const data = await accountBooksApi.getCategoryReportData(
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
  }, [accountBookId, selectedAccountIds, selectedCategories, selectedSubCategories, startDate, endDate]);

  const handleAccountChange = (values: string[]) => {
    setSelectedAccountIds(values);
  };


  if (accountsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
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
        Review spending across accounts with category breakdowns.
      </Text>

      <Grid templateColumns={{ base: "1fr", lg: "280px 1fr" }} gap={4}>
        {/* Filter Sidebar */}
        <GridItem>
          <VStack spacing={2} align="stretch">
            {/* Account Filter */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Heading size="sm" color="cream.100">Accounts</Heading>
                  {accounts.length === 0 ? (
                    <Text color="cream.400" fontSize="sm">No accounts available</Text>
                  ) : (
                    <CheckboxGroup value={selectedAccountIds} onChange={handleAccountChange}>
                      <Stack spacing={2}>
                        {accounts.map((account) => (
                          <Checkbox key={account.id} value={account.id} colorScheme="teal">
                            <Text fontSize="sm" color="cream.200">{account.name}</Text>
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
                  <Heading size="sm" color="cream.100">Date Range</Heading>
                  <FormControl>
                    <FormLabel color="cream.300" fontSize="sm">Start Date</FormLabel>
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
                    <FormLabel color="cream.300" fontSize="sm">End Date</FormLabel>
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

            {/* Category & Subcategory Filter */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  <Heading size="sm" color="cream.100">Categories</Heading>
                  {categoryData.length === 0 ? (
                    <Text color="cream.400" fontSize="sm">No categories available</Text>
                  ) : (
                    <Stack spacing={1} maxH="400px" overflowY="auto">
                      {categoryData.map((cat) => (
                        <Box key={cat.category}>
                          <Checkbox
                            isChecked={selectedCategories.includes(cat.category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories((prev) => [...prev, cat.category]);
                              } else {
                                setSelectedCategories((prev) => prev.filter((c) => c !== cat.category));
                              }
                            }}
                            colorScheme="teal"
                          >
                            <Text fontSize="sm" color="cream.200">{cat.category}</Text>
                          </Checkbox>
                          {cat.subCategories.length > 0 && cat.subCategories.map((sub) => (
                            <Box key={sub} pl={6} pt={1}>
                              <Checkbox
                                isChecked={selectedSubCategories.includes(sub)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubCategories((prev) => [...prev, sub]);
                                  } else {
                                    setSelectedSubCategories((prev) => prev.filter((s) => s !== sub));
                                  }
                                }}
                                colorScheme="purple"
                              >
                                <Text fontSize="xs" color="cream.400" fontStyle="italic">{sub}</Text>
                              </Checkbox>
                            </Box>
                          ))}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>

        {/* Main Content */}
        <GridItem>
          {error ? (
            <Box display="flex" alignItems="center" justifyContent="center" minH="400px">
              <Text color="coral.500">Error: {error}</Text>
            </Box>
          ) : loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" minH="400px">
              <Spinner size="lg" color="teal.500" thickness="3px" />
            </Box>
          ) : !reportData || reportData.categoryTotals.length === 0 ? (
            <Box display="flex" alignItems="center" justifyContent="center" minH="400px">
              <Text color="cream.400">
                No data available. Select accounts and/or adjust filters to view report.
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {/* Summary Cards */}
              <ReportSummaryCards totals={reportData.totals} />

              {/* Pie Chart + Breakdown Table side by side */}
              <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={4}>
                <GridItem>
                  <CategoryPieChart categoryTotals={reportData.categoryTotals} />
                </GridItem>
                <GridItem>
                  <CategoryBreakdownTable
                    categoryTotals={reportData.categoryTotals}
                    subCategoryTotals={reportData.subCategoryTotals}
                  />
                </GridItem>
              </Grid>

              {/* Monthly Stacked Bar Chart */}
              <MonthlyCategoryChart monthlyCategoryTotals={reportData.monthlyCategoryTotals} />
            </VStack>
          )}
        </GridItem>
      </Grid>
    </VStack>
  );
}
