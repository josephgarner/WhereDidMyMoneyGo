import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';

export interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, incomeAmount: string) => void;
}

export function AddBudgetModal({ isOpen, onClose, onAdd }: AddBudgetModalProps) {
  const [name, setName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setIncomeAmount('0');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd(name, incomeAmount);
    setName('');
    setIncomeAmount('0');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="navy.900" borderColor="navy.700" borderWidth="1px">
        <ModalHeader color="cream.100">Add New Budget</ModalHeader>
        <ModalCloseButton color="cream.100" />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color="cream.100">Budget Name</FormLabel>
                <Input
                  placeholder="e.g., Monthly Budget"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  bg="navy.800"
                  borderColor="navy.700"
                  color="cream.100"
                  _placeholder={{ color: 'cream.400' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="cream.100">Income Amount</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  bg="navy.800"
                  borderColor="navy.700"
                  color="cream.100"
                  _placeholder={{ color: 'cream.400' }}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} color="cream.100">
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              type="submit"
              isDisabled={!name.trim()}
            >
              Add Budget
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
