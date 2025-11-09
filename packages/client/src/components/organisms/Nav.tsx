import {
  Avatar,
  Box,
  Container,
  Heading,
  HStack,
  Text,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { FaKiwiBird, FaArrowLeft } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract accountBookId from the URL if we're on an account book page
  const accountBookIdMatch = location.pathname.match(
    /\/account-books\/([^/]+)/
  );
  const accountBookId = accountBookIdMatch ? accountBookIdMatch[1] : null;

  const showBackButton = accountBookId !== null;
  const isDashboard = location.pathname.endsWith("/dashboard");
  const isAccountsPage = location.pathname.endsWith("/accounts");
  const isRulesPage = location.pathname.endsWith("/rules");
  const isBudgetsPage = location.pathname.endsWith("/budgets");

  return (
    <Box bg="navy.800" borderBottom="1px" borderColor="navy.700" py={4}>
      <Container maxW="container.xl">
        <HStack justify="space-between">
          <HStack spacing={4}>
            {showBackButton && (
              <IconButton
                aria-label="Back to account books"
                icon={<FaArrowLeft />}
                size="sm"
                variant="ghost"
                colorScheme="teal"
                onClick={() => navigate("/")}
              />
            )}
            <Heading size="md" color="cream.100">
              WDMMG
            </Heading>
            {accountBookId && (
              <HStack spacing={2} ml={8}>
                <Button
                  size="sm"
                  variant={isDashboard ? "solid" : "ghost"}
                  colorScheme="teal"
                  onClick={() =>
                    navigate(`/account-books/${accountBookId}/dashboard`)
                  }
                >
                  Dashboard
                </Button>
                <Button
                  size="sm"
                  variant={isAccountsPage ? "solid" : "ghost"}
                  colorScheme="teal"
                  onClick={() =>
                    navigate(`/account-books/${accountBookId}/accounts`)
                  }
                >
                  Accounts
                </Button>
                <Button
                  size="sm"
                  variant={isRulesPage ? "solid" : "ghost"}
                  colorScheme="teal"
                  onClick={() =>
                    navigate(`/account-books/${accountBookId}/rules`)
                  }
                >
                  Rules
                </Button>
                <Button
                  size="sm"
                  variant={isBudgetsPage ? "solid" : "ghost"}
                  colorScheme="teal"
                  onClick={() =>
                    navigate(`/account-books/${accountBookId}/budgets`)
                  }
                >
                  Budgets
                </Button>
              </HStack>
            )}
          </HStack>
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
