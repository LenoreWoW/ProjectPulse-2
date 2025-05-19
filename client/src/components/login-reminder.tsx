import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/hooks/use-i18n-new';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogFooter, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';

/**
 * A component that shows a reminder to use Arabic input after login
 * This appears as a modal dialog rather than a toast notification
 */
export default function LoginReminder() {
  const { user } = useAuth();
  const { setLanguage } = useI18n();
  const [showReminder, setShowReminder] = useState(false);
  const [hasSeenReminder, setHasSeenReminder] = useState(false);

  // Check if we should show the reminder when the user logs in
  useEffect(() => {
    if (user && !hasSeenReminder && user.role !== "Administrator") {
      // Show reminder dialog slightly after login completes
      const timer = setTimeout(() => {
        setShowReminder(true);
        // Set Arabic as default language
        setLanguage("ar");
      }, 800); // Small delay to ensure the login redirect completes first

      return () => clearTimeout(timer);
    }
  }, [user, hasSeenReminder, setLanguage]);

  // Handle close of reminder dialog
  const handleReminderClose = () => {
    setShowReminder(false);
    setHasSeenReminder(true);
  };

  if (!user || user.role === "Administrator") {
    return null;
  }

  return (
    <AlertDialog open={showReminder} onOpenChange={setShowReminder}>
      <AlertDialogContent className="bg-qatar-maroon text-white border border-qatar-white/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-center">تذكير</AlertDialogTitle>
          <AlertDialogDescription className="text-white/90 text-lg text-center">
            يرجى إدخال البيانات باللغة العربية
            <p className="mt-2 text-sm text-white/80">Please input data in Arabic</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="justify-center">
          <AlertDialogAction 
            onClick={handleReminderClose}
            className="bg-white text-qatar-maroon hover:bg-white/90 border-none"
          >
            موافق (OK)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 