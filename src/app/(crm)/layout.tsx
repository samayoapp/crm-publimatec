import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import CrmShell from '@/components/CrmShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <CrmShell user={user}>{children}</CrmShell>;
}
