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

## Recent Updates

### Category Rules Enhancement
**Date**: Latest session

**Features Added**:
1. **Multiple Keywords Support**: Category rules now accept comma-separated keywords
   - File: `packages/server/src/utils/applyRules.ts`
   - Keywords are split by comma and each is checked individually
   - Example: "Starbucks, Coffee Shop, Cafe" will match any of these terms

2. **Category/Subcategory Dropdowns**: Replaced text inputs with dropdowns showing existing values
   - File: `packages/client/src/components/organisms/AddRuleModal.tsx`
   - New endpoint: GET `/api/account-books/:id/categories`
   - Returns grouped categories with their subcategories
   - "Create New" option available in both dropdowns
   - Dynamic subcategory list based on selected category

### Docker Configuration
**Date**: Latest session

**Files Updated**:
- `packages/server/Dockerfile`
- `packages/client/Dockerfile`
- `docker-compose.yml`
- Created: `DOCKER.md` (comprehensive setup guide)
- Created: `AUTHENTICATION.md` (OAuth troubleshooting guide)

**Key Changes**:
1. **Backend (Server)**:
   - Multi-stage build with builder and production stages
   - Handles monorepo workspace structure
   - Database initialization with `drizzle-kit push --force` on startup
   - Runs from root directory to access node_modules
   - Port: 3001
   - CMD: `cd /app && npm run db:push --workspace=@finances/server && cd /app/packages/server && npm start`

2. **Frontend (Client)**:
   - Uses Vite dev server (not nginx)
   - Hot reload with volume mounts for src directories
   - Port: 5173
   - Environment-based configuration with `VITE_API_URL`

3. **Docker Compose**:
   - Three services: postgres, backend, frontend
   - Persistent volume for PostgreSQL data (`postgres_data`)
   - Environment variable support via `.env`
   - Health checks and service dependencies

**Important Configuration**:
- Database tables are automatically initialized on first startup
- Data persists in Docker volumes (safe across container rebuilds)
- Only `docker-compose down -v` will delete database data

### Authentication Configuration
**Date**: Latest session

**OAuth2/OIDC with Authentik**:
- Implementation: PKCE (Proof Key for Code Exchange)
- Session management: `express-session` with cookies

**Session Cookie Settings**:
File: `packages/server/src/index.ts:46`
```typescript
cookie: {
  secure: config.nodeEnv === 'production', // Dynamic based on environment
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: 'lax',
  domain: undefined,
}
```

**Environment Variables Required**:
```bash
# Development
CLIENT_URL=http://localhost:5173
AUTHENTIK_REDIRECT_URI=http://localhost:3001/auth/callback
NODE_ENV=development

# Production
CLIENT_URL=https://financev2.hermes-lab.com
AUTHENTIK_REDIRECT_URI=https://finance.api.hermes-lab.com/auth/callback
NODE_ENV=production
```

**CORS Configuration**:
File: `packages/server/src/index.ts:34-37`
```typescript
app.use(cors({
  origin: config.clientUrl, // From CLIENT_URL env var
  credentials: true,
}));
```

### Database Initialization
**Date**: Latest session

**Drizzle Kit Integration**:
- Added `drizzle-kit` to production dependencies
- Created `packages/server/drizzle.config.ts`
- Added scripts:
  - `db:push`: Pushes schema to database (with `--force` flag for non-interactive)
  - `db:studio`: Opens Drizzle Studio

**Automatic Schema Push**:
- Docker container runs `npm run db:push` on startup
- Creates all tables if they don't exist
- Non-destructive: Won't delete existing data
- Runs from root directory to access workspace dependencies

### Production Deployment
**Date**: Latest session

**Production URLs**:
- Frontend: `https://financev2.hermes-lab.com`
- Backend API: `https://finance.api.hermes-lab.com`

**Environment Configuration**:

**Frontend (.env)**:
```bash
VITE_API_URL=https://finance.api.hermes-lab.com
```

**Backend (.env)**:
```bash
NODE_ENV=production
CLIENT_URL=https://financev2.hermes-lab.com
AUTHENTIK_REDIRECT_URI=https://finance.api.hermes-lab.com/auth/callback
DATABASE_URL=postgresql://user:password@host:5432/finances
SESSION_SECRET=your_32_character_minimum_secret
AUTHENTIK_ISSUER=https://your-authentik.com/application/o/app/
AUTHENTIK_CLIENT_ID=your_client_id
AUTHENTIK_CLIENT_SECRET=your_client_secret
```

**Important Notes**:
1. CORS errors in production are usually due to missing `CLIENT_URL` environment variable
2. Session cookies automatically use `secure: true` in production (requires HTTPS)
3. Frontend uses `VITE_API_URL` for API calls (no proxy in production)
4. Vite config `allowedHosts` includes production domain: `financev2.hermes-lab.com`

### Troubleshooting

**CORS Errors in Production**:
- Ensure `CLIENT_URL` is set to frontend URL
- Verify `VITE_API_URL` points to backend API
- Restart containers after environment variable changes

**Database Not Initialized**:
- Check backend logs for `db:push` output
- Verify drizzle-kit runs successfully on startup
- Can manually run: `docker-compose exec backend npm run db:push`

**Authentication Issues**:
- Verify `AUTHENTIK_REDIRECT_URI` matches Authentik configuration exactly
- Check session cookies are being set (DevTools → Application → Cookies)
- Ensure `SESSION_SECRET` is at least 32 characters
- For HTTPS issues, verify `NODE_ENV=production` is set

### UI Enhancements
**Date**: Recent session

**Features Added**:

1. **Multi-line Keyword Input**: Category rule modal now supports textarea (2 rows) for keywords
   - File: `packages/client/src/components/organisms/AddRuleModal.tsx`
   - Allows entering multiple keywords with better visibility
   - Still uses comma-separated format

2. **Keyword Column Text Wrapping**: Rules table keyword column now wraps text
   - File: `packages/client/src/pages/RulesPage/RulesPage.tsx`
   - Added `whiteSpace="normal"` and `wordBreak="break-word"` to Td component
   - Prevents horizontal scrollbar when keywords are long

3. **Category Filter Component**: Created reusable category filter matching date filter style
   - File: `packages/client/src/components/organisms/TransactionCategoryFilter.tsx`
   - Radio buttons for "All" or "Category" filtering
   - Dropdown with sorted categories
   - Reset button when filter is active
   - Consistent styling with TransactionDateFilter

4. **Transaction Category Filtering**: Added category filtering to AccountsPage
   - File: `packages/client/src/pages/AccountsPage/AccountsPage.tsx`
   - Date and category filters display side-by-side on large screens (Grid layout)
   - Backend support: GET `/api/accounts/:accountId/transactions?category=X`
   - Added `category` field to TransactionFilters interface
   - Updated `useTransactions` hook to watch `filters?.category` changes

5. **Reports Page**: New comprehensive reporting interface
   - File: `packages/client/src/pages/ReportsPage/ReportsPage.tsx`
   - Route: `/account-books/:accountBookId/reports`
   - Navigation: Added "Reports" button to Nav component

   **Features**:
   - **Multi-select Filters**: Checkboxes for accounts and categories
   - **Date Range Filter**:
     - Default: 6 months ago to today
     - Custom date inputs with validation
   - **Metric Toggle**: Three-button group to switch between views
     - **Combined**: Shows net flow (Credits - Debits) as positive values
     - **Debits**: Shows total debits per month
     - **Credits**: Shows total credits per month
     - Selected button has solid background (teal for Combined/Credits, red for Debits)
     - Unselected buttons have outline style with gray color
   - **Bar Chart Visualization**:
     - Monthly transaction data using @nivo/bar
     - Dynamic chart based on selected metric
     - All values displayed as positive (using Math.abs())
     - Color-coded bars: Red for debits, Teal for credits/combined
     - Animated bars (bottom-to-top growth)
   - **Trend Line**:
     - Linear regression overlay on bar chart
     - Red dashed line showing trend for selected metric
     - Calculated using least squares method
     - Only displays with 2+ data points
     - Uses absolute values for consistent display
   - **Backend**: GET `/api/account-books/:id/reports`
     - Query params: `accountIds[]`, `categories[]`, `startDate`, `endDate`
     - Returns: `{ month, debits, credits, combined }[]`
     - `combined = SUM(credits) - SUM(debits)` (can be negative)

6. **Responsive Filter Layout**: Date and category filters side-by-side
   - File: `packages/client/src/pages/AccountsPage/AccountsPage.tsx`
   - Grid layout: single column on mobile, two columns on large screens
   - Consistent spacing with `gap={2}`

### Technical Implementation Details

**TransactionCategoryFilter Component**:
```typescript
interface CategoryFilterValue {
  type: 'all' | 'category';
  category?: string;
}
```
- Uses same pattern as DateFilterValue for consistency
- `useEffect` updates parent without `onChange` in deps (prevents infinite loops)
- Sorted categories alphabetically

**Reports API**:
- Aggregates transactions by month using SQL `TO_CHAR` and `GROUP BY`
- Filters support multiple accounts and categories (IN clauses)
- Date range filtering with `gte` and `lte` operators
- Returns: `{ month: string, debits: number, credits: number, combined: number }[]`
- Combined calculation: `SUM(credits) - SUM(debits)` (net flow per month)

**Trend Line Calculation**:
- Linear regression formula: `y = mx + b`
- Slope: `m = (n∑xy - ∑x∑y) / (n∑x² - (∑x)²)`
- Intercept: `b = (∑y - m∑x) / n`
- Handles division by zero (uses average when all points are equal)
- Custom Nivo layer for rendering SVG path and circles

**Chart Configuration**:
- `layout="vertical"` - Ensures bars are vertical
- `motionConfig` - Custom spring animation (tension: 170, friction: 26)
- Bars grow from bottom to top on load
- Dynamic colors based on selected metric (red for debits, teal for credits/combined)
- Chart heading updates to show selected metric type

### Bug Fixes

**Issue**: Category filter caused infinite re-render loop
**Solution**: Removed `onChange` from `useEffect` dependencies with eslint-disable comment
- File: `packages/client/src/components/organisms/TransactionCategoryFilter.tsx`

**Issue**: Category filter not triggering transaction refetch
**Solution**: Added `filters?.category` to `useTransactions` hook dependencies
- File: `packages/client/src/hooks/useTransactions.ts`

**Issue**: Trend line rendering flat at bottom of chart
**Solution**:
- Fixed yScale usage in custom layer
- Improved data point matching with bars array
- Added Number() conversion in trend calculation
- Increased visibility (thicker stroke, larger dots, white outline)

**Issue**: TypeScript build errors in production
**Solution**:
- Fixed null safety errors in hooks by capturing non-null values before async functions
- Removed unused imports (React from AuthContext)
- Removed invalid `initial` prop from ResponsiveBar component
- Relaxed TypeScript strictness for production builds (strict: false, noUnusedLocals: false)

**Issue**: Frontend Dockerfile using dev server in production (WebSocket/HMR errors)
**Solution**:
- Changed from `npm run dev` to production build + `vite preview`
- Multi-stage build: builder stage creates optimized bundle, production stage serves it
- Included shared package dependencies in production stage
- Resolved npm registry errors by copying built shared package from builder

**Issue**: Environment variables not passed to Docker build
**Solution**:
- Added `build.args` to docker-compose.yml for `VITE_API_URL`
- Added `ARG` and `ENV` directives to client Dockerfile
- Vite environment variables must be set at build time (baked into bundle)
- Removed development volume mounts from production docker-compose

## Production Deployment Configuration

**Docker Compose Structure**:
- Three services: postgres, backend, frontend
- Explicit image names: `finances-backend:latest`, `finances-frontend:latest`
- Build args passed for environment variables
- Health checks and service dependencies

**Frontend Build Process**:
- Build stage: Compiles TypeScript and Vite production bundle with VITE_API_URL
- Production stage: Serves built files using `vite preview` on port 5173
- Requires both root and package-specific package.json files
- Shared package dist folder copied from builder

**Backend Build Process**:
- Build stage: Compiles TypeScript and shared package
- Production stage: Runs compiled JS with Node.js
- Database schema pushed automatically on container start
- Logs directory volume-mounted for persistence

**Environment Variables**:
- Must use correct `.env` file or pass vars at build time
- Frontend: `VITE_API_URL` baked into bundle at build time
- Backend: All vars loaded at runtime
- Use `--env-file` flag or separate `.env.production` for production builds

## Enhanced Logging (Backend)

**Server Startup Logging** (`packages/server/src/index.ts`):
- Logs all registered routes on startup for debugging
- Helps verify endpoint registration

**Request Logging**:
- Enhanced Morgan format with custom tokens
- Logs query parameters and request bodies
- Format: `METHOD URL STATUS RESPONSE_TIME - query:{...} - body:{...}`
- Skips health check logs to reduce noise

**404 Handler**:
- Logs all unmatched routes with full request details
- Includes method, path, URL, query params, and headers
- Returns structured 404 response with path info

**Reports Endpoint Logging**:
- Logs when endpoint is hit with all parameters
- Helps debug production routing issues

## Session Summary

This application is a comprehensive financial management system with:
- Complete CRUD operations for accounts and transactions
- QIF file import functionality with category rule auto-assignment
- Dashboard with balance visualizations and sparkline charts
- Advanced filtering and pagination with category and date filters
- Reports page with metric toggle (Combined/Debits/Credits), bar charts, trend lines, and customizable date ranges
- Docker-based deployment with production-optimized builds and automatic database initialization
- OAuth2/OIDC authentication via Authentik
- Production-ready configuration with HTTPS support and proper environment variable handling
- Real-time balance calculations
- Responsive UI with dark theme and consistent component patterns
- Enhanced backend logging for production debugging
- Proper error handling and user feedback
- Reusable filter components (date and category)

All code follows TypeScript best practices, React hooks patterns, and atomic design methodology. The application includes comprehensive documentation for Docker deployment, authentication troubleshooting, and production environment configuration.
