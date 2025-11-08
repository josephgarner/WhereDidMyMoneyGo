import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { accountBooksApi, CreateTransactionData } from "../../api";
import { useCategorySuggestions } from "../../hooks";

export interface AddTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onSuccess: () => void;
}

export function AddTransactionForm({
  isOpen,
  onClose,
  accountId,
  onSuccess,
}: AddTransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { suggestions } = useCategorySuggestions(accountId);

  const [formData, setFormData] = useState<CreateTransactionData>({
    transactionDate: new Date().toISOString().split("T")[0],
    description: "",
    category: "",
    subCategory: "",
    debitAmount: "",
    creditAmount: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        transactionDate: new Date().toISOString().split("T")[0],
        description: "",
        category: "",
        subCategory: "",
        debitAmount: "",
        creditAmount: "",
      });
    }
  }, [isOpen]);

  const handleChange = (field: keyof CreateTransactionData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Description and Category are required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate that at least one amount is provided
    const debit = parseFloat(formData.debitAmount || "0");
    const credit = parseFloat(formData.creditAmount || "0");

    if (debit === 0 && credit === 0) {
      toast({
        title: "Validation Error",
        description: "Either Debit or Credit amount must be greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await accountBooksApi.createTransaction(accountId, {
        ...formData,
        debitAmount: formData.debitAmount || "0",
        creditAmount: formData.creditAmount || "0",
      });

      toast({
        title: "Transaction Created",
        description: "Your transaction has been added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="navy.800" borderColor="navy.700" borderWidth="1px">
        <ModalHeader color="cream.100">Add Transaction</ModalHeader>
        <ModalCloseButton color="cream.100" />
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel color="cream.300" fontSize="sm">
                  Transaction Date
                </FormLabel>
                <Input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) =>
                    handleChange("transactionDate", e.target.value)
                  }
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: "teal.500" }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="cream.300" fontSize="sm">
                  Description
                </FormLabel>
                <Input
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter transaction description"
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: "teal.500" }}
                  _placeholder={{ color: "cream.500" }}
                />
              </FormControl>

              <HStack spacing={3}>
                <FormControl isRequired>
                  <FormLabel color="cream.300" fontSize="sm">
                    Category
                  </FormLabel>
                  <Input
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    placeholder="e.g., Food, Transport"
                    size="sm"
                    bg="navy.900"
                    borderColor="navy.700"
                    color="cream.100"
                    _hover={{ borderColor: "teal.500" }}
                    _placeholder={{ color: "cream.500" }}
                    list="add-category-suggestions"
                    autoComplete="off"
                  />
                  <datalist id="add-category-suggestions">
                    {suggestions.categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </FormControl>

                <FormControl>
                  <FormLabel color="cream.300" fontSize="sm">
                    Sub Category
                  </FormLabel>
                  <Input
                    value={formData.subCategory}
                    onChange={(e) => handleChange("subCategory", e.target.value)}
                    placeholder="Optional"
                    size="sm"
                    bg="navy.900"
                    borderColor="navy.700"
                    color="cream.100"
                    _hover={{ borderColor: "teal.500" }}
                    _placeholder={{ color: "cream.500" }}
                    list="add-subcategory-suggestions"
                    autoComplete="off"
                  />
                  <datalist id="add-subcategory-suggestions">
                    {suggestions.subCategories.map((subCat) => (
                      <option key={subCat} value={subCat} />
                    ))}
                  </datalist>
                </FormControl>
              </HStack>

              <HStack spacing={3}>
                <FormControl>
                  <FormLabel color="cream.300" fontSize="sm">
                    Debit Amount
                  </FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.debitAmount}
                    onChange={(e) => handleChange("debitAmount", e.target.value)}
                    placeholder="0.00"
                    size="sm"
                    bg="navy.900"
                    borderColor="navy.700"
                    color="cream.100"
                    _hover={{ borderColor: "teal.500" }}
                    _placeholder={{ color: "cream.500" }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="cream.300" fontSize="sm">
                    Credit Amount
                  </FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.creditAmount}
                    onChange={(e) => handleChange("creditAmount", e.target.value)}
                    placeholder="0.00"
                    size="sm"
                    bg="navy.900"
                    borderColor="navy.700"
                    color="cream.100"
                    _hover={{ borderColor: "teal.500" }}
                    _placeholder={{ color: "cream.500" }}
                  />
                </FormControl>
              </HStack>
            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="teal"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="teal"
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              Add Transaction
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
