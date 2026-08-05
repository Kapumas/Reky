import { NextRequest, NextResponse } from 'next/server';
import { isDashboardConfigured, isValidDashboardPassword } from '@/lib/utils/dashboardAuth';

export async function GET() {
  if (!isDashboardConfigured()) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json({ configured: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!isValidDashboardPassword(password)) {
      return new NextResponse(null, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse(null, { status: 401 });
  }
}
