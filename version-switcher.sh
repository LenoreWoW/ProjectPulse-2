#!/bin/bash

# This script helps switch between the old and new i18n implementations
# Run with ./version-switcher.sh old to switch to old implementation
# Run with ./version-switcher.sh new to switch to new implementation

if [ "$1" == "old" ]; then
  echo "Switching to old i18n implementation..."
  
  # Update main.tsx to use the old implementation
  sed -i '' 's/import { AuthProvider } from "@\/hooks\/use-auth";/import { I18nProvider } from "@\/hooks\/use-i18n";\nimport { AuthProvider } from "@\/hooks\/use-auth";/' client/src/main.tsx
  sed -i '' 's/<AuthProvider>/<I18nProvider>\n        <AuthProvider>/' client/src/main.tsx
  sed -i '' 's/<\/AuthProvider>/<\/AuthProvider>\n        <\/I18nProvider>/' client/src/main.tsx
  
  # Update App.tsx to remove the new implementation
  sed -i '' 's/import { I18nProvider } from "@\/hooks\/use-i18n-new";//' client/src/App.tsx
  sed -i '' 's/<I18nProvider>/<>/' client/src/App.tsx
  sed -i '' 's/<\/I18nProvider>/<\/>/' client/src/App.tsx
  
  echo "Switched to old i18n implementation. Restart your app to see changes."
  
elif [ "$1" == "new" ]; then
  echo "Switching to new i18n implementation..."
  
  # Update main.tsx to remove the old implementation
  sed -i '' 's/import { I18nProvider } from "@\/hooks\/use-i18n";//' client/src/main.tsx
  sed -i '' 's/<I18nProvider>\n        <AuthProvider>/<AuthProvider>/' client/src/main.tsx
  sed -i '' 's/<\/AuthProvider>\n        <\/I18nProvider>/<\/AuthProvider>/' client/src/main.tsx
  
  # Update App.tsx to use the new implementation
  sed -i '' 's/import LoginReminder/import { I18nProvider } from "@\/hooks\/use-i18n-new";\nimport LoginReminder/' client/src/App.tsx
  sed -i '' 's/<TooltipProvider>/<I18nProvider>\n        <TooltipProvider>/' client/src/App.tsx
  sed -i '' 's/<\/TooltipProvider>/<\/TooltipProvider>\n      <\/I18nProvider>/' client/src/App.tsx
  
  echo "Switched to new i18n implementation. Restart your app to see changes."
  
else
  echo "Usage: ./version-switcher.sh [old|new]"
  echo "  old: Switch to the old i18n implementation"
  echo "  new: Switch to the new i18n implementation"
  exit 1
fi 