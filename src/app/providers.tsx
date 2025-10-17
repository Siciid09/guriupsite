'use client';

// CORRECTED IMPORT PATH
import { AuthProvider } from '../hooks/useAuth';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}