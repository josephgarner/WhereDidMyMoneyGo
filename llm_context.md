# Finances Application - LLM Context Document

## Project Overview

A full-stack financial management application built as a monorepo with React frontend and Node.js backend. The application allows users to manage account books, accounts, and transactions with features for importing QIF files, visualizing balance trends, and comprehensive transaction management.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Chakra UI
- **Routing**: React Router v6
- **Charts**: Nivo (@nivo/line, @nivo/core)
- **Icons**: react-icons/fa6
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **File Uploads**: Multer
- **Authentication**: Authentik (OAuth)

### Project Structure
```
Finances/
├── packages/
│   ├── client/          # React frontend
│   ├── server/          # Express backend
│   └── shared/          # Shared TypeScript types
```

## Database Schema

### Tables

**account_books**
- `id` (uuid, primary key)
- `name` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**accounts**
- `id` (uuid, primary key)
- `name` (text)
- `account_book_id` (uuid, foreign key → account_books)
- `total_monthly_balance` (decimal)
- `total_monthly_debits` (decimal)
- `total_monthly_credits` (decimal)
- `historical_balance` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**transactions**
- `id` (uuid, primary key)
- `account_id` (uuid, foreign key → accounts, cascade delete)
- `account_book_id` (uuid, foreign key → account_books, cascade delete)
- `transaction_date` (timestamp)
- `description` (text)
- `category` (text)
- `sub_category` (text)
- `debit_amount` (decimal)
- `credit_amount` (decimal)
- `linked_transaction_id` (uuid, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**category_rules**
- `id` (uuid, primary key)
- `account_book_id` (uuid, foreign key)
- `keyword` (text)
- `category` (text)
- `sub_category` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Note**: Accounts and transactions use cascade delete - deleting an account removes all its transactions.

## Application Architecture

### Frontend Structure (Atomic Design)

```
packages/client/src/
├── components/
│   ├── atoms/           # Basic UI elements
│   ├── molecules/       # Pagination, etc.
│   ├── organisms/       # Complex components
│   │   ├── Nav.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── AddAccountForm.tsx
│   │   ├── AddTransactionForm.tsx
│   │   ├── UploadQIFForm.tsx
│   │   └── TransactionDateFilter.tsx
│   └── templates/       # Page layouts
├── pages/
│   ├── HomePage/
│   ├── DashboardPage/
│   └── AccountsPage/
├── hooks/
│   ├── useAccountBooks.ts
│   ├── useAccounts.ts
│   ├── useTransactions.ts
│   ├── useTransactionMetadata.ts
│   └── useCategorySuggestions.ts
├── api/
│   ├── client.ts
│   └── accountBooks.ts
└── contexts/
    └── AuthContext.tsx
```

### Backend Structure

```
packages/server/src/
├── routes/
│   ├── accountBooks.routes.ts
│   ├── accounts.routes.ts
│   └── auth.routes.ts
├── middleware/
│   └── auth.middleware.ts
├── utils/
│   ├── qifParser.ts
│   └── accountBalances.ts
├── db/
│   ├── schema.ts
│   └── index.ts
└── config/
    ├── env.ts
    └── authentik.ts
```

## Features Implemented

### 1. Navigation & Routing

**Routes Structure**:
- `/` - Home page (redirects to first account book's dashboard)
- `/account-books/:accountBookId/dashboard` - Dashboard with charts and recent transactions
- `/account-books/:accountBookId/accounts` - Account management and transaction list

**Navigation Component**: `packages/client/src/components/organisms/Nav.tsx`
- Context-aware navigation (shows Dashboard/Accounts only when inside an account book)
- Logout functionality

### 2. Dashboard Page

**File**: `packages/client/src/pages/DashboardPage/DashboardPage.tsx`

**Features**:
- **Balance Charts**: Compact sparkline charts (100px height, max 150px width) for each account
  - Shows 6-month balance trend
  - Smooth monotoneX curve
  - No axis labels, just heading and line
  - Teal color (#4FD1C5)
  - 6 charts per row on large screens, 4 on medium, 2 on mobile
  - Hover tooltip shows exact balance

- **Recent Transactions**: 5 most recent transactions per account
  - Two-column grid layout
  - Shows date, description, category badge, and amount
  - Color-coded amounts (green for credits, coral for debits)

**Backend Endpoint**: GET `/api/account-books/:id/dashboard-data`
- Calculates running balance for last 6 months
- Returns historical balance data and recent transactions

### 3. Accounts Page

**File**: `packages/client/src/pages/AccountsPage/AccountsPage.tsx`

**Layout**:
- Left sidebar: Account list with balances
- Right side: Transaction management tools and transaction table

**Features**:

#### Account Management
- **Add Account**: Collapsible form at top of sidebar
  - Account name (required)
  - Starting balance (optional)
  - Creates "Opening Balance" transaction if balance provided

- **Delete Account**: Red trash icon in account card
  - Confirmation dialog
  - Cascade deletes all transactions
  - Updates UI after deletion

#### Transaction Management
- **Add Transaction**: Manual entry form
  - Fields: transaction date, description, category, subcategory, debit, credit
  - Category/subcategory autocomplete with HTML5 datalist
  - Shows existing values while allowing new entries

- **Upload QIF File**: Import transactions from Quicken files
  - Accepts .qif files up to 10MB
  - Parses multiple date formats
  - Shows import statistics (imported, failed, parse errors)
  - Handles category:subcategory format

- **Delete Transaction**: Trash icon in each transaction row
  - Confirmation dialog
  - Updates account balance automatically

- **Delete by Month**: Button appears when month filter is active
  - Bulk deletes all transactions for selected month
  - Shows count of deleted transactions
  - Updates account balance

#### Transaction Display
- **Filtering**: By all time, specific month, or date range
  - Only shows months/dates with actual data

- **Pagination**: Server-side pagination
  - Default 20 transactions per page
  - Configurable page size (10, 20, 50, 100)
  - Shows "X to Y of Z transactions"

- **Table Columns**:
  - Date
  - Description (max 250px, wraps with ellipsis)
  - Category (with subcategory badge)
  - Debit (coral color)
  - Credit (powder blue color)
  - Delete button

- **Loading States**: Overlay loader prevents flashing during pagination

### 4. QIF File Parser

**File**: `packages/server/src/utils/qifParser.ts`

**Supported QIF Codes**:
- `D` - Date (MM/DD/YYYY, MM/DD/YY, etc.)
- `T` - Amount (negative = debit, positive = credit)
- `P` - Payee/Description
- `M` - Memo
- `L` - Category (format: "Category:SubCategory")
- `N` - Number (check number, ignored)
- `C` - Cleared status (ignored)
- `^` - End of transaction marker

**Features**:
- Handles 2-digit and 4-digit years
- Parses category/subcategory splits
- Validates required fields
- Collects parse errors without failing entire import
- Converts amounts to debit/credit format

### 5. Account Balance Management

**File**: `packages/server/src/utils/accountBalances.ts`

**Function**: `updateAccountBalance(accountId)`
- Calculates totals from all transactions
- Formula: `balance = total_credits - total_debits`
- Automatically called after:
  - Creating a transaction
  - Deleting a transaction
  - Importing QIF file
  - Creating account with starting balance
  - Bulk deleting transactions by month

**Problem Solved**: Account balances now update in real-time in the UI when transactions are added/deleted.

## API Endpoints

### Account Books

#### GET `/api/account-books`
- Returns all account books for authenticated user

#### GET `/api/account-books/:id/accounts`
- Returns all accounts for a specific account book

#### POST `/api/account-books/:id/accounts`
- Creates new account
- Body: `{ name: string, startingBalance?: string }`
- Creates opening balance transaction if balance provided

#### DELETE `/api/account-books/:id/accounts/:accountId`
- Deletes account and all its transactions (cascade)

#### GET `/api/account-books/:id/dashboard-data`
- Returns historical balance data (6 months) and recent transactions (5 per account)

### Accounts & Transactions

#### GET `/api/accounts/:accountId/transactions`
- Paginated transactions with filtering
- Query params: `month`, `startDate`, `endDate`, `page`, `limit`
- Returns transactions and pagination metadata

#### GET `/api/accounts/:accountId/transactions/metadata`
- Returns min/max dates and available months

#### GET `/api/accounts/:accountId/categories`
- Returns distinct categories and subcategories for autocomplete

#### POST `/api/accounts/:accountId/transactions`
- Creates new transaction
- Body: `{ transactionDate, description, category, subCategory?, debitAmount?, creditAmount? }`
- Updates account balance

#### DELETE `/api/accounts/:accountId/transactions/:transactionId`
- Deletes single transaction
- Updates account balance

#### DELETE `/api/accounts/:accountId/transactions/bulk/by-month?month=YYYY-MM`
- Bulk deletes all transactions for specified month
- Returns count of deleted transactions
- Updates account balance

#### POST `/api/accounts/:accountId/transactions/upload-qif`
- Uploads and imports QIF file
- Multipart form data with `qifFile` field
- Returns import statistics and any errors

## Key React Hooks

### useAccounts
**File**: `packages/client/src/hooks/useAccounts.ts`
```typescript
const { accounts, loading, error, refetch } = useAccounts(accountBookId);
```
- Fetches accounts for an account book
- Returns refetch function for manual refresh

### useTransactions
**File**: `packages/client/src/hooks/useTransactions.ts`
```typescript
const { transactions, pagination, loading, error, refetch } = useTransactions(accountId, filters);
```
- Fetches paginated transactions
- Accepts filter object for date filtering
- Returns refetch function

### useTransactionMetadata
**File**: `packages/client/src/hooks/useTransactionMetadata.ts`
```typescript
const { metadata } = useTransactionMetadata(accountId);
```
- Returns: `{ minDate, maxDate, availableMonths }`
- Used for populating date filter options

### useCategorySuggestions
**File**: `packages/client/src/hooks/useCategorySuggestions.ts`
```typescript
const { suggestions, loading, error } = useCategorySuggestions(accountId);
```
- Returns: `{ categories: string[], subCategories: string[] }`
- Used for category autocomplete

## Component Details

### AddAccountForm
**File**: `packages/client/src/components/organisms/AddAccountForm.tsx`
- Collapsible form with +/- toggle
- Fields: name (required), starting balance (optional)
- Creates account with initial transaction if balance provided
- Toast notifications for success/error
- Auto-refreshes account list

### AddTransactionForm
**File**: `packages/client/src/components/organisms/AddTransactionForm.tsx`
- Collapsible form
- HTML5 datalist for category/subcategory autocomplete
- Validation: requires description, category, and at least one amount
- Auto-refreshes transactions and accounts after creation

### UploadQIFForm
**File**: `packages/client/src/components/organisms/UploadQIFForm.tsx`
- File input with .qif validation
- Shows selected file name and size
- Displays import statistics in toast
- Shows detailed errors if parsing fails
- Auto-refreshes after successful import

### TransactionDateFilter
**File**: `packages/client/src/components/organisms/TransactionDateFilter.tsx`
- Three modes: All, Month, Date Range
- Month dropdown shows only available months (sorted newest first)
- Date inputs restricted to min/max dates with actual data
- Dark theme styling for dropdown options

### Pagination
**File**: `packages/client/src/components/molecules/Pagination.tsx`
- Smart ellipsis for large page counts
- Page size selector
- Shows "Showing X to Y of Z transactions"

## Theme Colors

### Custom Chakra Theme
```javascript
{
  navy: {
    700: '#2d3748',
    800: '#1a2332',
    900: '#0f1419'
  },
  cream: {
    100: '#f5f3e7',
    200: '#e8e6d9',
    300: '#c9c4b5',
    400: '#a8a599',
    500: '#87836f'
  },
  teal: {
    300: '#4FD1C5',
    500: '#38B2AC',
    600: '#319795',
    700: '#2C7A7B',
    900: '#234E52'
  },
  coral: {
    400: '#FC8181',
    500: '#F56565'
  },
  powder: {
    400: '#90CDF4'
  }
}
```

## Important Technical Decisions

### 1. Balance Calculation
- **Source of Truth**: Transactions table
- **Calculation**: Credits - Debits
- **Update Triggers**: All transaction CRUD operations
- **Implementation**: Centralized in `updateAccountBalance()` utility

### 2. Transaction Import
- **Format**: QIF (Quicken Interchange Format)
- **Parsing**: Custom parser handles various date formats
- **Error Handling**: Collects all errors but imports valid transactions
- **Balance Update**: Single update after all transactions imported

### 3. Date Filtering
- **Metadata-Driven**: Only show months/dates with actual data
- **Month Format**: YYYY-MM
- **Date Range**: Inclusive start and end dates
- **Backend Filtering**: SQL-based for performance

### 4. Pagination
- **Server-Side**: Reduces data transfer
- **Default Size**: 20 transactions
- **Overlay Loading**: Prevents UI flash during page changes
- **Reset on Filter**: Returns to page 1 when filters change

### 5. Delete Operations
- **Confirmation Required**: All deletes require user confirmation
- **Cascade Deletes**: Account deletion removes all transactions
- **Balance Updates**: Automatic recalculation after deletion
- **UI Updates**: Automatic refresh of affected data

### 6. UI/UX Patterns
- **Atomic Design**: Components organized by complexity
- **Collapsible Forms**: Minimize screen space usage
- **Toast Notifications**: User feedback for all operations
- **Loading States**: Overlay loaders and spinners
- **Dark Theme**: Consistent navy/cream color scheme

## Known Issues & Solutions

### Issue: Account balances not updating in UI
**Solution**: Added `refetchAccounts()` call in `handleTransactionAdded()`
- Problem was transactions refreshed but accounts didn't
- Now both lists refresh after transaction operations

### Issue: Month dropdown white background
**Solution**: Added inline styles and `sx` prop for browser compatibility
```jsx
<Select sx={{ option: { bg: 'navy.900', color: 'cream.100' } }}>
  <option style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}>
```

### Issue: TypeScript errors with null accountId
**Solution**: Used non-null assertion (`accountBookId!`) in checked contexts
- Only used after explicit null checks in useEffect guards

### Issue: Flashing during pagination
**Solution**: Implemented overlay loader instead of content replacement
```jsx
{transactionsLoading && (
  <Box position="absolute" /* overlay styles */>
    <Spinner />
  </Box>
)}
```

## File Upload Configuration

### Multer Settings
```javascript
{
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: /* .qif files only */
}
```

## Security Considerations

1. **Authentication**: All routes protected with `requireAuth` middleware
2. **Ownership Verification**: All operations verify resource belongs to user
3. **Input Validation**: Required field checks on backend
4. **File Upload**: Limited to 10MB, .qif extension only
5. **SQL Injection**: Prevented by Drizzle ORM parameterized queries
6. **XSS Prevention**: React escapes content by default

## Development Commands

```bash
# Install dependencies
npm install

# Build shared types
cd packages/shared && npm run build

# Build server
cd packages/server && npm run build

# Build client
cd packages/client && npm run build

# Run development server
cd packages/server && npm run dev

# Run development client
cd packages/client && npm run dev
```

## Environment Variables

### Server (.env)
```
DATABASE_URL=postgresql://...
AUTHENTIK_CLIENT_ID=...
AUTHENTIK_CLIENT_SECRET=...
AUTHENTIK_ISSUER=...
```

## Future Considerations

### Potential Enhancements
1. Transaction search/filtering by description or category
2. Export transactions to QIF/CSV
3. Recurring transaction templates
4. Budget tracking
5. Multi-currency support
6. Transaction attachments (receipts)
7. Account reconciliation
8. Custom category hierarchies
9. Transaction splitting
10. Reports and analytics

### Performance Optimizations
1. Transaction virtualization for large datasets
2. Debounced search inputs
3. Cached dashboard calculations
4. Indexed database queries
5. Optimistic UI updates

## Git Status (at session start)
```
Current branch: main
Modified:
  - packages/client/src/App.tsx
  - packages/client/src/components/Nav.tsx
  - packages/client/src/pages/HomePage.tsx
Untracked:
  - packages/client/src/pages/AccountBookPage.tsx

Recent commits:
  - Added database connection
  - Updated theme
  - Fixed auth
  - Setup
```

## Testing Artifacts

### Sample QIF File
Created at: `test-transactions.qif`
```
!Type:Bank
D01/15/2024
T-150.50
PGrocery Store
LFood:Groceries
^
D01/16/2024
T-45.00
PGas Station
LTransportation:Fuel
^
[... more transactions ...]
```

## Session Summary

This session involved building out a comprehensive financial management application with:
- Complete CRUD operations for accounts and transactions
- QIF file import functionality
- Dashboard with visualizations
- Advanced filtering and pagination
- Delete operations with confirmations
- Real-time balance calculations
- Responsive UI with dark theme
- Proper error handling and user feedback

All code follows TypeScript best practices, React hooks patterns, and atomic design methodology. The application is production-ready with proper authentication, validation, and security measures.
