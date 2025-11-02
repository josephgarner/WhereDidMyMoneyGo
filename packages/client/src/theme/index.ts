import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Color palette with muted earthy tones
const colors = {
  brand: {
    50: '#f5f3f0',
    100: '#e6e1d9',
    200: '#d4cdc0',
    300: '#c2b8a7',
    400: '#b0a38e',
    500: '#9e8e75',
    600: '#8a7a64',
    700: '#756653',
    800: '#605242',
    900: '#4b3e31',
  },
  earth: {
    50: '#f7f5f3',
    100: '#e8e4df',
    200: '#d9d3ca',
    300: '#cac1b5',
    400: '#bbb0a0',
    500: '#a89c8b',
    600: '#8f8577',
    700: '#766e63',
    800: '#5d574f',
    900: '#44403b',
  },
  sage: {
    50: '#f4f5f3',
    100: '#e5e8e3',
    200: '#d6dad2',
    300: '#c7cdc1',
    400: '#b8bfb0',
    500: '#a9b29f',
    600: '#8f9985',
    700: '#76806b',
    800: '#5c6751',
    900: '#434e37',
  },
};

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const styles = {
  global: {
    body: {
      bg: 'gray.900',
      color: 'earth.100',
    },
  },
};

const components = {
  Button: {
    defaultProps: {
      colorScheme: 'sage',
    },
    variants: {
      solid: {
        bg: 'sage.600',
        color: 'white',
        _hover: {
          bg: 'sage.700',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'gray.800',
        borderColor: 'gray.700',
        borderWidth: '1px',
      },
    },
  },
  Input: {
    variants: {
      filled: {
        field: {
          bg: 'gray.800',
          borderColor: 'gray.700',
          _hover: {
            bg: 'gray.700',
          },
          _focus: {
            bg: 'gray.700',
            borderColor: 'sage.500',
          },
        },
      },
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  styles,
  components,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  },
});

export default theme;
