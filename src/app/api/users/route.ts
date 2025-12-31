import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users
 * List all users (paginated)
 * TODO: Add authentication middleware
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // TODO: Fetch users from database with pagination
    const users = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: 2,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create new user
 * TODO: Add authentication middleware
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // TODO: Create user in database
    const newUser = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// Middleware will be added after Supabase setup
// export const GET = withRateLimit(withAuth(GET));
// export const POST = withRateLimit(withAuth(POST));
