import { Box, Container } from "@chakra-ui/react";
import { Nav } from "../components/Nav";
import { ReactNode } from "react";

type PropsWithChildren<P> = P & { children?: ReactNode };

export function Layout({ children }: PropsWithChildren<any>) {
  return (
    <Box minH="100vh" bg="navy.900">
      <Nav />

      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
    </Box>
  );
}
