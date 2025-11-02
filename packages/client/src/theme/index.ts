import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Color palette inspired by organic abstract art
const colors = {
  // Deep teal/forest green - primary dark color
  teal: {
    50: '#e6f2f0',
    100: '#c2ddd9',
    200: '#9bc7c0',
    300: '#72b1a7',
    400: '#529f93',
    500: '#2d8d7f',
    600: '#247c6f',
    700: '#1a685b',
    800: '#0f5447',
    900: '#003d32',
  },
  // Warm cream/beige tones
  cream: {
    50: '#fdfcfa',
    100: '#f9f6f0',
    200: '#f3ede3',
    300: '#ebe3d4',
    400: '#e3d9c5',
    500: '#dccfb6',
    600: '#c9b99d',
    700: '#b5a384',
    800: '#a08d6b',
    900: '#8b7752',
  },
  // Coral/salmon accent
  coral: {
    50: '#fef2f0',
    100: '#fcd9d2',
    200: '#f9beb3',
    300: '#f6a394',
    400: '#f38975',
    500: '#e86d56',
    600: '#d4543d',
    700: '#b63d28',
    800: '#962819',
    900: '#75160b',
  },
  // Soft pink/rose
  rose: {
    50: '#fef5f5',
    100: '#fde3e3',
    200: '#fbc9c9',
    300: '#f9afaf',
    400: '#f79595',
    500: '#f57b7b',
    600: '#e85c5c',
    700: '#d13d3d',
    800: '#b02020',
    900: '#8a0808',
  },
  // Powder blue
  powder: {
    50: '#f0f7fb',
    100: '#d9ecf5',
    200: '#b3d9eb',
    300: '#8dc6e1',
    400: '#67b3d7',
    500: '#4fa0cd',
    600: '#3a87b3',
    700: '#2b6d99',
    800: '#1d537f',
    900: '#0f3965',
  },
  // Deep navy/purple
  navy: {
    50: '#ededf2',
    100: '#d0d1de',
    200: '#b2b4ca',
    300: '#9497b6',
    400: '#767aa2',
    500: '#5d618e',
    600: '#4d5178',
    700: '#3d4162',
    800: '#2d314c',
    900: '#1d2136',
  },
};

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const styles = {
  global: {
    body: {
      bg: 'navy.900',
      color: 'cream.100',
    },
  },
};

const components = {
  Button: {
    defaultProps: {
      colorScheme: 'teal',
    },
    variants: {
      solid: {
        bg: 'teal.600',
        color: 'white',
        _hover: {
          bg: 'teal.700',
        },
      },
      outline: {
        borderColor: 'teal.500',
        color: 'teal.300',
        _hover: {
          bg: 'teal.900',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'navy.800',
        borderColor: 'navy.700',
        borderWidth: '1px',
      },
    },
  },
  Input: {
    variants: {
      filled: {
        field: {
          bg: 'navy.800',
          borderColor: 'navy.700',
          _hover: {
            bg: 'navy.700',
          },
          _focus: {
            bg: 'navy.700',
            borderColor: 'teal.500',
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
