// src/lib/auth.ts

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export type AccountType = 'Student' | 'Admin';

export interface AdminUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'ADMIN';
}

export interface StudentUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'STUDENT';
  mobile?: string;
}

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
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'STUDENT';
  };
}

class AuthManager {
  private adminUsers: AdminUser[] = [];
  private studentUsers: StudentUser[] = [];

  private adminSessions = new Map<string, AuthSession>();
  private studentSessions = new Map<string, AuthSession>();

  constructor() {
    this.seedAdmin();
  }

  /*
   * =========================================================
   * ADMIN USER
   * =========================================================
   *
   * Change these credentials through environment variables
   * in production.
   *
   * ADMIN_EMAIL=admin@edupath.in
   * ADMIN_PASSWORD=your-password
   */

  private seedAdmin() {
    const email =
      process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
      'admin@edupath.in';

    const password =
      process.env.ADMIN_PASSWORD ||
      'Admin@123';

    this.adminUsers = [
      {
        id: 'EDU-ADMIN-001',
        email,
        password,
        name: 'EduPath Administrator',
        role: 'ADMIN',
      },
    ];
  }

  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  private passwordsMatch(input: string, stored: string): boolean {
    try {
      if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
        return bcrypt.compareSync(input, stored);
      }
    } catch {
      return false;
    }
    return input === stored;
  }

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private createSession(
    userId: string,
    email: string,
    role: 'ADMIN' | 'STUDENT',
    deviceInfo?: string
  ): AuthSession {
    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    return {
      sessionId: this.generateSessionId(),
      userId,
      email,
      role,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      deviceInfo,
    };
  }

  private isSessionValid(
    session: AuthSession | undefined,
    expectedRole: 'ADMIN' | 'STUDENT'
  ): boolean {
    if (!session) {
      return false;
    }

    if (session.role !== expectedRole) {
      return false;
    }

    const now = Date.now();
    const expiresAt =
      new Date(session.expiresAt).getTime();

    if (now >= expiresAt) {
      return false;
    }

    return true;
  }

  /*
   * =========================================================
   * ADMIN LOGIN
   * =========================================================
   */

  public loginAdmin(
    email: string,
    password: string,
    deviceInfo = 'Web Browser'
  ): LoginResult {
    const normalizedEmail =
      String(email).trim().toLowerCase();

    const admin = this.adminUsers.find(
      (user) =>
        user.email === normalizedEmail
    );

    if (!admin) {
      return {
        success: false,
        message: 'Invalid admin email or password',
      };
    }

    if (!this.passwordsMatch(password, admin.password)) {
      return {
        success: false,
        message: 'Invalid admin email or password',
      };
    }

    const session =
      this.createSession(
        admin.id,
        admin.email,
        'ADMIN',
        deviceInfo
      );

    this.adminSessions.set(
      session.sessionId,
      session
    );

    return {
      success: true,
      message: 'Admin login successful',
      sessionId: session.sessionId,
      session,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'ADMIN',
      },
    };
  }

  /*
   * =========================================================
   * ADMIN SESSION VALIDATION
   * =========================================================
   */

  public validateAdminSession(
    sessionId: string
  ): boolean {
    const session =
      this.adminSessions.get(sessionId);

    if (
      !this.isSessionValid(
        session,
        'ADMIN'
      )
    ) {
      if (sessionId) {
        this.adminSessions.delete(
          sessionId
        );
      }

      return false;
    }

    return true;
  }

  /*
   * =========================================================
   * GET ADMIN SESSION
   * =========================================================
   */

  public getAdminSession(
    sessionId: string
  ): AuthSession | null {
    const session =
      this.adminSessions.get(sessionId);

    if (
      !this.isSessionValid(
        session,
        'ADMIN'
      )
    ) {
      if (sessionId) {
        this.adminSessions.delete(
          sessionId
        );
      }

      return null;
    }

    return session!;
  }

  /*
   * =========================================================
   * ADMIN LOGOUT
   * =========================================================
   */

  public logoutAdmin(
    sessionId: string
  ): boolean {
    return this.adminSessions.delete(
      sessionId
    );
  }
  
    /*
   * =========================================================
   * DESTROY ADMIN SESSION
   * =========================================================
   *
   * Compatibility method used by the admin Logout API route.
   * Internally it uses the existing logoutAdmin() method.
   */

  public destroyAdminSession(
    sessionId: string
  ): boolean {
    return this.logoutAdmin(sessionId);
  }
  /*
   * =========================================================
   * STUDENT REGISTRATION
   * =========================================================
   */

  public registerStudent(
    data: {
      name: string;
      email: string;
      password: string;
      mobile?: string;
    }
  ): LoginResult {
    const name =
      String(data.name || '').trim();

    const email =
      String(data.email || '')
        .trim()
        .toLowerCase();

    const password =
      String(data.password || '');

    const mobile =
      String(data.mobile || '').trim();

    if (!name || !email || !password) {
      return {
        success: false,
        message:
          'Name, email and password are required',
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message:
          'Password must contain at least 6 characters',
      };
    }

    const existingStudent =
      this.studentUsers.find(
        (student) =>
          student.email === email
      );

    if (existingStudent) {
      return {
        success: false,
        message:
          'A student account with this email already exists',
      };
    }

    const student: StudentUser = {
      id: `EDU-STU-${Date.now()}`,
      name,
      email,
      password,
      mobile,
      role: 'STUDENT',
    };

    this.studentUsers.push(student);

    /*
     * Automatically login the student after
     * successful registration.
     */

    const session =
      this.createSession(
        student.id,
        student.email,
        'STUDENT',
        'Web Browser'
      );

    this.studentSessions.set(
      session.sessionId,
      session
    );

    return {
      success: true,
      message:
        'Student account created successfully',
      sessionId: session.sessionId,
      session,
      user: {
        id: student.id,
        email: student.email,
        name: student.name,
        role: 'STUDENT',
      },
    };
  }

  /*
   * =========================================================
   * SYNC STUDENT FROM PERSISTENT STORE
   * =========================================================
   */

  public upsertStudent(
    data: {
      id: string;
      email: string;
      name: string;
      password: string;
      mobile?: string;
    }
  ): StudentUser {
    const normalizedEmail =
      String(data.email).trim().toLowerCase();

    const existing = this.studentUsers.find(
      (student) => student.email === normalizedEmail
    );

    const student: StudentUser = {
      id: data.id,
      email: normalizedEmail,
      name: String(data.name || 'Student').trim(),
      password: String(data.password || ''),
      mobile: String(data.mobile || ''),
      role: 'STUDENT',
    };

    if (existing) {
      existing.id = student.id;
      existing.name = student.name;
      existing.password = student.password;
      existing.mobile = student.mobile;
      return existing;
    }

    this.studentUsers.push(student);
    return student;
  }

  public createStudentSession(
    studentId: string,
    email: string,
    name: string,
    deviceInfo = 'Web Browser'
  ): LoginResult {
    const normalizedEmail =
      String(email).trim().toLowerCase();

    const session = this.createSession(
      studentId,
      normalizedEmail,
      'STUDENT',
      deviceInfo
    );

    this.studentSessions.set(session.sessionId, session);

    return {
      success: true,
      message: 'Student session created successfully',
      sessionId: session.sessionId,
      session,
      user: {
        id: studentId,
        email: normalizedEmail,
        name,
        role: 'STUDENT',
      },
    };
  }

  /*
   * =========================================================
   * STUDENT LOGIN
   * =========================================================
   */

  public loginStudent(
    email: string,
    password: string,
    deviceInfo = 'Web Browser'
  ): LoginResult {
    const normalizedEmail =
      String(email).trim().toLowerCase();

    const student =
      this.studentUsers.find(
        (user) =>
          user.email === normalizedEmail
      );

    if (!student) {
      return {
        success: false,
        message:
          'Invalid student email or password',
      };
    }

    if (!this.passwordsMatch(password, student.password)) {
      return {
        success: false,
        message:
          'Invalid student email or password',
      };
    }

    const session =
      this.createSession(
        student.id,
        student.email,
        'STUDENT',
        deviceInfo
      );

    this.studentSessions.set(
      session.sessionId,
      session
    );

    return {
      success: true,
      message:
        'Student login successful',
      sessionId: session.sessionId,
      session,
      user: {
        id: student.id,
        email: student.email,
        name: student.name,
        role: 'STUDENT',
      },
    };
  }

  /*
   * =========================================================
   * STUDENT SESSION VALIDATION
   * =========================================================
   */

  public validateStudentSession(
    sessionId: string
  ): boolean {
    const session =
      this.studentSessions.get(sessionId);

    if (
      !this.isSessionValid(
        session,
        'STUDENT'
      )
    ) {
      if (sessionId) {
        this.studentSessions.delete(
          sessionId
        );
      }

      return false;
    }

    return true;
  }

  /*
   * =========================================================
   * GET STUDENT SESSION
   * =========================================================
   */

  public getStudentSession(
    sessionId: string
  ): AuthSession | null {
    const session =
      this.studentSessions.get(sessionId);

    if (
      !this.isSessionValid(
        session,
        'STUDENT'
      )
    ) {
      if (sessionId) {
        this.studentSessions.delete(
          sessionId
        );
      }

      return null;
    }

    return session!;
  }

  /*
   * =========================================================
   * STUDENT LOGOUT
   * =========================================================
   */

  public logoutStudent(
    sessionId: string
  ): boolean {
    return this.studentSessions.delete(
      sessionId
    );
  }

  /*
   * =========================================================
   * FIND STUDENT
   * =========================================================
   */

  public getStudentByEmail(
    email: string
  ): StudentUser | null {
    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    return (
      this.studentUsers.find(
        (student) =>
          student.email ===
          normalizedEmail
      ) || null
    );
  }

  public getStudentById(
    studentId: string
  ): StudentUser | null {
    return (
      this.studentUsers.find(
        (student) =>
          student.id === studentId
      ) || null
    );
  }
}

/*
 * =========================================================
 * GLOBAL SINGLETON
 * =========================================================
 *
 * Important for Next.js development:
 * keep the AuthManager instance on globalThis so
 * hot reload does not create a new manager every time.
 */

const globalForAuth =
  globalThis as unknown as {
    edupathAuthManager?: AuthManager;
  };

export const authManager =
  globalForAuth.edupathAuthManager ??
  new AuthManager();

if (process.env.NODE_ENV !== 'production') {
  globalForAuth.edupathAuthManager =
    authManager;
}