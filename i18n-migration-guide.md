# I18n Migration Guide

## Overview

This guide explains the internationalization (i18n) implementation changes in the ProjectPulse application. The application has been migrated from using a dual i18n provider setup to a single, more consistent implementation.

## What Was Fixed

The application had two different i18n providers:
1. `I18nProvider` from `@/hooks/use-i18n.tsx` (original implementation)
2. `I18nProvider` from `@/hooks/use-i18n-new.tsx` (newer implementation)

These two providers were both being used simultaneously in the application:
- The outer provider in `main.tsx` was using `use-i18n.tsx`
- The inner provider in `App.tsx` was using `use-i18n-new.tsx`

This dual provider approach was causing:
- Inconsistent language displays (some components showing English, others showing Arabic)
- Conflicts in language toggling
- Direction (RTL) issues in some components

## Changes Made

The following changes were implemented:

1. **Removed the outer i18n provider**: The `I18nProvider` from `main.tsx` was removed to keep only the one in `App.tsx`.

2. **Updated component imports**: All components were updated to use the new `useI18n` hook:
   - Updated `stat-card.tsx` 
   - Updated `qatar-logo.tsx`
   - Updated `logo.tsx`
   - Updated `recent-projects.tsx`
   - Updated `recent-projects-new.tsx`
   - Updated `pending-approvals.tsx`
   - Updated `weekly-update-reminder.tsx`
   - Updated `report-template.tsx`
   - Updated `reports-page.tsx`
   - Updated `budget-page.tsx`
   - Updated `cost-page.tsx`
   - Updated `custom-analytics-page.tsx`
   - Updated `file-upload.tsx`
   - Updated `users-management-page.tsx`

3. **Created a version switcher script**: Added `version-switcher.sh` to help toggle between implementations for testing or comparison.

## Using the Version Switcher

To help test and compare the two implementations, you can use the version-switcher.sh script:

```bash
# To switch to the old i18n implementation (dual provider)
./version-switcher.sh old

# To switch to the new i18n implementation (single provider)
./version-switcher.sh new
```

After switching, restart your development server to see the changes.

## Known Issues

After the migration, if you still encounter any of these issues, please report them:

1. **Mixed language content**: Some pages might still display content in two different languages.
2. **RTL layout issues**: Components that should adapt to RTL direction might not do so correctly.
3. **Translation fallbacks**: If a key isn't found in the current language, it should fallback to English, but this might not always work.

## Adding New Translations

When adding new components that need i18n support:

1. Import the hook from the new location:
```tsx
import { useI18n } from "@/hooks/use-i18n-new";
```

2. Use it in your component:
```tsx
const { t, isRtl } = useI18n();
```

3. Add translation keys to both language objects in `use-i18n-new.tsx`.

## Future Improvements

For future development:

1. Consider consolidating all translations into dedicated JSON files for easier management.
2. Implement a more robust loading mechanism for translations.
3. Add automatic RTL/LTR CSS adjustments for all components. 