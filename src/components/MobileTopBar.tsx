'use client';

import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export function MobileTopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || pathname === '/login') {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background">
      <Link href="/tasks" className="flex items-center gap-2">
        <Bot className="w-6 h-6" />
        <span className="text-lg font-semibold">TaskWise AI</span>
      </Link>
    </header>
  );
}
