import { useParams } from "react-router-dom";
import { useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  useToast,
  HStack,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { FaTrash, FaPen, FaPlus } from "react-icons/fa6";
import { useRules } from "../../hooks";
import { accountBooksApi } from "../../api";
import { CategoryRule } from "@finances/shared";
import { AddRuleModal, EditRuleModal } from "../../components/organisms";

export function RulesPage() {
  const { accountBookId } = useParams<{ accountBookId: string }>();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { rules, loading, error, refetch } = useRules(accountBookId || null);

  // Delete dialog state
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  // Add rule modal state
  const {
    isOpen: isAddRuleOpen,
    onOpen: onAddRuleOpen,
    onClose: onAddRuleClose,
  } = useDisclosure();

  // Edit rule modal state
  const {
    isOpen: isEditRuleOpen,
    onOpen: onEditRuleOpen,
    onClose: onEditRuleClose,
  } = useDisclosure();
  const [ruleToEdit, setRuleToEdit] = useState<CategoryRule | null>(null);

  // Apply rules confirmation dialog state
  const {
    isOpen: isApplyRulesOpen,
    onOpen: onApplyRulesOpen,
    onClose: onApplyRulesClose,
  } = useDisclosure();
  const [isApplyingRules, setIsApplyingRules] = useState(false);

  // Edit rule handlers
  const handleEditClick = (rule: CategoryRule) => {
    setRuleToEdit(rule);
    onEditRuleOpen();
  };

  const handleRuleSuccess = () => {
    refetch();
  };

  // Delete rule handlers
  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!accountBookId || !ruleToDelete) return;

    try {
      await accountBooksApi.deleteRule(accountBookId, ruleToDelete);
      toast({
        title: "Rule Deleted",
        description: "The rule has been deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      refetch();
      onDeleteClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rule",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Apply rules to all transactions handler
  const handleApplyRulesConfirm = async () => {
    if (!accountBookId) return;

    try {
      setIsApplyingRules(true);

      const result = await accountBooksApi.applyRulesToAllTransactions(accountBookId);

      toast({
        title: "Rules Applied",
        description: `${result.updatedCount} of ${result.totalTransactions} transaction(s) were updated`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onApplyRulesClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply rules",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsApplyingRules(false);
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <Box>
        <Text color="coral.500">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg" color="cream.100">
          Category Rules
        </Heading>
        <HStack spacing={2}>
          {rules.length > 0 && (
            <Button
              size="sm"
              colorScheme="purple"
              variant="outline"
              onClick={onApplyRulesOpen}
            >
              Apply Rules to All Transactions
            </Button>
          )}
          <Button
            size="sm"
            colorScheme="teal"
            leftIcon={<FaPlus />}
            onClick={onAddRuleOpen}
          >
            Add Rule
          </Button>
        </HStack>
      </HStack>

      <Text color="cream.300" fontSize="sm">
        Rules automatically apply categories to transactions based on their
        description. When importing transactions or creating new ones, the
        description is matched against rule keywords.
      </Text>

      <Card>
        <CardBody>
          {rules.length === 0 ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="200px"
            >
              <Text color="cream.400">
                No rules yet. Create a rule to automatically categorize
                transactions.
              </Text>
            </Box>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th color="cream.300">Keyword</Th>
                    <Th color="cream.300">Category</Th>
                    <Th color="cream.300">Subcategory</Th>
                    <Th color="cream.300" width="100px">
                      Actions
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rules.map((rule) => (
                    <Tr key={rule.id}>
                      <Td color="cream.200" fontWeight="medium" whiteSpace="normal" wordBreak="break-word">
                        {rule.keyword}
                      </Td>
                      <Td>
                        <Badge colorScheme="teal" fontSize="xs">
                          {rule.category}
                        </Badge>
                      </Td>
                      <Td>
                        {rule.subCategory && (
                          <Badge colorScheme="purple" fontSize="xs">
                            {rule.subCategory}
                          </Badge>
                        )}
                      </Td>
                      <Td width="100px">
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Edit rule"
                            icon={<FaPen />}
                            size="xs"
                            variant="ghost"
                            colorScheme="teal"
                            onClick={() => handleEditClick(rule)}
                          />
                          <IconButton
                            aria-label="Delete rule"
                            icon={<FaTrash />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteClick(rule.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Delete Rule Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="navy.800" borderColor="navy.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="cream.100">
              Delete Rule
            </AlertDialogHeader>

            <AlertDialogBody color="cream.300">
              Are you sure? This will permanently delete this rule. This action
              cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onDeleteClose}
                variant="outline"
                colorScheme="gray"
              >
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Add Rule Modal */}
      {accountBookId && (
        <AddRuleModal
          isOpen={isAddRuleOpen}
          onClose={onAddRuleClose}
          accountBookId={accountBookId}
          onSuccess={handleRuleSuccess}
        />
      )}

      {/* Edit Rule Modal */}
      {accountBookId && ruleToEdit && (
        <EditRuleModal
          isOpen={isEditRuleOpen}
          onClose={onEditRuleClose}
          accountBookId={accountBookId}
          rule={ruleToEdit}
          onSuccess={handleRuleSuccess}
        />
      )}

      {/* Apply Rules Confirmation Dialog */}
      <AlertDialog
        isOpen={isApplyRulesOpen}
        leastDestructiveRef={cancelRef}
        onClose={onApplyRulesClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="navy.800" borderColor="navy.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="cream.100">
              Apply Rules to All Transactions
            </AlertDialogHeader>

            <AlertDialogBody color="cream.300">
              This will apply all current rules to every existing transaction in
              this account book. Transactions matching rule keywords will have
              their categories updated. This action cannot be undone.
              <br />
              <br />
              Are you sure you want to continue?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onApplyRulesClose}
                variant="outline"
                colorScheme="gray"
                isDisabled={isApplyingRules}
              >
                Cancel
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleApplyRulesConfirm}
                ml={3}
                isLoading={isApplyingRules}
              >
                Apply Rules
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
