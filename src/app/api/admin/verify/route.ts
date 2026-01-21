/**
 * Admin Verify Endpoint
 * POST /api/admin/verify - Verify admin credentials and get token
 */

import { validateAdminLogin, generateAdminToken } from '@/lib/admin-security';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Validate admin login
    const validation = await validateAdminLogin(email, password);
    
    if (!validation.isValid) {
      return Response.json(
        { error: validation.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateAdminToken(email, validation.role!);

    return Response.json(
      {
        success: true,
        token,
        role: validation.role,
        email: email,
        expiresIn: '24h',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin verify error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
