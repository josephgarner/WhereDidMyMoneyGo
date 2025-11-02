import {
  Avatar,
  Box,
  Container,
  Heading,
  HStack,
  Text,
  Button,
} from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";

export function Nav() {
  const { user, logout } = useAuth();
  return (
    <Box bg="gray.800" borderBottom="1px" borderColor="gray.700" py={4}>
      <Container maxW="container.xl">
        <HStack justify="space-between">
          <Heading size="md" color="earth.100">Finance Manager</Heading>
          <HStack spacing={4}>
            <Avatar size="sm" name={user?.name || user?.username} bg="sage.600" />
            <Text fontWeight="medium" color="earth.200">{user?.name || user?.username}</Text>
            <Button
              size="sm"
              onClick={logout}
              colorScheme="sage"
              variant="outline"
            >
              Logout
            </Button>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}
