import { NextResponse } from 'next/server';
import { authManager, COOKIE_MAX_AGE } from '@/lib/auth';
import { findStudentByEmail, findStudentById } from '@/lib/excelStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function setStudentCookies(response: NextResponse, sessionId: string, studentId: string) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };

  response.cookies.set('edupath_student_sess', sessionId, options);
  response.cookies.set('edupath_student_id', studentId, {
    ...options,
    httpOnly: false,
  });
}

function clearStudentCookies(response: NextResponse) {
  response.cookies.set('edupath_student_sess', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set('edupath_student_id', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)edupath_student_sess=([^;]+)/);
    const sessionId = match?.[1] ? decodeURIComponent(match[1]) : '';
    if (!sessionId) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    const session = authManager.getStudentSession(sessionId);
    if (!session) {
      const response = NextResponse.json({ success: false, authenticated: false }, { status: 401 });
      clearStudentCookies(response);
      return response;
    }

    const student = findStudentById(session.userId);
    if (!student) {
      return NextResponse.json({ success: false, authenticated: false, message: 'Student not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      role: 'STUDENT',
      student: {
        id: student.studentId,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        mobile: student.mobile || student.phone || '',
        phone: student.phone || student.mobile || '',
        educationLevel: student.educationLevel || '',
        stream: student.stream || '',
        state: student.state || '',
        city: student.city || '',
        interestedCourse: student.interestedCourse || '',
        careerGoal: student.careerGoal || '',
        targetJob: student.targetJob || '',
        targetExam: student.targetExam || student.preferredExam || '',
        onboardingCompleted: Boolean(student.onboardingCompleted),
      },
    });
  } catch (error) {
    console.error('Student session GET error:', error);
    return NextResponse.json({ success: false, authenticated: false, message: 'Unable to verify student session.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = String(body?.action || 'login').trim().toLowerCase();

    if (action === 'logout') {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)edupath_student_sess=([^;]+)/);
      const sessionId = match?.[1] ? decodeURIComponent(match[1]) : '';
      if (sessionId) authManager.logoutStudent(sessionId);
      const response = NextResponse.json({ success: true, message: 'Student logged out successfully.' });
      clearStudentCookies(response);
      return response;
    }

    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const deviceInfo = String(body?.deviceInfo || 'Web Browser');

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const persistentStudent = findStudentByEmail(email);
    if (!persistentStudent) {
      return NextResponse.json({ success: false, message: 'Student account not found. Please register first.' }, { status: 404 });
    }

    // Registration/login passwords are stored in the existing ExcelStore for this application snapshot.
    if (action === 'register') {
      authManager.upsertStudent({
        id: persistentStudent.studentId,
        email: persistentStudent.email,
        name: persistentStudent.name,
        password,
        mobile: persistentStudent.mobile || persistentStudent.phone,
      });
    } else {
      authManager.upsertStudent({
        id: persistentStudent.studentId,
        email: persistentStudent.email,
        name: persistentStudent.name,
        password: persistentStudent.password || password,
        mobile: persistentStudent.mobile || persistentStudent.phone,
      });
    }

    if (action === 'register') {
      const result = authManager.createStudentSession(
        persistentStudent.studentId,
        persistentStudent.email,
        persistentStudent.name,
        deviceInfo
      );
      const response = NextResponse.json({
        success: true,
        message: 'Student registration credentials created.',
        role: 'STUDENT',
        student: { id: persistentStudent.studentId, studentId: persistentStudent.studentId, name: persistentStudent.name, email: persistentStudent.email },
      });
      if (result.sessionId) setStudentCookies(response, result.sessionId, persistentStudent.studentId);
      return response;
    }

    const result = authManager.loginStudent(email, password, deviceInfo);
    if (!result.success || !result.sessionId || !result.user) {
      return NextResponse.json({ success: false, message: result.message || 'Invalid student email or password.' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      message: result.message || 'Student login successful',
      role: 'STUDENT',
      sessionId: result.sessionId,
      student: {
        ...result.user,
        id: persistentStudent.studentId,
        studentId: persistentStudent.studentId,
        mobile: persistentStudent.mobile || persistentStudent.phone || '',
      },
    });
    setStudentCookies(response, result.sessionId, persistentStudent.studentId);
    return response;
  } catch (error) {
    console.error('Student login error:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
