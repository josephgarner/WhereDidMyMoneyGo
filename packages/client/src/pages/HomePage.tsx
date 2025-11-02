import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";
import { Nav } from "../components/Nav";

export function HomePage() {
  const { user } = useAuth();

  return (
    <Box minH="100vh" bg="gray.900">
      <Nav />

      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <Heading size="lg" color="earth.100">Welcome to Finance Manager!</Heading>
                <Text color="earth.300">
                  You are successfully authenticated with Authentik.
                </Text>
                <Box p={4} bg="gray.700" borderRadius="md" w="full" borderWidth="1px" borderColor="gray.600">
                  <VStack align="start" spacing={2}>
                    <Text color="earth.200">
                      <strong>User ID:</strong> {user?.id}
                    </Text>
                    <Text color="earth.200">
                      <strong>Email:</strong> {user?.email}
                    </Text>
                    <Text color="earth.200">
                      <strong>Username:</strong> {user?.username}
                    </Text>
                    {user?.groups && user.groups.length > 0 && (
                      <Text color="earth.200">
                        <strong>Groups:</strong> {user.groups.join(", ")}
                      </Text>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
