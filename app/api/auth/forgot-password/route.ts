import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      // Always return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // Find user with credentials provider
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), eq(users.provider, 'credentials')))
      .limit(1);

    if (user) {
      // Generate a 32-byte random token
      const token = crypto.randomBytes(32).toString('hex');

      // Hash the token for storage (using SHA256)
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Set expiry to 1 hour from now
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      // Store hashed token and expiry
      await db
        .update(users)
        .set({
          resetToken: hashedToken,
          resetTokenExpiry: expiry,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Log reset URL to console (in production, this would send an email)
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
      console.log('=== PASSWORD RESET URL ===');
      console.log(`Email: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('========================');
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success to prevent enumeration
    return NextResponse.json({ success: true });
  }
}
