import type { Session, User } from '@supabase/supabase-js';
import { emitAuthChange } from '../auth-events';
import { findUserByEmail, findUserById, getDb, newId, setDb, updateDb } from '../db';
import { mockDelay } from '../delay';
import { getJson, setJson, STORAGE_KEYS } from '../storage';
import type { MockSessionPayload, MockUserRecord, UserRole } from '../types';

const DEMO_EMAIL_MAP: Record<string, UserRole> = {
  'customer@evently.demo': 'customer',
  'vendor@evently.demo': 'vendor',
  'admin@evently.demo': 'admin',
};

function toSupabaseUser(record: MockUserRecord): User {
  const confirmedAt = record.emailVerified
    ? new Date().toISOString()
    : undefined;

  return {
    id: record.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: record.email,
    email_confirmed_at: confirmedAt,
    phone: '',
    confirmed_at: confirmedAt,
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      name: record.name,
      role: record.role,
    },
    identities: [
      {
        id: record.id,
        user_id: record.id,
        identity_data: { email: record.email, sub: record.id },
        provider: 'email',
        last_sign_in_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as User;
}

function toSupabaseSession(user: User): Session {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  return {
    access_token: `demo-token-${user.id}`,
    token_type: 'bearer',
    expires_in: 60 * 60 * 24,
    expires_at: expiresAt,
    refresh_token: `demo-refresh-${user.id}`,
    user,
  } as Session;
}

function saveSession(user: MockUserRecord): Session {
  const supabaseUser = toSupabaseUser(user);
  const session = toSupabaseSession(supabaseUser);
  const payload: MockSessionPayload = {
    userId: user.id,
    accessToken: session.access_token,
    expiresAt: session.expires_at ?? 0,
  };
  setJson(STORAGE_KEYS.SESSION, payload);
  emitAuthChange('SIGNED_IN', session);
  return session;
}

export async function mockGetSession(): Promise<{ session: Session | null }> {
  await mockDelay();
  const payload = getJson<MockSessionPayload | null>(STORAGE_KEYS.SESSION, null);
  if (!payload) return { session: null };

  const db = getDb();
  const user = findUserById(db, payload.userId);
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return { session: null };
  }

  return { session: toSupabaseSession(toSupabaseUser(user)) };
}

export async function mockSignInWithPassword(
  email: string,
  password: string,
): Promise<{ error: { message: string } | null; data: { session: Session | null } }> {
  await mockDelay();
  const db = getDb();
  let user = findUserByEmail(db, email);

  if (!user) {
    const role = DEMO_EMAIL_MAP[email.toLowerCase()] ?? 'customer';
    user = {
      id: newId('user'),
      email: email.toLowerCase(),
      password,
      name: email.split('@')[0],
      role,
      emailVerified: true,
    };
    updateDb((d) => {
      d.users.push(user!);
      d.profiles.push({ id: user!.id, name: user!.name, email: user!.email });
    });
  } else if (user.password !== password) {
    return {
      error: { message: 'Invalid login credentials' },
      data: { session: null },
    };
  }

  const session = saveSession(user);
  return { error: null, data: { session } };
}

export async function mockQuickLogin(role: UserRole): Promise<Session> {
  await mockDelay(150);
  const db = getDb();
  const user = db.users.find((u) => u.role === role);
  if (!user) {
    throw new Error(`No demo user for role: ${role}`);
  }
  return saveSession(user);
}

export async function mockSignUp(
  email: string,
  password: string,
  name?: string,
  type: 'vendor' | 'customer' = 'customer',
): Promise<{
  error: { message: string } | null;
  data: { user: User | null; session: Session | null };
  exists?: boolean;
}> {
  await mockDelay();
  const db = getDb();
  const existing = findUserByEmail(db, email);

  if (existing) {
    const user = toSupabaseUser({ ...existing, emailVerified: false });
  return {
      error: null,
      data: { user: { ...user, identities: [] } as User, session: null },
      exists: true,
    };
  }

  const role: UserRole = type === 'vendor' ? 'pending_vendor' : 'customer';
  const record: MockUserRecord = {
    id: newId('user'),
    email: email.toLowerCase(),
    password,
    name: name || email.split('@')[0],
    role,
    emailVerified: false,
  };

  updateDb((d) => {
    d.users.push(record);
    d.profiles.push({ id: record.id, name: record.name, email: record.email });
  });

  const user = toSupabaseUser(record);
  return { error: null, data: { user, session: null }, exists: false };
}

export async function mockSignOut(): Promise<{ error: null }> {
  await mockDelay(100);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  emitAuthChange('SIGNED_OUT', null);
  return { error: null };
}

export async function mockResetPasswordForEmail(_email: string): Promise<{ error: null }> {
  await mockDelay();
  return { error: null };
}

export async function mockResendSignup(email: string): Promise<{ error: { message: string } | null }> {
  await mockDelay();
  const db = getDb();
  if (!findUserByEmail(db, email)) {
    return { error: { message: 'User not found' } };
  }
  return { error: null };
}

export async function mockVerifyEmailToken(
  _token: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  await mockDelay();
  const payload = getJson<MockSessionPayload | null>(STORAGE_KEYS.SESSION, null);
  if (payload) {
    updateDb((d) => {
      const user = findUserById(d, payload.userId);
      if (user) user.emailVerified = true;
    });
    const db = getDb();
    const user = findUserById(db, payload.userId);
    if (user) saveSession(user);
  }
  return { success: true, message: 'Email verified successfully!' };
}

export async function mockUpdateUserMetadata(
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await mockDelay();
  updateDb((d) => {
    const user = findUserById(d, userId);
    if (!user) return;
    if (typeof metadata.role === 'string') {
      user.role = metadata.role as UserRole;
    }
    if (typeof metadata.name === 'string') {
      user.name = metadata.name;
      const profile = d.profiles.find((p) => p.id === userId);
      if (profile) profile.name = metadata.name;
    }
  });
  const payload = getJson<MockSessionPayload | null>(STORAGE_KEYS.SESSION, null);
  if (payload?.userId === userId) {
    const db = getDb();
    const user = findUserById(db, userId);
    if (user) saveSession(user);
  }
}

export async function mockGetUser(): Promise<{ user: User | null; error: null }> {
  await mockDelay(100);
  const { session } = await mockGetSession();
  return { user: session?.user ?? null, error: null };
}

export function clearMockSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  emitAuthChange('SIGNED_OUT', null);
}
