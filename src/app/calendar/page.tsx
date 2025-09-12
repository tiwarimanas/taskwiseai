import ProtectedRoute from '@/components/ProtectedRoute';
import { CalendarPageClient } from '@/components/CalendarPageClient';

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarPageClient />
    </ProtectedRoute>
  );
}
