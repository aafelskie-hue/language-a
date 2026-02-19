import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = {
  title: 'Profile',
  description: 'Manage your Language A profile',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/profile');
  }

  // Fetch user data including createdAt
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      tier: users.tier,
      provider: users.provider,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-charcoal mb-8">Profile</h1>
      <ProfileContent
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          tier: user.tier,
          provider: user.provider,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}
