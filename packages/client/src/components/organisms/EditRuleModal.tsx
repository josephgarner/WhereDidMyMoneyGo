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
import { CategoryRule } from "@finances/shared";
import { accountBooksApi, CreateRuleData } from "../../api";
import { useCategorySuggestions } from "../../hooks";

export interface EditRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBookId: string;
  accountId?: string; // Optional accountId for category suggestions
  rule: CategoryRule;
  onSuccess: () => void;
}

export function EditRuleModal({
  isOpen,
  onClose,
  accountBookId,
  accountId,
  rule,
  onSuccess,
}: EditRuleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { suggestions } = useCategorySuggestions(accountId || null);

  const [formData, setFormData] = useState<CreateRuleData>({
    keyword: rule.keyword,
    category: rule.category,
    subCategory: rule.subCategory || "",
  });

  // Update form data when rule changes
  useEffect(() => {
    setFormData({
      keyword: rule.keyword,
      category: rule.category,
      subCategory: rule.subCategory || "",
    });
  }, [rule]);

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

      await accountBooksApi.updateRule(accountBookId, rule.id, formData);

      toast({
        title: "Rule Updated",
        description: "Your rule has been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update rule",
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
        <ModalHeader color="cream.100">Edit Category Rule</ModalHeader>
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
                    list="edit-rule-category-suggestions"
                    autoComplete="off"
                  />
                  <datalist id="edit-rule-category-suggestions">
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
                    list="edit-rule-subcategory-suggestions"
                    autoComplete="off"
                  />
                  <datalist id="edit-rule-subcategory-suggestions">
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
              Update Rule
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
