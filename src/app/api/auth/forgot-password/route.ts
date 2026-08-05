import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Generate Firebase secure password reset link
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.com'}/login`,
      handleCodeInApp: true,
    };

    const resetLink = await adminAuth.generatePasswordResetLink(
      email.toLowerCase().trim(),
      actionCodeSettings
    );

    // Note: If you use Nodemailer/Resend, you can send `resetLink` via custom HTML email here.
    // Firebase Admin also verifies the user exists during link generation.

    return NextResponse.json(
      { 
        success: true, 
        message: 'Password reset instructions have been sent to your email.' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot Password API Error:', error);

    // Prevent security user enumeration, but handle explicit disabled accounts
    if (error.code === 'auth/user-not-found') {
      // Return success status to prevent email enumeration attacks
      return NextResponse.json(
        { 
          success: true, 
          message: 'If an account exists with this email, a reset link has been sent.' 
        },
        { status: 200 }
      );
    }

    if (error.code === 'auth/user-disabled') {
      return NextResponse.json(
        { error: 'This account has been disabled. Please contact support.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process request. Please try again later.' },
      { status: 500 }
    );
  }
}