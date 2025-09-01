'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListTodo, LogOut, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './ThemeToggle';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from './ui/tooltip';

const menuItems = [
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
];

export function PrimaryNav() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  if (!user || pathname === '/login') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50 md:top-0 md:left-0 md:h-full md:w-16 md:border-r md:border-t-0">
      <div className="flex justify-around items-center h-full md:flex-col md:justify-start md:py-4">
        {/* Logo for Desktop */}
        <div className="hidden md:flex items-center justify-center mb-4">
          <Link href="/tasks">
            <Bot className="w-8 h-8" />
          </Link>
        </div>

        {/* Navigation Items */}
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-row justify-around w-full md:flex-col md:gap-2">
            {menuItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center w-full h-16 text-sm font-medium transition-colors md:h-12 md:w-12 md:rounded-lg',
                      pathname === item.href
                        ? 'text-primary bg-accent/50'
                        : 'text-muted-foreground hover:text-primary hover:bg-accent/50'
                    )}
                  >
                    <item.icon className="w-6 h-6 mb-1 md:mb-0" />
                    <span className="md:hidden">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden md:block">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Profile and Settings for Desktop */}
        <div className="hidden md:flex flex-col items-center gap-2 mt-auto">
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
              <DropdownMenuContent align="end" side="right" className="ml-2">
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

        {/* Profile for Mobile */}
        <div className="md:hidden flex items-center justify-center w-full h-full">
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
              <DropdownMenuContent align="end" side="top" className="mb-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <ThemeToggle /> <span className="ml-2">Toggle Theme</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
