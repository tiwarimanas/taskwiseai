'use client';

import { usePathname } from 'next/navigation';
import { Bot, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';

export function MobileTopBar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  if (!user || pathname === '/login') {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background">
      <Link href="/tasks" className="flex items-center gap-2">
        <Bot className="w-6 h-6" />
        <span className="text-lg font-semibold">TaskWise AI</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {loading ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                <AvatarFallback>
                  {user.displayName?.charAt(0).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
