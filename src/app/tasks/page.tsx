import { TaskPageClient } from '@/components/TaskPageClient';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <TaskPageClient />
    </ProtectedRoute>
  );
}
