# Where Did My Money Go (WDMMG) - Finance Manager

A full-stack personal finance management application built with React, Node.js, and PostgreSQL, organized as a monorepo following atomic design principles.

## Project Overview

**WDMMG** is a comprehensive finance management tool that enables users to:
- Track multiple account books with independent accounts and transactions
- Import transactions from QIF (Quicken Interchange Format) files
- Auto-categorize transactions using keyword-based rules
- Visualize financial data with interactive charts
- Manage budgets with flow-based allocation
- Generate detailed financial reports with flexible filtering

## Technology Stack

### Frontend (`packages/client`)
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **UI Library:** Chakra UI v2
- **Routing:** React Router 7
- **State Management:** React Context API + Custom Hooks
- **HTTP Client:** Axios
- **Charts:** Nivo
- **Animation:** Framer Motion

### Backend (`packages/server`)
- **Runtime:** Node.js 22+ + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Authentik OAuth2/OIDC
- **Logging:** Winston + Morgan
- **File Upload:** Multer

### Shared (`packages/shared`)
- TypeScript type definitions
- Shared interfaces and API contracts

## Atomic Design Architecture

This project implements **atomic design principles** to organize UI components into a scalable, maintainable hierarchy. Components are categorized into five levels of abstraction:

```
Atoms → Molecules → Organisms → Templates → Pages
```

### Component Directory Structure

```
packages/client/src/
├── components/
│   ├── molecules/      # Simple UI combinations (1 component)
│   ├── organisms/      # Complex, feature-rich components (14 components)
│   └── templates/      # Page layouts (1 component)
├── pages/              # Complete pages with routing (8 pages)
└── theme/              # Chakra UI theme configuration
```

### Atomic Design Levels

#### 1. Atoms (via Chakra UI)

**Philosophy:** Use Chakra UI primitives as atoms rather than creating custom wrappers.

**Available Atoms:**
- **Form Controls:** `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch`
- **Layout:** `Box`, `Flex`, `Grid`, `Stack`, `HStack`, `VStack`, `Container`, `Divider`
- **Typography:** `Text`, `Heading`, `Code`, `Kbd`
- **Data Display:** `Badge`, `Card`, `List`, `Table`, `Tag`, `Avatar`
- **Feedback:** `Alert`, `Spinner`, `Progress`, `Toast`
- **Overlay:** `Modal`, `Drawer`, `Popover`, `Tooltip`, `Menu`
- **Navigation:** `Link`, `Breadcrumb`, `Tabs`
- **Media:** `Image`, `Icon`

**Usage Example:**
```tsx
import { Button, Input, VStack, Card, CardBody } from '@chakra-ui/react';

function SimpleForm() {
  return (
    <Card>
      <CardBody>
        <VStack spacing={4}>
          <Input placeholder="Enter value" />
          <Button colorScheme="blue">Submit</Button>
        </VStack>
      </CardBody>
    </Card>
  );
}
```

**When to create custom atoms:**
- Only when you need to enforce specific design system constraints
- When you need to add app-specific functionality to a primitive
- When you need to compose multiple Chakra atoms into a single reusable unit

#### 2. Molecules

**Definition:** Simple combinations of atoms that serve a single purpose.

**Current Molecules:**
- `Pagination.tsx` (138 lines) - Reusable pagination control with page size selector

**Molecule Characteristics:**
- Combines 2-5 atoms
- Has a single, focused responsibility
- Reusable across multiple organisms/pages
- Minimal business logic
- Self-contained with clear props interface

**Example Molecule Pattern:**
```tsx
// Good molecule example
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ ... }: PaginationProps) {
  return (
    <HStack spacing={4}>
      <IconButton ... />  {/* Atom */}
      <Text>Page {currentPage} of {totalPages}</Text>  {/* Atom */}
      <Select>...</Select>  {/* Atom */}
    </HStack>
  );
}
```

**Candidates for Extraction:**
- Date range picker (currently inline in TransactionDateFilter)
- Account selector dropdown
- Category badge with color coding
- Transaction amount display (formatted with debit/credit styling)

#### 3. Organisms

**Definition:** Complex, feature-rich components composed of molecules, atoms, and other organisms.

**Current Organisms (14 components):**

**Navigation:**
- `Nav.tsx` (128 lines) - Main navigation bar with user info and logout

**Authentication:**
- `ProtectedRoute.tsx` (26 lines) - Route wrapper for authenticated pages

**Filters:**
- `TransactionDateFilter.tsx` (189 lines) - Date range/month filter with date pickers
- `TransactionCategoryFilter.tsx` (130 lines) - Category/subcategory filter dropdown

**Transaction Management:**
- `AddTransactionForm.tsx` (288 lines) - Modal form for creating transactions
- `EditTransactionModal.tsx` (287 lines) - Modal form for editing transactions
- `UploadQIFForm.tsx` (222 lines) - QIF file upload and processing form

**Account Management:**
- `AddAccountForm.tsx` (172 lines) - Form for creating new accounts

**Rule Management:**
- `EditRuleModal.tsx` (211 lines) - Modal for editing category rules
- `AddRuleModal.tsx` (308 lines) - Complex modal for creating category rules

**Budget Management:**
- `AddBudgetModal.tsx` (99 lines) - Modal for creating budgets
- `AddAccountBookModal.tsx` (81 lines) - Modal for creating account books

**Data Visualization:**
- `AccountBalanceChart.tsx` (264 lines) - 24-month balance chart with account selector
- `MonthlyDebitCreditChart.tsx` (134 lines) - Monthly debit/credit bar chart

**Organism Characteristics:**
- Contains business logic and state management
- Uses custom hooks for data fetching
- Combines multiple molecules and atoms
- May contain other organisms
- Often maps to a specific feature or domain concept
- 100-300 lines typical (larger ones should be refactored)

**Example Organism Pattern:**
```tsx
import { useAccounts, useTransactions } from '../../hooks';
import { Pagination } from '../molecules';

export function TransactionList() {
  const { accounts, loading } = useAccounts();
  const { transactions, refetch } = useTransactions();
  const [page, setPage] = useState(1);

  // Complex logic and state management

  return (
    <Card>
      <CardHeader>
        <TransactionDateFilter ... />  {/* Organism */}
        <TransactionCategoryFilter ... />  {/* Organism */}
      </CardHeader>
      <CardBody>
        {transactions.map(t => <TransactionRow ... />)}  {/* Molecules/Atoms */}
      </CardBody>
      <CardFooter>
        <Pagination ... />  {/* Molecule */}
      </CardFooter>
    </Card>
  );
}
```

#### 4. Templates

**Definition:** Page-level layout components that define structure without content.

**Current Templates:**
- `Layout.tsx` (17 lines) - Main application layout wrapper

**Template Structure:**
```tsx
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box minH="100vh" bg="gray.900">
      <Nav />  {/* Organism */}
      <Container maxW="container.xl" py={8}>
        {children}  {/* Page content injected here */}
      </Container>
    </Box>
  );
}
```

**Template Characteristics:**
- Defines page structure and layout
- Uses `children` or render props for content injection
- Contains navigation, headers, footers, sidebars
- No business logic or data fetching
- Reusable across multiple pages

**Potential Additional Templates:**
- `DashboardLayout` - Two-column layout with sidebar
- `FormLayout` - Centered form container with consistent styling
- `ReportLayout` - Layout for report pages with filter sidebar

#### 5. Pages

**Definition:** Complete views that combine templates, organisms, molecules, and atoms with routing.

**Current Pages (8):**
- `HomePage` - Account book selection and creation
- `LoginPage` - Authentication page with OAuth
- `AuthCallbackPage` - OAuth callback handler
- `DashboardPage` (292 lines) - Main dashboard with multiple charts
- `AccountsPage` (802 lines) - Account and transaction management (most complex)
- `RulesPage` - Category rule management
- `BudgetsPage` - Budget management interface
- `ReportsPage` - Financial reports with filters

**Page Structure:**
```
packages/client/src/pages/
├── HomePage/
│   ├── HomePage.tsx
│   └── index.ts
├── DashboardPage/
│   ├── DashboardPage.tsx
│   └── index.ts
└── ...
```

**Page Characteristics:**
- Located in `/src/pages/[PageName]/`
- Connected to routing in `App.tsx`
- Uses `useAuth()` for authentication context
- Composes organisms, molecules, and atoms
- May have local state for UI interactions
- Handles routing and query parameters

**Example Page Pattern:**
```tsx
export function DashboardPage() {
  const { user } = useAuth();
  const { accountBook } = useLocalStorage('selectedAccountBook');
  const { accounts, loading } = useAccounts(accountBook?.id);

  if (loading) return <Spinner />;

  return (
    <Layout>
      <VStack spacing={8}>
        <Heading>Dashboard</Heading>
        <AccountBalanceChart accounts={accounts} />  {/* Organism */}
        <MonthlyDebitCreditChart />  {/* Organism */}
      </VStack>
    </Layout>
  );
}
```

## Component Development Guidelines

### Creating New Components

#### 1. Determine Atomic Level

Ask these questions:
- **Atom:** Is it a single UI primitive? → Use Chakra UI directly
- **Molecule:** Does it combine 2-5 atoms for a simple purpose? → `components/molecules/`
- **Organism:** Does it have business logic, state, or use hooks? → `components/organisms/`
- **Template:** Does it define page structure? → `components/templates/`
- **Page:** Is it a complete view with routing? → `pages/[PageName]/`

#### 2. File Naming Convention

- Use PascalCase: `ComponentName.tsx`
- Export via `index.ts` in the same directory
- Colocate types and interfaces in the same file

```tsx
// components/molecules/DateRangePicker/DateRangePicker.tsx
export interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  // Implementation
}

// components/molecules/DateRangePicker/index.ts
export { DateRangePicker, type DateRangePickerProps } from './DateRangePicker';
```

#### 3. Component Structure Template

```tsx
import { useState } from 'react';
import { Box, Button, VStack } from '@chakra-ui/react';
import { useCustomHook } from '../../hooks';

// Props interface
export interface ComponentNameProps {
  requiredProp: string;
  optionalProp?: number;
  onAction: (data: SomeType) => void;
}

// Main component
export function ComponentName({
  requiredProp,
  optionalProp = 42,
  onAction,
}: ComponentNameProps) {
  // Hooks
  const [localState, setLocalState] = useState<string>('');
  const { data, loading, error } = useCustomHook();

  // Event handlers
  const handleClick = () => {
    onAction({ ... });
  };

  // Render conditions
  if (loading) return <Spinner />;
  if (error) return <Alert status="error">{error.message}</Alert>;

  // Main render
  return (
    <Box>
      <VStack spacing={4}>
        {/* Component content */}
      </VStack>
    </Box>
  );
}
```

#### 4. Component Composition Rules

**Bottom-Up Composition:**
```
Atoms → Molecules → Organisms → Templates → Pages
```

**Import Direction Rules:**
- Atoms can only import from external libraries (Chakra UI)
- Molecules can import atoms and other molecules
- Organisms can import atoms, molecules, and other organisms
- Templates can import anything except pages
- Pages can import everything

**Anti-Pattern (Don't Do This):**
```tsx
// ❌ Bad: Atom importing from organism
import { TransactionForm } from '../../organisms';

// ❌ Bad: Molecule with business logic and hooks
function SearchBar() {
  const { accounts } = useAccounts();  // Too complex for molecule
  const [filters, setFilters] = useState(...);
  // 150 lines of logic
}
```

**Good Pattern:**
```tsx
// ✅ Good: Clear hierarchy
import { Button, Input } from '@chakra-ui/react';  // Atoms
import { Pagination } from '../molecules';  // Molecule
import { TransactionFilter } from '../organisms';  // Organism
```

### Refactoring Large Components

**When to Refactor:**
- Component exceeds 300 lines
- Multiple responsibilities (violates Single Responsibility Principle)
- Difficult to test or reuse
- Nested organisms within organisms more than 2 levels deep

**Refactoring Strategy for `AccountsPage.tsx` (802 lines):**

```tsx
// Before: Monolithic page
export function AccountsPage() {
  // 802 lines of accounts, transactions, filters, modals
}

// After: Decomposed into organisms
export function AccountsPage() {
  return (
    <Layout>
      <AccountList />  {/* Organism: 200 lines */}
      <TransactionList />  {/* Organism: 300 lines */}
      <AccountManagementModals />  {/* Organism: 200 lines */}
    </Layout>
  );
}
```

## Project Architecture

### Monorepo Structure

```
/
├── packages/
│   ├── client/          # Frontend React application
│   │   ├── src/
│   │   │   ├── api/                 # API client modules
│   │   │   ├── components/          # Atomic design components
│   │   │   │   ├── molecules/
│   │   │   │   ├── organisms/
│   │   │   │   └── templates/
│   │   │   ├── contexts/            # React Context providers
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── pages/               # Page components
│   │   │   ├── theme/               # Chakra UI theme
│   │   │   ├── App.tsx              # Route configuration
│   │   │   └── main.tsx             # Entry point
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── server/          # Backend Express API
│   │   ├── src/
│   │   │   ├── config/              # Configuration
│   │   │   ├── db/                  # Database schema and connection
│   │   │   ├── middleware/          # Express middleware
│   │   │   ├── routes/              # API routes
│   │   │   ├── utils/               # Utility functions
│   │   │   ├── scripts/             # Maintenance scripts
│   │   │   └── index.ts             # Server entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/          # Shared TypeScript types
│       ├── src/
│       │   ├── auth.types.ts
│       │   ├── api.types.ts
│       │   ├── finance.types.ts
│       │   └── index.ts
│       └── package.json
│
├── package.json         # Root workspace configuration
└── README.md
```

### Data Flow

```
User Interaction
    ↓
Page Component
    ↓
Custom Hook (useAccounts, useTransactions, etc.)
    ↓
API Client (packages/client/src/api/*)
    ↓
HTTP Request (Axios)
    ↓
Express Route Handler (packages/server/src/routes/*)
    ↓
Drizzle ORM Query
    ↓
PostgreSQL Database
    ↓
Response flows back up the chain
```

### Custom Hooks Pattern

**Current Hooks (8):**
- `useAccountBooks` - Fetch and manage account books
- `useAccounts` - Fetch accounts for a specific book
- `useTransactions` - Fetch paginated, filtered transactions
- `useTransactionMetadata` - Fetch available months and date ranges
- `useCategorySuggestions` - Fetch category/subcategory suggestions
- `useRules` - Fetch category rules
- `useLocalStorage` - Persist state to localStorage
- `useAuth` - Access authentication context

**Hook Structure:**
```tsx
export function useAccounts(accountBookId?: number) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!accountBookId) return;

    setLoading(true);
    try {
      const response = await accountBooksApi.getAccounts(accountBookId);
      if (response.success && response.data) {
        setAccounts(response.data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [accountBookId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
}
```

**Hook Guidelines:**
- Return object with `{ data, loading, error, refetch }`
- Use `useCallback` for refetch functions
- Handle cleanup in `useEffect` return
- Type all return values with TypeScript
- Colocate related hooks in `/src/hooks/`

### State Management

**Current Approach:** React Context API + Custom Hooks

**Global State:**
- `AuthContext` - User authentication state, login/logout methods
- Accessed via `useAuth()` hook throughout the app

**Local State:**
- Component-level `useState` for UI state (modals, forms, filters)
- `useLocalStorage` for persisted preferences (selected account book)

**Server State:**
- Custom hooks with `useState` + `useEffect` for data fetching
- Manual cache invalidation via `refetch()` callbacks

**Future Considerations:**
- For complex state management, consider React Query or Zustand
- React Query provides automatic caching, refetching, and optimistic updates
- Zustand offers simpler global state without Context boilerplate

### API Client Architecture

**Location:** `packages/client/src/api/`

**Structure:**
```tsx
// api/client.ts - Axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

// api/accountBooks.ts - Domain-specific API
export const accountBooksApi = {
  getAccountBooks: () => apiClient.get<ApiResponse<AccountBook[]>>('/account-books'),
  createAccountBook: (data: CreateAccountBookDto) =>
    apiClient.post<ApiResponse<AccountBook>>('/account-books', data),
  // ... more methods
};

// api/index.ts - Exports
export * from './client';
export * from './accountBooks';
export * from './auth';
```

**Type Safety:**
- All API methods use `ApiResponse<T>` from `packages/shared`
- DTOs (Data Transfer Objects) defined in shared types
- Automatic type inference from API responses

### Database Schema

**Tables (5):**

1. **account_books** - Top-level container
   - `id`, `user_id`, `name`, `created_at`, `updated_at`

2. **accounts** - Financial accounts
   - `id`, `account_book_id`, `name`, `starting_balance`, `current_balance`
   - `balance_history` (JSONB) - 24-month balance tracking
   - `created_at`, `updated_at`

3. **transactions** - Individual transactions
   - `id`, `account_id`, `date`, `amount`, `type` (debit/credit)
   - `description`, `category`, `sub_category`
   - `created_at`, `updated_at`

4. **category_rules** - Auto-categorization rules
   - `id`, `account_book_id`, `keywords` (array)
   - `category`, `sub_category`
   - `created_at`, `updated_at`

5. **flow_budgets** - Budget definitions
   - `id`, `account_book_id`, `account_id`, `name`
   - `budget_type`, `fixed_amount`, `income_percent`
   - `created_at`, `updated_at`

**Cascade Behavior:**
- Deleting account book → deletes all accounts, transactions, rules, budgets
- Deleting account → deletes all transactions for that account

### Authentication Flow

```
1. User clicks "Login" → Redirects to Authentik OAuth
2. User authenticates → Authentik redirects to /auth/callback
3. Callback exchanges code for token → Creates session
4. Session stored in cookie → User redirected to dashboard
5. Protected routes check session → Backend validates cookie
6. Logout clears session → User redirected to login
```

**Implementation:**
- Backend: Session-based auth with `express-session`
- Frontend: `AuthContext` with `useAuth()` hook
- Protected Routes: `ProtectedRoute` component wrapper
- Session persistence: HTTP-only cookies

## Theme and Styling

### Custom Theme

**Location:** `packages/client/src/theme/index.ts`

**Color Palette:**
```tsx
colors: {
  teal: { 500: '#508C9B', 600: '#3a6573' },    // Primary
  cream: { 50: '#F6F4F0', 100: '#e8e6e1' },    // Background
  coral: { 500: '#FF6F61' },                    // Accent
  navy: { 700: '#1a2332', 800: '#0f1419' },    // Dark
  powder: { 100: '#D4E4E7', 200: '#b8d4d9' },  // Light accent
  rose: { 500: '#E07A5F' },                     // Secondary accent
}
```

**Default Mode:** Dark mode

**Component Overrides:**
- Card: Dark background with subtle borders
- Button: Primary uses teal, consistent sizing
- Input/Select: Dark theme with focus states

### Responsive Design

Chakra UI's responsive props:
```tsx
<Box
  width={{ base: '100%', md: '50%', lg: '33%' }}
  padding={{ base: 4, md: 6, lg: 8 }}
>
  {/* Content */}
</Box>
```

**Breakpoints:**
- `base`: 0px (mobile)
- `sm`: 480px
- `md`: 768px (tablet)
- `lg`: 992px (desktop)
- `xl`: 1280px
- `2xl`: 1536px

## Development Workflow

### Running the Application

```bash
# Install dependencies
npm install

# Start development servers (all packages)
npm run dev

# Start individual packages
npm run dev --workspace=packages/client
npm run dev --workspace=packages/server

# Build all packages
npm run build

# Run database migrations
npm run migrate --workspace=packages/server
```

### Adding a New Feature

**Example: Adding a "Transaction Categories" page**

1. **Create types** (if needed) in `packages/shared/src/finance.types.ts`
2. **Add API endpoints** in `packages/server/src/routes/`
3. **Create API client methods** in `packages/client/src/api/`
4. **Create custom hook** in `packages/client/src/hooks/useCategories.ts`
5. **Build organisms**:
   - `CategoryList.tsx` - Display categories
   - `AddCategoryModal.tsx` - Form to add category
6. **Create page** in `packages/client/src/pages/CategoriesPage/`
7. **Add route** in `packages/client/src/App.tsx`
8. **Update navigation** in `packages/client/src/components/organisms/Nav.tsx`

### Code Style

**TypeScript:**
- Strict mode enabled
- Explicit return types for functions
- No `any` types (use `unknown` if needed)
- Interface for props, type for unions/intersections

**React:**
- Functional components only
- Named exports (not default exports)
- Props destructuring in parameters
- Early returns for loading/error states

**Formatting:**
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in objects/arrays

## Key Features and Functionality

### 1. Multi-Book Accounting
- Create multiple account books for different financial contexts
- Each book maintains independent accounts, transactions, and rules
- Stored in localStorage for quick access

### 2. Account Management
- Create accounts with optional starting balance
- Track current balance (calculated from transactions)
- 24-month balance history stored as JSONB
- Visual balance charts on dashboard

### 3. Transaction Management
- Manual entry (debit/credit double-entry accounting)
- QIF file import (Quicken Interchange Format)
- Pagination (10/20/50/100 per page)
- Filtering by date (all/month/date range) and category
- Bulk deletion by month
- Edit and delete individual transactions

### 4. Category Rules
- Keyword-based auto-categorization
- Apply rules retroactively to all transactions
- Multiple keywords per rule (OR logic)
- Category and subcategory support

### 5. Data Visualization
- 6-month sparkline charts per account
- 24-month detailed balance chart (account selector)
- Monthly debit/credit bar charts
- Recent transactions list per account

### 6. Budget Management
- Flow-based budgets with income linkage
- Fixed amount or percentage-based rules
- Budget tracking and allocation

### 7. Financial Reports
- Multi-account selection
- Category filtering
- Date range filtering
- Debit/Credit/Combined view toggle
- Monthly breakdown charts

## Performance Considerations

### Optimization Strategies

1. **Pagination:** All transaction lists use server-side pagination
2. **Lazy Loading:** Pages loaded on-demand via React Router
3. **Memoization:** Consider `useMemo` for expensive calculations
4. **Code Splitting:** Vite automatically splits routes
5. **Database Indexing:** Foreign keys indexed for fast joins

### Known Performance Bottlenecks

- `AccountsPage` (802 lines) - Consider splitting into multiple components
- Balance recalculation - O(n) where n = number of transactions
- Transaction filtering - Done server-side, but could use database indexes

## Security

### Authentication
- OAuth2/OIDC via Authentik
- Session-based with HTTP-only cookies
- CSRF protection via cookie settings
- Automatic session expiration

### Authorization
- Backend middleware checks session on every request
- Frontend `ProtectedRoute` prevents unauthorized access
- User isolation via `user_id` in database queries

### Data Validation
- TypeScript types on frontend and backend
- Drizzle ORM prevents SQL injection
- Input sanitization on file uploads

## Testing Strategy

### Recommended Approach

**Unit Tests:**
- Test custom hooks with `@testing-library/react-hooks`
- Test utility functions (`qifParser`, `applyRules`, `updateAccountBalance`)
- Test API client methods with mocked Axios

**Integration Tests:**
- Test API routes with Supertest
- Test database operations with test database
- Test authentication flow end-to-end

**Component Tests:**
- Test organisms with `@testing-library/react`
- Test form submissions and validations
- Test loading and error states

**E2E Tests:**
- Playwright or Cypress for critical user flows
- Login → Create account book → Add transaction → View dashboard

## Common Patterns and Conventions

### Modal Pattern

```tsx
function ParentPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { refetch } = useAccounts();

  const handleSuccess = () => {
    refetch();  // Refresh data
    onClose();  // Close modal
  };

  return (
    <>
      <Button onClick={onOpen}>Add Account</Button>
      <AddAccountModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

### Toast Notification Pattern

```tsx
import { useToast } from '@chakra-ui/react';

function MyComponent() {
  const toast = useToast();

  const handleAction = async () => {
    try {
      await apiCall();
      toast({
        title: 'Success',
        description: 'Action completed successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };
}
```

### Filter State Pattern

```tsx
function FilterablePage() {
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { transactions, loading, refetch } = useTransactions({
    accountBookId,
    dateFilter,
    selectedMonth,
    startDate,
    endDate,
    categoryFilter,
    page,
    pageSize,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [dateFilter, categoryFilter]);
}
```

## Deployment

### Environment Variables

**Client (`.env`):**
```
VITE_API_URL=http://localhost:3001
```

**Server (`.env`):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/finances
SESSION_SECRET=your-secret-key
AUTHENTIK_CLIENT_ID=your-client-id
AUTHENTIK_CLIENT_SECRET=your-client-secret
AUTHENTIK_ISSUER=https://auth.example.com
AUTHENTIK_REDIRECT_URI=http://localhost:5173/auth/callback
NODE_ENV=production
```

### Docker Support

Each package includes Dockerfile for containerization:
- `packages/client/Dockerfile` - Nginx serving built React app
- `packages/server/Dockerfile` - Node.js API server
- `docker-compose.yml` - Orchestrate all services

### Build and Deploy

```bash
# Build all packages
npm run build

# Build Docker images
docker-compose build

# Run in production
docker-compose up -d
```

## Troubleshooting

### Common Issues

**Issue:** Transactions not appearing after import
- **Solution:** Check QIF file format, ensure account is selected, refetch data

**Issue:** Balance calculations incorrect
- **Solution:** Run balance recalculation script: `npm run recalculate-balances --workspace=packages/server`

**Issue:** Authentication loop
- **Solution:** Clear cookies, check Authentik configuration, verify redirect URI

**Issue:** Charts not rendering
- **Solution:** Check for missing data, verify account has transactions, check console for Nivo errors

## Future Enhancements

### Atomic Design Improvements
- Create dedicated `components/atoms/` directory for custom atoms
- Extract more molecules from existing organisms
- Refactor `AccountsPage` into smaller organisms
- Create additional templates for common layouts

### Feature Additions
- Split transactions across multiple categories
- Recurring transaction templates
- Investment account tracking
- Multi-currency support
- Expense categorization insights
- Budget vs. actual comparisons
- Export to CSV/Excel
- Mobile-responsive improvements

### Technical Improvements
- Add React Query for better server state management
- Implement unit and integration tests
- Add Storybook for component documentation
- Database query optimization with indexes
- WebSocket support for real-time updates
- PWA support for offline functionality

## Resources

### Documentation
- [React](https://react.dev/)
- [Chakra UI](https://chakra-ui.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)

### Tools
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Nivo Charts](https://nivo.rocks/)

---

**Last Updated:** 2026-02-09
**Version:** 1.0.0
**Maintainer:** Development Team
