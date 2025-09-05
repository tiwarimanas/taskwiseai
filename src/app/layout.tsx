import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { MobileTopBar } from '@/components/MobileTopBar';
import { PrimaryNav } from '@/components/PrimaryNav';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TaskProvider } from '@/context/TaskContext';

export const metadata: Metadata = {
  title: 'TaskWise AI',
  description: 'AI-powered task management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <TaskProvider>
              <div className="md:pl-16">
                <MobileTopBar />
                <main className="pb-16 md:pb-0">{children}</main>
              </div>
              <PrimaryNav />
              <Toaster />
            </TaskProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
