import {
  Avatar,
  Box,
  Container,
  Heading,
  HStack,
  Text,
  Button,
} from "@chakra-ui/react";
import { FaKiwiBird } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";

export function Nav() {
  const { user, logout } = useAuth();
  return (
    <Box bg="navy.800" borderBottom="1px" borderColor="navy.700" py={4}>
      <Container maxW="container.xl">
        <HStack justify="space-between">
          <Heading size="md" color="cream.100">
            Finance Manager
          </Heading>
          <HStack spacing={4}>
            <Avatar
              size="sm"
              icon={<FaKiwiBird color="cream.200" />}
              bg="teal.600"
            />
            <Text fontWeight="medium" color="cream.200">
              {user?.name || user?.username}
            </Text>
            <Button
              size="sm"
              onClick={logout}
              colorScheme="teal"
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
