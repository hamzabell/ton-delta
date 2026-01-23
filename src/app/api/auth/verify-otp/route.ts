import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { otp } = body;

    const secret = process.env.ADMIN_2FA_SECRET;

    if (!secret) {
      console.error('ADMIN_2FA_SECRET is not set');
      // For security, don't expose that the secret is missing to the client, but log it.
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    // Verify OTP
    // Ensure we allow for a slight window drift if needed, but default is usually fine.
    // authenticator.options = { window: 1 }; 
    const isValid = authenticator.check(otp, secret);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Set secure session cookie - this is what the API would theoretically check (though we aren't adding middleware yet)
    response.cookies.set('admin_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    // Set public flag cookie for client-side state management
    // This allows the frontend to know it is authenticated without trying a request first.
    response.cookies.set('admin_session_active', 'true', {
      httpOnly: false, // Readable by client
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
