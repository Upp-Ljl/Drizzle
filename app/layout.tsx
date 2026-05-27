import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/query-provider';
import { AuthProvider } from '@/components/auth-provider';
import { AuthModal } from '@/components/auth-modal';
import { TopNav } from '@/components/top-nav';
import './globals.css';

export const metadata: Metadata = {
  title: '梗气象台 · Meme Weather',
  description: '猜下周哪个梗会火。',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryProvider>
          <AuthProvider>
            <TopNav />
            <main className="min-h-[calc(100vh-3rem)]">{children}</main>
            <AuthModal />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
