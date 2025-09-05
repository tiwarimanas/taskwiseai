import ProtectedRoute from '@/components/ProtectedRoute';
import { SettingsPageClient } from '@/components/SettingsPageClient';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageClient />
    </ProtectedRoute>
  );
}
