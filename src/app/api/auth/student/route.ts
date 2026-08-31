// src/app/api/auth/student/route.ts

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import {
  authManager,
  COOKIE_MAX_AGE,
} from '@/lib/auth';

import {
  getStudentByEmail,
  getStudentById,
  updateStudentPassword,
} from '@/lib/productionDb';

import {
  prepareExcelStore,
} from '@/lib/excelPersistence';

import {
  leadStore,
} from '@/lib/storage';

/* =========================================================
   TYPES
========================================================= */

interface StudentRecordLike {
  studentId: string;
  name: string;
  email: string;

  mobile?: unknown;
  phone?: unknown;

  educationLevel?: unknown;
  currentClass?: unknown;
  stream?: unknown;
  board?: unknown;

  state?: unknown;
  city?: unknown;

  interestedCourse?: unknown;
  careerGoal?: unknown;
  targetJob?: unknown;
  targetExam?: unknown;
  preferredExam?: unknown;
  preferredStudyState?: unknown;

  onboardingCompleted?: unknown;

  password?: unknown;
  passwordHash?: unknown;
}

/* =========================================================
   HELPERS
========================================================= */

function toText(
  value: unknown,
  fallback = ''
): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value);
  }

  return fallback;
}

function setStudentCookies(
  response: NextResponse,
  sessionId: string,
  studentId: string
): void {
  response.cookies.set(
    'edupath_student_sess',
    sessionId,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    }
  );

  response.cookies.set(
    'edupath_student_id',
    studentId,
    {
      httpOnly: false,
      secure:
        process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    }
  );
}

function clearStudentCookies(
  response: NextResponse
): void {
  for (
    const name of [
      'edupath_student_sess',
      'edupath_student_id',
    ]
  ) {
    response.cookies.set(
      name,
      '',
      {
        httpOnly:
          name ===
          'edupath_student_sess',
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      }
    );
  }
}

function getSessionId(
  request: Request
): string {
  const cookieHeader =
    request.headers.get('cookie') || '';

  const match =
    cookieHeader.match(
      /(?:^|;\s*)edupath_student_sess=([^;]+)/
    );

  return match?.[1]
    ? decodeURIComponent(match[1])
    : '';
}

function getStudentPassword(
  student: StudentRecordLike
): string {
  const passwordHash =
    toText(student.passwordHash);

  if (passwordHash) {
    return passwordHash;
  }

  return toText(student.password);
}

function toStudentResponse(
  student: StudentRecordLike
) {
  const mobile =
    toText(
      student.mobile ||
        student.phone
    );

  return {
    id: student.studentId,
    studentId: student.studentId,

    name:
      toText(student.name),

    email:
      toText(student.email),

    mobile,

    phone:
      toText(
        student.phone ||
          student.mobile
      ),

    educationLevel:
      toText(
        student.educationLevel
      ),

    currentClass:
      toText(
        student.currentClass
      ),

    stream:
      toText(student.stream),

    board:
      toText(student.board),

    state:
      toText(student.state),

    city:
      toText(student.city),

    interestedCourse:
      toText(
        student.interestedCourse
      ),

    careerGoal:
      toText(
        student.careerGoal
      ),

    targetJob:
      toText(student.targetJob),

    targetExam:
      toText(
        student.targetExam ||
          student.preferredExam
      ),

    preferredStudyState:
      toText(
        student.preferredStudyState
      ),

    onboardingCompleted:
      Boolean(
        student.onboardingCompleted
      ),
  };
}

/* =========================================================
   GET
   Verify the current student session
========================================================= */

export async function GET(
  request: Request
) {
  try {
    const sessionId =
      getSessionId(request);

    const session =
      sessionId
        ? authManager.getStudentSession(
            sessionId
          )
        : null;

    if (!session) {
      const response =
        NextResponse.json(
          {
            success: false,
            authenticated: false,
          },
          {
            status: 401,
          }
        );

      clearStudentCookies(response);

      return response;
    }

    /*
     * PRODUCTION
     *
     * DATABASE_URL is the authoritative source.
     */
    const student =
      process.env.DATABASE_URL
        ? await getStudentById(
            session.userId
          )
        : (() => {
            try {
              return leadStore.getStudentById(
                session.userId
              ) as StudentRecordLike | null;
            } catch {
              return null;
            }
          })();

    if (!student) {
      const response =
        NextResponse.json(
          {
            success: false,
            authenticated: false,
            message:
              'Student not found.',
          },
          {
            status: 404,
          }
        );

      clearStudentCookies(response);

      return response;
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      role: 'STUDENT',
      student:
        toStudentResponse(
          student as StudentRecordLike
        ),
    });
  } catch (error) {
    console.error(
      'Student session GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        message:
          'Unable to verify student session.',
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const action =
      String(
        body.action || 'login'
      )
        .trim()
        .toLowerCase();

    /* =====================================================
       LOGOUT
    ===================================================== */

    if (action === 'logout') {
      const sessionId =
        getSessionId(request);

      if (sessionId) {
        authManager.logoutStudent(
          sessionId
        );
      }

      const response =
        NextResponse.json({
          success: true,
          message:
            'Student logged out successfully.',
        });

      clearStudentCookies(response);

      return response;
    }

    /* =====================================================
       INPUT
    ===================================================== */

    const email =
      String(
        body.email || ''
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        body.password || ''
      );

    const deviceInfo =
      String(
        body.deviceInfo ||
          'Web Browser'
      );

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email and password are required.',
        },
        {
          status: 400,
        }
      );
    }

    if (action === 'register' &&
        password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must contain at least 6 characters.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       FIND STUDENT
    ===================================================== */

    const student =
      process.env.DATABASE_URL
        ? await getStudentByEmail(
            email
          )
        : (() => {
            try {
              return leadStore.getStudentByEmail(
                email
              ) as StudentRecordLike | null;
            } catch {
              return null;
            }
          })();

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Student account not found. Please register first.',
        },
        {
          status: 404,
        }
      );
    }

    const studentRecord =
      student as StudentRecordLike;

    /* =====================================================
       REGISTER / CREATE CREDENTIALS
    ===================================================== */

    if (action === 'register') {
      const passwordHash =
        bcrypt.hashSync(
          password,
          12
        );

      /*
       * PRODUCTION:
       *
       * Persist credentials in Neon.
       */
      if (process.env.DATABASE_URL) {
        const updated =
          await updateStudentPassword(
            studentRecord.studentId,
            passwordHash
          );

        if (!updated) {
          return NextResponse.json(
            {
              success: false,
              message:
                'Unable to create student credentials.',
            },
            {
              status: 500,
            }
          );
        }
      } else {
        /*
         * LOCAL FALLBACK:
         *
         * The local ExcelStorageManager in this project
         * does not expose updateStudent(). Do not call a
         * non-existent method here.
         *
         * prepareExcelStore() keeps the existing local
         * store available, while authManager holds the
         * credential for the current running process.
         */
        await prepareExcelStore();
      }

      /*
       * Keep the existing in-memory authentication
       * manager synchronized with the credential.
       */
      authManager.upsertStudent({
        id:
          studentRecord.studentId,

        email:
          studentRecord.email,

        name:
          studentRecord.name,

        password:
          passwordHash,

        mobile:
          toText(
            studentRecord.mobile ||
              studentRecord.phone
          ),
      });

      const created =
        authManager.createStudentSession(
          studentRecord.studentId,
          studentRecord.email,
          studentRecord.name,
          deviceInfo
        );

      const response =
        NextResponse.json({
          success: true,

          message:
            'Student registration credentials created.',

          role: 'STUDENT',

          student: {
            id:
              studentRecord.studentId,

            studentId:
              studentRecord.studentId,

            name:
              studentRecord.name,

            email:
              studentRecord.email,

            mobile:
              toText(
                studentRecord.mobile ||
                  studentRecord.phone
              ),
          },
        });

      if (
        created.sessionId
      ) {
        setStudentCookies(
          response,
          created.sessionId,
          studentRecord.studentId
        );
      }

      return response;
    }

    /* =====================================================
       LOGIN
    ===================================================== */

    const storedPassword =
      getStudentPassword(
        studentRecord
      );

    /*
     * If the production record contains a bcrypt hash,
     * authManager.loginStudent() will validate it.
     */
    authManager.upsertStudent({
      id:
        studentRecord.studentId,

      email:
        studentRecord.email,

      name:
        studentRecord.name,

      password:
        storedPassword,

      mobile:
        toText(
          studentRecord.mobile ||
            studentRecord.phone
        ),
    });

    const result =
      authManager.loginStudent(
        email,
        password,
        deviceInfo
      );

    if (
      !result.success ||
      !result.sessionId ||
      !result.user
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.message ||
            'Invalid student email or password.',
        },
        {
          status: 401,
        }
      );
    }

    const response =
      NextResponse.json({
        success: true,

        message:
          result.message ||
          'Student login successful',

        role: 'STUDENT',

        sessionId:
          result.sessionId,

        student: {
          ...result.user,

          id:
            studentRecord.studentId,

          studentId:
            studentRecord.studentId,

          mobile:
            toText(
              studentRecord.mobile ||
                studentRecord.phone
            ),

          phone:
            toText(
              studentRecord.phone ||
                studentRecord.mobile
            ),

          educationLevel:
            toText(
              studentRecord.educationLevel
            ),

          currentClass:
            toText(
              studentRecord.currentClass
            ),

          stream:
            toText(
              studentRecord.stream
            ),

          board:
            toText(
              studentRecord.board
            ),

          state:
            toText(
              studentRecord.state
            ),

          city:
            toText(
              studentRecord.city
            ),

          interestedCourse:
            toText(
              studentRecord.interestedCourse
            ),

          careerGoal:
            toText(
              studentRecord.careerGoal
            ),

          targetJob:
            toText(
              studentRecord.targetJob
            ),

          targetExam:
            toText(
              studentRecord.targetExam ||
                studentRecord.preferredExam
            ),

          preferredStudyState:
            toText(
              studentRecord.preferredStudyState
            ),

          onboardingCompleted:
            Boolean(
              studentRecord.onboardingCompleted
            ),
        },
      });

    setStudentCookies(
      response,
      result.sessionId,
      studentRecord.studentId
    );

    return response;
  } catch (error) {
    console.error(
      'Student auth error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Student authentication failed.',
      },
      {
        status: 500,
      }
    );
  }
}