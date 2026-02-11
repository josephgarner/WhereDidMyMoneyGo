import { useState, useCallback, useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { CategoryRule } from "@finances/shared";
import { accountBooksApi } from "../../api";
import { RuleForm, RuleFormData } from "./RuleForm";

export interface EditRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBookId: string;
  rule: CategoryRule;
  onSuccess: () => void;
}

export function EditRuleModal({
  isOpen,
  onClose,
  accountBookId,
  rule,
  onSuccess,
}: EditRuleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>({
    keyword: rule.keyword,
    category: rule.category,
    subCategory: rule.subCategory || "",
  });
  const toast = useToast();

  const initialData = useMemo<RuleFormData>(
    () => ({
      keyword: rule.keyword,
      category: rule.category,
      subCategory: rule.subCategory || "",
    }),
    [rule.keyword, rule.category, rule.subCategory]
  );

  const handleDataChange = useCallback((data: RuleFormData) => {
    setFormData(data);
  }, []);

  const handleSubmit = async () => {
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
          <RuleForm
            accountBookId={accountBookId}
            initialData={initialData}
            onDataChange={handleDataChange}
            isOpen={isOpen}
          />
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
