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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAccountBooks } from "../../hooks";

export function HomePage() {
  const navigate = useNavigate();
  const { accountBooks, loading, error } = useAccountBooks();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <Flex gap="4">
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
  );
}
