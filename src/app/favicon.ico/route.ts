import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url = new URL('/icon', req.url);
  return NextResponse.redirect(url, 307);
}
