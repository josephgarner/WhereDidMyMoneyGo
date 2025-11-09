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

export interface AddAccountBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export function AddAccountBookModal({ isOpen, onClose, onAdd }: AddAccountBookModalProps) {
  const [name, setName] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd(name);
    setName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="navy.900" borderColor="navy.700" borderWidth="1px">
        <ModalHeader color="cream.100">Create New Account Book</ModalHeader>
        <ModalCloseButton color="cream.100" />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color="cream.100">Account Book Name</FormLabel>
                <Input
                  placeholder="e.g., Personal Finance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
