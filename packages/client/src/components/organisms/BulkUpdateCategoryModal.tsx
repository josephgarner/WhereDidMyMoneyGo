import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react';
import { accountBooksApi } from '../../api';

export interface BulkUpdateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBookId: string;
  selectedCount: number;
  onSubmit: (category: string, subCategory: string) => void;
}

export function BulkUpdateCategoryModal({
  isOpen,
  onClose,
  accountBookId,
  selectedCount,
  onSubmit,
}: BulkUpdateCategoryModalProps) {
  const [categories, setCategories] = useState<
    { category: string; subCategories: string[] }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  const [subCategory, setSubCategory] = useState<string>('');
  const [createNewSubCategory, setCreateNewSubCategory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen && accountBookId) {
      accountBooksApi
        .getCategories(accountBookId)
        .then((data) => setCategories(data))
        .catch((error) => console.error('Failed to fetch categories:', error));
    }
  }, [isOpen, accountBookId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('');
      setNewCategory('');
      setSubCategory('');
      setAvailableSubCategories([]);
      setCreateNewSubCategory(false);
    }
  }, [isOpen]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const categoryData = categories.find((c) => c.category === selectedCategory);
      setAvailableSubCategories(categoryData?.subCategories || []);
      setCreateNewSubCategory(false);
      setSubCategory('');
    } else {
      setAvailableSubCategories([]);
      setCreateNewSubCategory(false);
    }
  }, [selectedCategory, categories]);

  const isKnownCategory = categories.some((c) => c.category === selectedCategory);

  const handleCategoryChange = (value: string) => {
    if (value === 'new') {
      setSelectedCategory('');
      setNewCategory('');
      setSubCategory('');
    } else {
      setSelectedCategory(value);
      setNewCategory('');
      setSubCategory('');
    }
  };

  const handleSubCategoryChange = (value: string) => {
    if (value === 'new') {
      setCreateNewSubCategory(true);
      setSubCategory('');
    } else {
      setCreateNewSubCategory(false);
      setSubCategory(value);
    }
  };

  const resolvedCategory = isKnownCategory ? selectedCategory : newCategory;
  const canSubmit = resolvedCategory.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit(resolvedCategory.trim(), subCategory.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="navy.800" borderColor="navy.700" borderWidth="1px">
        <ModalHeader color="cream.100">
          Update Category
          <Text fontSize="sm" fontWeight="normal" color="cream.400" mt={1}>
            {selectedCount} transaction{selectedCount !== 1 ? 's' : ''} selected
          </Text>
        </ModalHeader>
        <ModalCloseButton color="cream.300" />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack spacing={3} align="start">
              <FormControl isRequired>
                <FormLabel color="cream.300" fontSize="sm">
                  Category
                </FormLabel>
                <VStack spacing={2} align="stretch">
                  <Select
                    value={isKnownCategory ? selectedCategory : 'new'}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    size="sm"
                    bg="navy.900"
                    borderColor="navy.700"
                    color="cream.100"
                    _hover={{ borderColor: 'teal.500' }}
                  >
                    <option
                      value="new"
                      style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
                    >
                      + Create New Category
                    </option>
                    {categories.map((cat) => (
                      <option
                        key={cat.category}
                        value={cat.category}
                        style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
                      >
                        {cat.category}
                      </option>
                    ))}
                  </Select>
                  {!isKnownCategory && (
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                      size="sm"
                      bg="navy.900"
                      borderColor="navy.700"
                      color="cream.100"
                      _hover={{ borderColor: 'teal.500' }}
                      _placeholder={{ color: 'cream.500' }}
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
                        value={subCategory}
                        onChange={(e) => handleSubCategoryChange(e.target.value)}
                        size="sm"
                        bg="navy.900"
                        borderColor="navy.700"
                        color="cream.100"
                        _hover={{ borderColor: 'teal.500' }}
                      >
                        <option
                          value=""
                          style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
                        >
                          None
                        </option>
                        <option
                          value="new"
                          style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
                        >
                          + Create New
                        </option>
                        {availableSubCategories.map((subCat) => (
                          <option
                            key={subCat}
                            value={subCat}
                            style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}
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
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      placeholder="Optional subcategory"
                      size="sm"
                      bg="navy.900"
                      borderColor="navy.700"
                      color="cream.100"
                      _hover={{ borderColor: 'teal.500' }}
                      _placeholder={{ color: 'cream.500' }}
                    />
                  )}
                </VStack>
              </FormControl>
            </HStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} color="cream.300">
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
          >
            Update {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
