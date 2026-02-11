import { useState, useEffect } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  FormHelperText,
  Select,
  Textarea,
} from "@chakra-ui/react";
import { accountBooksApi } from "../../api";

export interface RuleFormData {
  keyword: string;
  category: string;
  subCategory: string;
}

export interface RuleFormProps {
  accountBookId: string;
  initialData?: RuleFormData;
  onDataChange: (data: RuleFormData) => void;
  isOpen: boolean;
}

export function RuleForm({
  accountBookId,
  initialData,
  onDataChange,
  isOpen,
}: RuleFormProps) {
  const [formData, setFormData] = useState<RuleFormData>({
    keyword: "",
    category: "",
    subCategory: "",
  });

  const [categories, setCategories] = useState<
    { category: string; subCategories: string[] }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableSubCategories, setAvailableSubCategories] = useState<
    string[]
  >([]);
  const [createNewSubCategory, setCreateNewSubCategory] =
    useState<boolean>(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen && accountBookId) {
      accountBooksApi
        .getCategories(accountBookId)
        .then((data) => {
          setCategories(data);
        })
        .catch((error) => {
          console.error("Failed to fetch categories:", error);
        });
    }
  }, [isOpen, accountBookId]);

  // Reset/populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        setSelectedCategory(initialData.category);
        setCreateNewSubCategory(false);
      } else {
        setFormData({ keyword: "", category: "", subCategory: "" });
        setSelectedCategory("");
        setAvailableSubCategories([]);
        setCreateNewSubCategory(false);
      }
    }
  }, [isOpen, initialData]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const categoryData = categories.find(
        (c) => c.category === selectedCategory
      );
      const subs = categoryData?.subCategories || [];
      setAvailableSubCategories(subs);

      // If in edit mode and the current subcategory isn't in the list, show the input
      if (
        initialData &&
        formData.subCategory &&
        !subs.includes(formData.subCategory)
      ) {
        setCreateNewSubCategory(true);
      } else {
        setCreateNewSubCategory(false);
      }
    } else {
      setAvailableSubCategories([]);
      setCreateNewSubCategory(false);
    }
  }, [selectedCategory, categories]);

  const updateFormData = (updated: RuleFormData) => {
    setFormData(updated);
    onDataChange(updated);
  };

  const handleChange = (field: keyof RuleFormData, value: string) => {
    const updated = { ...formData, [field]: value };
    updateFormData(updated);
  };

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      setSelectedCategory("");
      updateFormData({ ...formData, category: "", subCategory: "" });
    } else {
      setSelectedCategory(value);
      updateFormData({ ...formData, category: value, subCategory: "" });
    }
  };

  const handleSubCategoryChange = (value: string) => {
    if (value === "new") {
      setCreateNewSubCategory(true);
      updateFormData({ ...formData, subCategory: "" });
    } else {
      setCreateNewSubCategory(false);
      updateFormData({ ...formData, subCategory: value });
    }
  };

  // Determine if the selected category is a known one (for Select display)
  const isKnownCategory = categories.some(
    (c) => c.category === selectedCategory
  );

  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel color="cream.300" fontSize="sm">
          Keywords
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
          Separate multiple keywords with commas
        </FormHelperText>
      </FormControl>

      <HStack spacing={3} align="start">
        <FormControl isRequired>
          <FormLabel color="cream.300" fontSize="sm">
            Category
          </FormLabel>
          <VStack spacing={2} align="stretch">
            <Select
              value={isKnownCategory ? selectedCategory : "new"}
              onChange={(e) => handleCategoryChange(e.target.value)}
              size="sm"
              bg="navy.900"
              borderColor="navy.700"
              color="cream.100"
              _hover={{ borderColor: "teal.500" }}
            >
              <option
                value="new"
                style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}
              >
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
            {!isKnownCategory && (
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
            {isKnownCategory &&
              availableSubCategories.length > 0 &&
              !createNewSubCategory && (
                <Select
                  value={formData.subCategory || ""}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  size="sm"
                  bg="navy.900"
                  borderColor="navy.700"
                  color="cream.100"
                  _hover={{ borderColor: "teal.500" }}
                >
                  <option
                    value=""
                    style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}
                  >
                    None
                  </option>
                  <option
                    value="new"
                    style={{ backgroundColor: "#1a2332", color: "#f5f3e7" }}
                  >
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
            {(!isKnownCategory ||
              availableSubCategories.length === 0 ||
              createNewSubCategory) && (
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
  );
}
