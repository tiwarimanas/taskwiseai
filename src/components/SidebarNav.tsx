'use client';

import { usePathname } from 'next/navigation';
import { ListTodo, LayoutDashboard, Bot, LogOut } from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';

const menuItems = [
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  // Hide sidebar on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <div className="flex flex-col h-full border-r">
      <SidebarHeader className="flex items-center gap-2">
        <Bot className="w-6 h-6" />
        <h1 className="text-lg font-semibold font-headline">TaskWise AI</h1>
        <div className="ml-auto">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
              className="justify-start"
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter>
        {loading ? (
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-24" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>
                {user.displayName?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <SidebarMenuButton
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={logout}
              tooltip="Log out"
            >
              <LogOut />
            </SidebarMenuButton>
          </div>
        ) : null}
      </SidebarFooter>
    </div>
  );
}
