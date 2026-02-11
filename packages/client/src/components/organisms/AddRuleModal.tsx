import { useState, useCallback } from "react";
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
import { accountBooksApi } from "../../api";
import { RuleForm, RuleFormData } from "./RuleForm";

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
  const [formData, setFormData] = useState<RuleFormData>({
    keyword: "",
    category: "",
    subCategory: "",
  });
  const toast = useToast();

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
          <RuleForm
            accountBookId={accountBookId}
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
              Add Rule
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
