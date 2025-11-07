import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Spinner, Center } from "@chakra-ui/react";
import { Layout } from "../templates";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh" bg="navy.900">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}
