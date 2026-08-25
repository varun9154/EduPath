import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { leadStore } from '@/lib/storage';

export type AccountType = 'Student' | 'Admin';

export interface AuthSession {
  sessionId: string;
  userId: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  createdAt: string;
  expiresAt: string;
  deviceInfo?: string;
}

interface LoginResult {
  success: boolean;
  message: string;
  sessionId?: string;
  session?: AuthSession;
  user?: { id: string; email: string; name: string; role: 'ADMIN' | 'STUDENT' };
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET must be at least 32 characters in production.');
    return 'edupath-development-secret-change-me-please-32-chars';
  }
  return value;
}

function b64(value: string) {
  return Buffer.from(value).toString('base64url');
}

function sign(payload: object) {
  const body = b64(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verify(token: string): AuthSession | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AuthSession;
    if (!payload.sessionId || !payload.userId || !payload.email || !payload.role) return null;
    if (Date.now() >= new Date(payload.expiresAt).getTime()) return null;
    return payload;
  } catch { return null; }
}

function createSession(userId: string, email: string, role: 'ADMIN' | 'STUDENT', deviceInfo?: string): AuthSession {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + COOKIE_MAX_AGE * 1000);
  const sessionId = crypto.randomBytes(32).toString('hex');
  return { sessionId, userId, email, role, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString(), deviceInfo };
}

class AuthManager {
  loginAdmin(email: string, password: string, deviceInfo = 'Web Browser'): LoginResult {
    const adminEmail = (process.env.ADMIN_EMAIL || 'edupathadmin@gmail.com').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (email.trim().toLowerCase() !== adminEmail || !adminPassword || password !== adminPassword) {
      return { success: false, message: 'Invalid admin email or password' };
    }
    const session = createSession('EDU-ADMIN-001', adminEmail, 'ADMIN', deviceInfo);
    return { success: true, message: 'Admin login successful', sessionId: sign(session), session, user: { id: session.userId, email: adminEmail, name: 'EduPath Administrator', role: 'ADMIN' } };
  }

  validateAdminSession(token: string) {
    const session = verify(token);
    return Boolean(session && session.role === 'ADMIN' && session.email === (process.env.ADMIN_EMAIL || 'edupathadmin@gmail.com').trim().toLowerCase());
  }

  getAdminSession(token: string) {
    const session = verify(token);
    return session?.role === 'ADMIN' ? session : null;
  }

  logoutAdmin(_token: string) { return true; }
  destroyAdminSession(token: string) { return this.logoutAdmin(token); }

  registerStudent(data: { name: string; email: string; password: string; mobile?: string }): LoginResult {
    const email = String(data.email || '').trim().toLowerCase();
    const student = leadStore.getStudentByEmail(email);
    if (student) return { success: false, message: 'A student account with this email already exists' };
    if (!data.name.trim() || !email || data.password.length < 6) return { success: false, message: 'Name, email and a password of at least 6 characters are required' };
    return this.loginStudent(email, data.password, 'Registration');
  }

  loginStudent(email: string, password: string, deviceInfo = 'Web Browser'): LoginResult {
    const normalized = email.trim().toLowerCase();
    const student = leadStore.getStudentByEmail(normalized);
    if (!student) return { success: false, message: 'Invalid student email or password' };

    const storedHash = String((student as unknown as Record<string, unknown>).passwordHash || '');
    const storedPassword = String((student as unknown as Record<string, unknown>).password || '');
    const valid = storedHash ? bcrypt.compareSync(password, storedHash) : storedPassword === password;
    if (!valid) return { success: false, message: 'Invalid student email or password' };

    const session = createSession(student.studentId, normalized, 'STUDENT', deviceInfo);
    return { success: true, message: 'Student login successful', sessionId: sign(session), session, user: { id: student.studentId, email: normalized, name: student.name, role: 'STUDENT' } };
  }

  validateStudentSession(token: string) {
    const session = verify(token);
    return Boolean(session && session.role === 'STUDENT');
  }

  getStudentSession(token: string) {
    const session = verify(token);
    return session?.role === 'STUDENT' ? session : null;
  }

  logoutStudent(_token: string) { return true; }

  getStudentByEmail(email: string) { return leadStore.getStudentByEmail(email); }
  getStudentById(studentId: string) { return leadStore.getStudentById(studentId); }
}

export const authManager = new AuthManager();
export { COOKIE_MAX_AGE };
