# Date Utils Consolidation

This directory contains the consolidated date and time utility functions for the entire Tilavarauspalvelu application.

## Overview

Previously, date utility functions were scattered across multiple files:
- `apps/admin-ui/src/helpers/date.ts` - Admin-specific helpers
- `apps/admin-ui/src/common/util.ts` - Admin utilities with i18n
- `apps/ui/modules/util.ts` - UI utilities with different i18n approach
- `packages/common/src/common/util.ts` - Shared utilities (partial)

This consolidation provides:
✅ **Single source of truth** for date operations
✅ **Consistent error handling** across all functions  
✅ **Better TypeScript support** with proper types
✅ **Unified i18n approach** for formatting functions
✅ **Comprehensive documentation** with examples
✅ **Backwards compatibility** through re-exports

## Architecture

```
date-utils/
├── index.ts          # Main exports and documentation
├── conversion.ts     # API/UI date format conversion
├── construction.ts   # DateTime construction helpers
├── formatting.ts     # Display formatting with i18n
├── types.ts         # Shared TypeScript types
└── README.md        # This documentation
```

## Quick Start

```typescript
import {
  // Basic conversions
  toApiDate, fromApiDate,
  toUIDate, fromUIDate,
  
  // Input helpers
  dateForInput, timeForInput,
  
  // DateTime construction
  fromUIDateTime, fromApiDateTime,
  
  // Display formatting
  formatDateTime, formatDateTimeRange, formatDateRange
} from "common/src/date-utils";

// Convert between formats
const date = new Date("2023-12-25T15:30:00");
const apiString = toApiDate(date);        // "2023-12-25"
const uiString = toUIDate(date);          // "25.12.2023"

// Prepare for form inputs
const dateInput = dateForInput(date);     // "25.12.2023"
const timeInput = timeForInput(date);     // "15:30"

// Combine date and time
const combined = fromUIDateTime("25.12.2023", "15:30");  // Date object

// Format for display
const formatted = formatDateTime(t, date);  // "ma 25.12.2023 klo 15:30"
```

## Migration Status

### ✅ Completed Migrations
- `apps/admin-ui/src/helpers/date.ts` - Updated to use consolidated functions
- `apps/admin-ui/src/common/util.ts` - Added fallbacks to new functions
- `packages/common/src/common/util.ts` - Re-exports new functions

### 🔄 Remaining Migrations
The following files still use old implementations and should be gradually migrated:
- Files importing from `apps/admin-ui/src/common/util.ts`
- Files importing from `apps/ui/modules/util.ts`
- Direct usage of scattered date functions

### 📚 Migration Guide
See the detailed migration guide in `index.ts` for function-by-function mappings.

## Testing

The consolidation maintains backwards compatibility through:
1. **Re-exports** in existing util files
2. **Fallback implementations** for deprecated functions
3. **TypeScript compatibility** with existing code

To verify the migration:
```bash
pnpm tsc:check  # Ensure TypeScript compilation passes
pnpm lint       # Verify code quality
```

## Benefits Achieved

1. **Reduced Code Duplication**: ~30+ scattered functions → 8-10 essential functions
2. **Consistent Behavior**: All functions use same error handling patterns
3. **Better Developer Experience**: Clear documentation and examples
4. **Improved Maintainability**: Single location for date logic updates
5. **TypeScript Safety**: Better type definitions and null handling

## Future Improvements

- [ ] Add comprehensive unit tests
- [ ] Migrate remaining usage sites to direct imports
- [ ] Remove deprecated functions after full migration
- [ ] Add performance benchmarks for critical paths
- [ ] Consider locale-specific formatting options