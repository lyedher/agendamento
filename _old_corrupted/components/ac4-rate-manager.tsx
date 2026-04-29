import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUserDataById, isAdmin } from '@/lib/actions';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const [user, userIsAdmin] = await Promise.all([
      getUserDataById(userId),
      isAdmin(userId),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user, isAdmin: userIsAdmin });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}