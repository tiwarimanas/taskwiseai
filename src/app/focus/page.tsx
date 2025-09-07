import ProtectedRoute from '@/components/ProtectedRoute';
import { FocusPageClient } from '@/components/FocusPageClient';

export default function FocusPage() {
  return (
    <ProtectedRoute>
      <FocusPageClient />
    </ProtectedRoute>
  );
}
