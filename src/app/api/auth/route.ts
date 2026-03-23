import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!email || !password || !validEmail || !validPassword) {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  if (
    email.toLowerCase().trim() !== validEmail.toLowerCase() ||
    password !== validPassword
  ) {
    return NextResponse.json({ error: 'E-Mail oder Passwort falsch' }, { status: 401 });
  }

  const token = await new SignJWT({ userId: process.env.ADMIN_USER_ID })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('ideaswipe_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('ideaswipe_token');
  return res;
}
