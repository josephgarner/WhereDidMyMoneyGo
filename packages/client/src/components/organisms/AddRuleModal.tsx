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
  FormHelperText,
} from "@chakra-ui/react";
import { accountBooksApi, CreateRuleData } from "../../api";
import { useCategorySuggestions } from "../../hooks";

export interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBookId: string;
  accountId?: string; // Optional accountId for category suggestions
  onSuccess: () => void;
}

export function AddRuleModal({
  isOpen,
  onClose,
  accountBookId,
  accountId,
  onSuccess,
}: AddRuleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { suggestions } = useCategorySuggestions(accountId || null);

  const [formData, setFormData] = useState<CreateRuleData>({
    keyword: "",
    category: "",
    subCategory: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        keyword: "",
        category: "",
        subCategory: "",
      });
    }
  }, [isOpen]);

  const handleChange = (field: keyof CreateRuleData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.keyword || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Keyword and Category are required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await accountBooksApi.createRule(accountBookId, formData);

      toast({
        title: "Rule Created",
        description: "Your rule has been created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create rule",
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
        <ModalHeader color="cream.100">Add Category Rule</ModalHeader>
        <ModalCloseButton color="cream.100" />
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel color="cream.300" fontSize="sm">
                  Keyword
                </FormLabel>
                <Input
                  value={formData.keyword}
                  onChange={(e) => handleChange("keyword", e.target.value)}
                  placeholder="e.g., Starbucks, Shell, Amazon"
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: "teal.500" }}
                  _placeholder={{ color: "cream.500" }}
                />
                <FormHelperText color="cream.500" fontSize="xs">
                  Transactions containing this keyword in their description will
                  be automatically categorized
                </FormHelperText>
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
                    list="rule-category-suggestions"
                    autoComplete="off"
                  />
                  <datalist id="rule-category-suggestions">
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
                    list="rule-subcategory-suggestions"
                    autoComplete="off"
                  />
                  <datalist id="rule-subcategory-suggestions">
                    {suggestions.subCategories.map((subCat) => (
                      <option key={subCat} value={subCat} />
                    ))}
                  </datalist>
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
              Add Rule
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
