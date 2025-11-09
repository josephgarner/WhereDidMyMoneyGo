import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Button,
  IconButton,
  Spinner,
  useDisclosure,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { ResponsivePie } from '@nivo/pie';
import { accountBooksApi, FlowBudget, BudgetRule } from '../../api';
import { useAccountBooks, useAccounts } from '../../hooks';
import { AddBudgetModal } from '../../components/organisms';

export function BudgetsPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();
  const { accountBooks } = useAccountBooks();
  const { accounts } = useAccounts(accountBookId || null);
  const [budgets, setBudgets] = useState<FlowBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

  const currentAccountBook = accountBooks.find(book => book.id === accountBookId);

  useEffect(() => {
    if (!accountBookId) {
      setLoading(false);
      return;
    }

    fetchBudgets();
  }, [accountBookId]);

  async function fetchBudgets() {
    try {
      setLoading(true);
      const data = await accountBooksApi.getBudgets(accountBookId!);
      setBudgets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch budgets');
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBudget(name: string, incomeAmount: string) {
    try {
      await accountBooksApi.createBudget(accountBookId!, {
        name,
        incomeAmount,
      });
      toast({
        title: 'Budget created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchBudgets();
      onAddClose();
    } catch (err: any) {
      toast({
        title: 'Error creating budget',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  async function handleDeleteBudget(budgetId: string) {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await accountBooksApi.deleteBudget(accountBookId!, budgetId);
      toast({
        title: 'Budget deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchBudgets();
    } catch (err: any) {
      toast({
        title: 'Error deleting budget',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  async function handleUpdateBudgetRules(budgetId: string, rules: BudgetRule[]) {
    try {
      await accountBooksApi.updateBudget(accountBookId!, budgetId, { rules });
      toast({
        title: 'Budget updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchBudgets();
    } catch (err: any) {
      toast({
        title: 'Error updating budget',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="coral.500">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack>
        <Heading size="lg" color="cream.100">
          {currentAccountBook?.name || 'Budgets'}
        </Heading>
        <Spacer />
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          onClick={onAddOpen}
        >
          Add Budget
        </Button>
      </HStack>

      {budgets.length === 0 ? (
        <Card>
          <CardBody>
            <Text color="cream.400" textAlign="center">
              No budgets created yet. Click "Add Budget" to get started.
            </Text>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              accounts={accounts}
              onDelete={() => handleDeleteBudget(budget.id)}
              onUpdateRules={(rules) => handleUpdateBudgetRules(budget.id, rules)}
            />
          ))}
        </VStack>
      )}

      <AddBudgetModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        onAdd={handleAddBudget}
      />
    </VStack>
  );
}

interface BudgetCardProps {
  budget: FlowBudget;
  accounts: any[];
  onDelete: () => void;
  onUpdateRules: (rules: BudgetRule[]) => void;
}

function BudgetCard({ budget, accounts, onDelete, onUpdateRules }: BudgetCardProps) {
  const [rules, setRules] = useState<BudgetRule[]>(budget.rules || []);
  const [hasChanges, setHasChanges] = useState(false);

  const income = parseFloat(budget.incomeAmount);

  // Calculate totals
  const totalAllocated = rules.reduce((sum, rule) => {
    if (rule.kind === 'fixed') {
      return sum + rule.amount;
    } else {
      return sum + (income * (rule.amount / 100));
    }
  }, 0);

  const savings = income - totalAllocated;

  // Prepare pie chart data
  const pieData = rules
    .filter(rule => rule.label.trim() !== '')
    .map((rule, index) => {
      const value = rule.kind === 'fixed'
        ? rule.amount
        : income * (rule.amount / 100);
      return {
        id: rule.label || `Item ${index + 1}`,
        label: rule.label || `Item ${index + 1}`,
        value: value,
      };
    });

  // Add savings to the pie chart if there's any remaining
  if (savings > 0) {
    pieData.push({
      id: 'Savings',
      label: 'Savings',
      value: savings,
    });
  }

  const hasData = pieData.length > 0 && income > 0;

  function addRule() {
    const newRules = [...rules, { label: '', kind: 'fixed' as const, amount: 0 }];
    setRules(newRules);
    setHasChanges(true);
  }

  function updateRule(index: number, updates: Partial<BudgetRule>) {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    setRules(newRules);
    setHasChanges(true);
  }

  function removeRule(index: number) {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    setHasChanges(true);
  }

  function handleSave() {
    onUpdateRules(rules);
    setHasChanges(false);
  }

  function handleCancel() {
    setRules(budget.rules || []);
    setHasChanges(false);
  }

  return (
    <Card>
      <CardHeader>
        <HStack>
          <Heading size="md" color="cream.100">
            {budget.name}
          </Heading>
          <Spacer />
          <IconButton
            aria-label="Delete budget"
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={onDelete}
          />
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Pie Chart */}
          {hasData && (
            <Box>
              <Heading size="sm" color="cream.100" mb={3}>
                Budget Breakdown
              </Heading>
              <Box height="300px" width="100%">
                <ResponsivePie
                  data={pieData}
                  margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'nivo' }}
                  borderWidth={1}
                  borderColor={{
                    from: 'color',
                    modifiers: [['darker', 0.2]],
                  }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#f5f3e7"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{
                    from: 'color',
                    modifiers: [['darker', 3]],
                  }}
                  theme={{
                    labels: {
                      text: {
                        fontSize: 11,
                        fill: '#f5f3e7',
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
                  valueFormat={(value) => `$${value.toFixed(2)}`}
                />
              </Box>
              <Divider mt={4} />
            </Box>
          )}

          {/* Income Display */}
          <Box>
            <Text color="cream.300" fontSize="sm" mb={1}>
              Income Amount
            </Text>
            <Text color="teal.300" fontSize="2xl" fontWeight="bold">
              ${income.toFixed(2)}
            </Text>
          </Box>

          <Divider />

          {/* Budget Items */}
          <VStack spacing={3} align="stretch">
            <HStack>
              <Heading size="sm" color="cream.100">
                Budget Items
              </Heading>
              <Spacer />
              <Button
                size="sm"
                leftIcon={<AddIcon />}
                colorScheme="teal"
                variant="ghost"
                onClick={addRule}
              >
                Add Item
              </Button>
            </HStack>

            {rules.map((rule, index) => (
              <HStack key={index} spacing={2}>
                <FormControl>
                  <Input
                    placeholder="Item name"
                    value={rule.label}
                    onChange={(e) => updateRule(index, { label: e.target.value })}
                    size="sm"
                    bg="navy.800"
                    borderColor="navy.700"
                    color="cream.100"
                  />
                </FormControl>

                <FormControl maxW="120px">
                  <Select
                    value={rule.kind}
                    onChange={(e) => updateRule(index, { kind: e.target.value as 'fixed' | 'percent' })}
                    size="sm"
                    bg="navy.800"
                    borderColor="navy.700"
                    color="cream.100"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percent">Percent</option>
                  </Select>
                </FormControl>

                <FormControl maxW="120px">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={rule.amount}
                    onChange={(e) => updateRule(index, { amount: parseFloat(e.target.value) || 0 })}
                    size="sm"
                    bg="navy.800"
                    borderColor="navy.700"
                    color="cream.100"
                  />
                </FormControl>

                <Text color="cream.300" fontSize="sm" minW="80px" textAlign="right">
                  {rule.kind === 'fixed'
                    ? `$${rule.amount.toFixed(2)}`
                    : `$${(income * (rule.amount / 100)).toFixed(2)}`}
                </Text>

                <IconButton
                  aria-label="Delete item"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => removeRule(index)}
                />
              </HStack>
            ))}
          </VStack>

          <Divider />

          {/* Summary */}
          <VStack spacing={2} align="stretch">
            <HStack>
              <Text color="cream.300" fontSize="sm">
                Total Allocated:
              </Text>
              <Spacer />
              <Text color="cream.100" fontSize="sm" fontWeight="medium">
                ${totalAllocated.toFixed(2)}
              </Text>
            </HStack>
            <HStack>
              <Text color="cream.300" fontSize="lg" fontWeight="bold">
                Savings:
              </Text>
              <Spacer />
              <Text
                color={savings >= 0 ? 'teal.300' : 'coral.400'}
                fontSize="lg"
                fontWeight="bold"
              >
                ${savings.toFixed(2)}
              </Text>
            </HStack>
          </VStack>

          {/* Save/Cancel buttons */}
          {hasChanges && (
            <HStack justify="flex-end" pt={2}>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" colorScheme="teal" onClick={handleSave}>
                Save Changes
              </Button>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
