import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const success = searchParams.get('success');

    const handleCallback = async () => {
      if (success === 'true') {
        await refreshUser();
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <Center h="100vh" bg="gray.900">
      <VStack spacing={4}>
        <Spinner size="xl" color="sage.500" thickness="4px" />
        <Text color="earth.200">Completing authentication...</Text>
      </VStack>
    </Center>
  );
}
