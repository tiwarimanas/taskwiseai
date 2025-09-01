'use client';

import { usePathname } from 'next/navigation';
import { ListTodo, LayoutDashboard, Bot } from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';

const menuItems = [
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function SidebarNav() {
  const pathname = usePathname();

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
    </div>
  );
}
