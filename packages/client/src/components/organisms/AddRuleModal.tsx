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
  Select,
  Textarea,
} from "@chakra-ui/react";
import { accountBooksApi, CreateRuleData } from "../../api";

export interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBookId: string;
  onSuccess: () => void;
}

export function AddRuleModal({
  isOpen,
  onClose,
  accountBookId,
  onSuccess,
}: AddRuleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState<CreateRuleData>({
    keyword: "",
    category: "",
    subCategory: "",
  });

  const [categories, setCategories] = useState<{
    category: string;
    subCategories: string[];
  }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  const [createNewSubCategory, setCreateNewSubCategory] = useState<boolean>(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen && accountBookId) {
      accountBooksApi.getCategories(accountBookId).then((data) => {
        setCategories(data);
      }).catch((error) => {
        console.error("Failed to fetch categories:", error);
      });
    }
  }, [isOpen, accountBookId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        keyword: "",
        category: "",
        subCategory: "",
      });
      setSelectedCategory("");
      setAvailableSubCategories([]);
      setCreateNewSubCategory(false);
    }
  }, [isOpen]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const categoryData = categories.find((c) => c.category === selectedCategory);
      setAvailableSubCategories(categoryData?.subCategories || []);
      setCreateNewSubCategory(false); // Reset when category changes
    } else {
      setAvailableSubCategories([]);
      setCreateNewSubCategory(false);
    }
  }, [selectedCategory, categories]);

  const handleChange = (field: keyof CreateRuleData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      // User wants to create a new category
      setSelectedCategory("");
      setFormData((prev) => ({ ...prev, category: "", subCategory: "" }));
    } else {
      setSelectedCategory(value);
      setFormData((prev) => ({ ...prev, category: value, subCategory: "" }));
    }
  };

  const handleSubCategoryChange = (value: string) => {
    if (value === "new") {
      // User wants to create a new subcategory
      setCreateNewSubCategory(true);
      setFormData((prev) => ({ ...prev, subCategory: "" }));
    } else {
      setCreateNewSubCategory(false);
      setFormData((prev) => ({ ...prev, subCategory: value }));
    }
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
                <Textarea
                  value={formData.keyword}
                  onChange={(e) => handleChange("keyword", e.target.value)}
                  placeholder="e.g., Starbucks, Shell, Amazon"
                  rows={2}
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: "teal.500" }}
                  _placeholder={{ color: "cream.500" }}
                  resize="vertical"
                />
                <FormHelperText color="cream.500" fontSize="xs">
                  Separate multiple keywords with commas (e.g., "Starbucks, Coffee Shop, Cafe")
                </FormHelperText>
              </FormControl>

              <HStack spacing={3} align="start">
                <FormControl isRequired>
                  <FormLabel color="cream.300" fontSize="sm">
                    Category
                  </FormLabel>
                  <VStack spacing={2} align="stretch">
                    <Select
                      value={selectedCategory || "new"}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      size="sm"
                      bg="navy.900"
                      borderColor="navy.700"
                      color="cream.100"
                      _hover={{ borderColor: "teal.500" }}
                    >
                      <option value="new" style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}>
                        + Create New Category
                      </option>
                      {categories.map((cat) => (
                        <option
                          key={cat.category}
                          value={cat.category}
                          style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}
                        >
                          {cat.category}
                        </option>
                      ))}
                    </Select>
                    {!selectedCategory && (
                      <Input
                        value={formData.category}
                        onChange={(e) => handleChange("category", e.target.value)}
                        placeholder="Enter new category name"
                        size="sm"
                        bg="navy.900"
                        borderColor="navy.700"
                        color="cream.100"
                        _hover={{ borderColor: "teal.500" }}
                        _placeholder={{ color: "cream.500" }}
                      />
                    )}
                  </VStack>
                </FormControl>

                <FormControl>
                  <FormLabel color="cream.300" fontSize="sm">
                    Sub Category
                  </FormLabel>
                  <VStack spacing={2} align="stretch">
                    {selectedCategory && availableSubCategories.length > 0 && !createNewSubCategory && (
                      <Select
                        value={formData.subCategory || ""}
                        onChange={(e) => handleSubCategoryChange(e.target.value)}
                        size="sm"
                        bg="navy.900"
                        borderColor="navy.700"
                        color="cream.100"
                        _hover={{ borderColor: "teal.500" }}
                      >
                        <option value="" style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}>
                          None
                        </option>
                        <option value="new" style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}>
                          + Create New
                        </option>
                        {availableSubCategories.map((subCat) => (
                          <option
                            key={subCat}
                            value={subCat}
                            style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}
                          >
                            {subCat}
                          </option>
                        ))}
                      </Select>
                    )}
                    {(!selectedCategory || availableSubCategories.length === 0 || createNewSubCategory) && (
                      <Input
                        value={formData.subCategory}
                        onChange={(e) => handleChange("subCategory", e.target.value)}
                        placeholder="Optional subcategory"
                        size="sm"
                        bg="navy.900"
                        borderColor="navy.700"
                        color="cream.100"
                        _hover={{ borderColor: "teal.500" }}
                        _placeholder={{ color: "cream.500" }}
                      />
                    )}
                  </VStack>
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
