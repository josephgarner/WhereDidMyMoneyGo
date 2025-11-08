import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  useToast,
  Text,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Box,
} from '@chakra-ui/react';
import { FaUpload } from 'react-icons/fa6';
import { accountBooksApi } from '../../api';

export interface UploadQIFFormProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onSuccess: () => void;
}

export function UploadQIFForm({ isOpen, onClose, accountId, onSuccess }: UploadQIFFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Reset file when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.qif')) {
        toast({
          title: 'Invalid File',
          description: 'Please select a .qif file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a QIF file to upload',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsUploading(true);

      const result = await accountBooksApi.uploadQIFFile(accountId, selectedFile);

      // Show success message
      toast({
        title: 'QIF File Imported',
        description: `Successfully imported ${result.imported} transaction(s)${
          result.failed > 0 ? `, ${result.failed} failed` : ''
        }${result.parseErrors > 0 ? `, ${result.parseErrors} parse error(s)` : ''}`,
        status: result.failed > 0 || result.parseErrors > 0 ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      });

      // Show detailed errors if any
      if (result.errors && result.errors.length > 0) {
        console.error('QIF Import Errors:', result.errors);

        // Show first few errors in a toast
        const errorSummary = result.errors.slice(0, 3).join('\n');
        toast({
          title: 'Import Errors',
          description: errorSummary + (result.errors.length > 3 ? `\n...and ${result.errors.length - 3} more` : ''),
          status: 'error',
          duration: 8000,
          isClosable: true,
        });
      }

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload QIF file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="navy.800" borderColor="navy.700" borderWidth="1px">
        <ModalHeader color="cream.100">Import QIF File</ModalHeader>
        <ModalCloseButton color="cream.100" />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel color="cream.300" fontSize="sm">
                Select QIF File
              </FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".qif"
                onChange={handleFileSelect}
                size="sm"
                bg="navy.900"
                borderColor="navy.700"
                color="cream.100"
                _hover={{ borderColor: 'teal.500' }}
                sx={{
                  '::file-selector-button': {
                    bg: 'teal.600',
                    color: 'cream.100',
                    border: 'none',
                    borderRadius: 'md',
                    px: 3,
                    py: 1,
                    mr: 3,
                    cursor: 'pointer',
                    _hover: {
                      bg: 'teal.500',
                    },
                  },
                }}
              />
              <FormHelperText color="cream.500" fontSize="xs">
                Upload a Quicken Interchange Format (.qif) file
              </FormHelperText>
            </FormControl>

            {selectedFile && (
              <Box
                p={2}
                bg="navy.900"
                borderRadius="md"
                borderWidth="1px"
                borderColor="teal.700"
              >
                <HStack>
                  <FaUpload color="var(--chakra-colors-teal-400)" />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text color="cream.100" fontSize="sm" fontWeight="medium">
                      {selectedFile.name}
                    </Text>
                    <Text color="cream.400" fontSize="xs">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="teal"
              onClick={onClose}
              isDisabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="teal"
              onClick={handleUpload}
              isLoading={isUploading}
              isDisabled={!selectedFile}
              leftIcon={<FaUpload />}
            >
              Upload & Import
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
