import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
  Avatar,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Heading size="md">Finance Manager</Heading>
            <HStack spacing={4}>
              <Avatar size="sm" name={user?.name || user?.username} />
              <Text fontWeight="medium">{user?.name || user?.username}</Text>
              <Button size="sm" onClick={logout} colorScheme="red" variant="outline">
                Logout
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <Heading size="lg">Welcome to Finance Manager!</Heading>
                <Text color="gray.600">
                  You are successfully authenticated with Authentik.
                </Text>
                <Box p={4} bg="gray.100" borderRadius="md" w="full">
                  <VStack align="start" spacing={2}>
                    <Text><strong>User ID:</strong> {user?.id}</Text>
                    <Text><strong>Email:</strong> {user?.email}</Text>
                    <Text><strong>Username:</strong> {user?.username}</Text>
                    {user?.groups && user.groups.length > 0 && (
                      <Text><strong>Groups:</strong> {user.groups.join(', ')}</Text>
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
