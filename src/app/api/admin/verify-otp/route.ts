import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';

export async function POST(request: Request) {
  try {
    const { otp } = await request.json();
    
    const secret = process.env.ADMIN_2FA_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: '2FA not configured' },
        { status: 500 }
      );
    }
    
    const isValid = authenticator.verify({ token: otp, secret });
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
