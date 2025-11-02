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
import { useAccountBooks } from "../hooks";

export function HomePage() {
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
        <Card maxW="sm" overflow="hidden">
          <Image src="./assets/organic_68755222.jpg" />
          <CardFooter>
            <HStack flexGrow={1} justify={"space-between"}>
              <Heading size="md" color="cream.100">
                {accountBook.name}
              </Heading>
              <Button>Open</Button>
            </HStack>
          </CardFooter>
        </Card>
      ))}
    </Flex>
  );
}
