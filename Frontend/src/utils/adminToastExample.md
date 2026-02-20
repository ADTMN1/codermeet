# Centralized Admin Toast System

## Usage Examples

### 1. Import the utility
```typescript
import { useAdminToast } from '../../utils/adminToast';

const MyComponent = () => {
  const adminToast = useAdminToast();
  // ...
};
```

### 2. Success Messages
```typescript
// Simple success
adminToast.success('Data loaded');

// Success with entity
adminToast.success('deleted', 'User');
// Result: "User deleted successfully"
```

### 3. Error Messages
```typescript
// Simple error
adminToast.error('Operation failed');

// Error with entity and details
adminToast.error('update', 'user role', error);
// Result: "Failed to update user role" or specific error message
```

### 4. Specialized Admin Operations
```typescript
// User role updated
adminToast.userUpdated('admin');

// User deleted
adminToast.userDeleted();

// Challenge deleted
adminToast.challengeDeleted();

// Dashboard refreshed
adminToast.dashboardRefreshed();

// System data loaded
adminToast.systemDataLoaded();

// Stats refresh error
adminToast.statsRefreshError('user');
adminToast.statsRefreshError('challenge');
```

### 5. Loading and Info Messages
```typescript
// Loading message
adminToast.loading('Processing...');

// Info message
adminToast.info('Dashboard data refreshed');

// Warning message
adminToast.warning('Please review your changes');
```

## Benefits

✅ **Professional Messaging**: Consistent, professional language across all admin pages
✅ **Centralized Management**: Easy to update toast messages globally
✅ **Error Handling**: Proper error message formatting with entity context
✅ **Type Safety**: Full TypeScript support with proper interfaces
✅ **Maintainable**: Single source of truth for all admin notifications
