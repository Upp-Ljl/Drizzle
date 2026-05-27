/**
 * Server-component layout guard. When DEMO_MODE=false (prod), this route is
 * not mounted — 404. In demo it just renders children.
 */

import { notFound } from 'next/navigation';
import { env } from '@/lib/env';

export default function DemoAccelerateLayout({ children }: { children: React.ReactNode }) {
  if (!env.DEMO_MODE) {
    notFound();
  }
  return <>{children}</>;
}
