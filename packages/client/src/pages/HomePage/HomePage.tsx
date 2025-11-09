import {
  Image,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
  Flex,
  Spacer,
  CardFooter,
  Button,
  HStack,
  CardHeader,
  useDisclosure,
  useToast,
  Box,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useAccountBooks } from "../../hooks";
import { AddAccountBookModal } from "../../components/organisms";
import { accountBooksApi } from "../../api";

export function HomePage() {
  const navigate = useNavigate();
  const { accountBooks, loading, error, refetch } = useAccountBooks();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  async function handleCreateAccountBook(name: string) {
    try {
      await accountBooksApi.createAccountBook(name);
      toast({
        title: 'Account book created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Error creating account book',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack>
        <Heading size="lg" color="cream.100">
          My Account Books
        </Heading>
        <Spacer />
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          onClick={onOpen}
        >
          Create Account Book
        </Button>
      </HStack>

      <Flex gap="4" wrap="wrap">
      {accountBooks.map((accountBook) => (
        <Card key={accountBook.id} maxW="sm" overflow="hidden">
          <Image src="./assets/organic_68755222.jpg" />
          <CardFooter>
            <HStack flexGrow={1} justify={"space-between"}>
              <Heading size="md" color="cream.100">
                {accountBook.name}
              </Heading>
              <Button onClick={() => navigate(`/account-books/${accountBook.id}/dashboard`)}>
                Open
              </Button>
            </HStack>
          </CardFooter>
        </Card>
      ))}
      </Flex>

      <AddAccountBookModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={handleCreateAccountBook}
      />
    </VStack>
  );
}
