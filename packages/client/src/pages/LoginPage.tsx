import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Heading, VStack, Text } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <Box minH="100vh" bg="navy.900" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md" centerContent>
        <Box
          p={8}
          borderWidth={1}
          borderColor="navy.700"
          borderRadius="lg"
          boxShadow="2xl"
          bg="navy.800"
        >
          <VStack spacing={6}>
            <Heading size="lg" color="cream.100">Finance Manager</Heading>
            <Text color="cream.300">Please sign in to continue</Text>
            <Button colorScheme="teal" size="lg" onClick={login} width="full">
              Sign in with Authentik
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
