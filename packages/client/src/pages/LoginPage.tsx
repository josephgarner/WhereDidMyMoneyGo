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
    <Container maxW="md" centerContent>
      <Box mt={20} p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <VStack spacing={6}>
          <Heading size="lg">Finance Manager</Heading>
          <Text color="gray.600">Please sign in to continue</Text>
          <Button colorScheme="blue" size="lg" onClick={login}>
            Sign in with Authentik
          </Button>
        </VStack>
      </Box>
    </Container>
  );
}
