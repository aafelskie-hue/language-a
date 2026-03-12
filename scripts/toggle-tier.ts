import 'dotenv/config';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const db = drizzle(sql);

async function main() {
  const [action, email] = process.argv.slice(2);

  if (!action || !email || !['promote', 'demote'].includes(action)) {
    console.error('Usage: npx tsx scripts/toggle-tier.ts <promote|demote> <email>');
    process.exit(1);
  }

  const tier = action === 'promote' ? 'premium' : 'free';

  const [updated] = await db
    .update(users)
    .set({ tier, updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, tier: users.tier });

  if (!updated) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Updated ${updated.email} → tier: ${updated.tier}`);
  console.log('\nReminder: The user must sign out and back in for the tier change to take effect (tier is baked into the JWT at login time).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
