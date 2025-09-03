import ProtectedRoute from '@/components/ProtectedRoute';
import { EisenhowerMatrixClient } from '@/components/EisenhowerMatrixClient';

export default function EisenhowerMatrixPage() {
  return (
    <ProtectedRoute>
      <EisenhowerMatrixClient />
    </ProtectedRoute>
  );
}
