import { NextResponse } from 'next/server';
import { MEME_PAIRS } from '@/lib/constants';

export async function GET(request: Request) {
  return NextResponse.json({ pairs: MEME_PAIRS });
}
