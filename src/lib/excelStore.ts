import {
  leadStore,
  StudentRecord as CoreStudentRecord,
  DemoBookingRecord,
} from '@/lib/storage';
import { EXCEL_FILE } from '@/lib/excelPersistence';
import * as XLSX from 'xlsx';
import fs from 'fs';

/**
 * ============================================================
 * EDUPATH - EXCEL STORE
 * ============================================================
 *
 * This module provides the legacy/local Excel-compatible data
 * access layer used by the application.
 *
 * IMPORTANT:
 * - StudentRecord extends the CORE StudentRecord.
 * - registeredAt / updatedAt are optional here because the
 *   core storage layer may return older records without them.
 * - Production persistence should use the production database
 *   layer when configured.
 * ============================================================
 */

export interface StudentRecord extends CoreStudentRecord {
  phone?: string;
  password?: string;
  passwordHash?: string;

  currentClass?: string;
  board?: string;
  percentage?: string | number;
  passingYear?: string | number;

  tenthStatus?: string;
  twelfthStatus?: string;

  preferredStudyState?: string;
  learningMode?: string;
  targetJob?: string;
  preferredExam?: string;
  targetExam?: string;
  entranceExams?: string;
  preferredIndustry?: string;

  budget?: string | number;
  preferredCollegeType?: string;

  roadmapId?: string;
  currentStep?: number | string;
  totalSteps?: number | string;

  skills?: string[];

  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;

  /**
   * These are optional in the Excel compatibility layer.
   * The API/database layer can normalize them when required.
   */
  registeredAt?: string;
  updatedAt?: string;
}

export interface DemoBooking {
  bookingId: string;

  studentId?: string;

  name: string;
  email: string;

  phone?: string;
  mobile?: string;

  interestedCourse?: string;
  counsellingMode?: string;

  preferredDate?: string;
  preferredTimeSlot?: string;

  status?: string;
  counsellor?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CoursePurchase {
  purchaseId: string;

  studentId: string;
  courseId: string;

  courseTitle?: string;

  amount?: number | string;
  currency?: string;

  paymentStatus?: string;
  paymentReference?: string;
  paymentMethod?: string;

  status?: string;

  purchasedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  progressId: string;

  studentId: string;
  courseId: string;

  courseTitle?: string;

  progressPercent?: number;

  completedModules?: number;
  totalModules?: number;

  currentModule?: string;
  currentLesson?: string;

  status?: string;

  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * ============================================================
 * EXCEL HELPERS
 * ============================================================
 */

function readWorkbook(): XLSX.WorkBook {
  if (!fs.existsSync(EXCEL_FILE)) {
    return XLSX.utils.book_new();
  }

  return XLSX.readFile(EXCEL_FILE);
}

function readRows<T>(sheet: string): T[] {
  const workbook = readWorkbook();

  const worksheet = workbook.Sheets[sheet];

  if (!worksheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<T>(worksheet, {
    defval: '',
  });
}

function writeRows<T>(
  sheet: string,
  rows: T[],
): void {
  const workbook = readWorkbook();

  const worksheet = XLSX.utils.json_to_sheet(rows);

  workbook.Sheets[sheet] = worksheet;

  if (!workbook.SheetNames.includes(sheet)) {
    workbook.SheetNames.push(sheet);
  }

  XLSX.writeFile(workbook, EXCEL_FILE);
}

/**
 * ============================================================
 * STUDENTS
 * ============================================================
 */

export function getStudents(): StudentRecord[] {
  return leadStore.getStudents().map((student) => ({
    ...student,

    registeredAt:
      typeof (student as StudentRecord).registeredAt === 'string'
        ? (student as StudentRecord).registeredAt
        : undefined,

    updatedAt:
      typeof (student as StudentRecord).updatedAt === 'string'
        ? (student as StudentRecord).updatedAt
        : undefined,
  }));
}

export function findStudentByEmail(
  email: string,
): StudentRecord | null {
  const student = leadStore.getStudentByEmail(email);

  if (!student) {
    return null;
  }

  return {
    ...student,

    registeredAt:
      typeof (student as StudentRecord).registeredAt === 'string'
        ? (student as StudentRecord).registeredAt
        : undefined,

    updatedAt:
      typeof (student as StudentRecord).updatedAt === 'string'
        ? (student as StudentRecord).updatedAt
        : undefined,
  };
}

export function findStudentById(
  id: string,
): StudentRecord | null {
  const student = leadStore.getStudentById(id);

  if (!student) {
    return null;
  }

  return {
    ...student,

    registeredAt:
      typeof (student as StudentRecord).registeredAt === 'string'
        ? (student as StudentRecord).registeredAt
        : undefined,

    updatedAt:
      typeof (student as StudentRecord).updatedAt === 'string'
        ? (student as StudentRecord).updatedAt
        : undefined,
  };
}

export function createStudent(
  student: StudentRecord,
): StudentRecord {
  const now = new Date().toISOString();

  /*
   * Normalize the dates BEFORE passing the record to the
   * underlying storage layer.
   *
   * The storage layer can expose these properties as unknown,
   * so we deliberately create our own strongly typed strings.
   */
  const registeredAt: string =
    typeof student.registeredAt === 'string'
      ? student.registeredAt
      : now;

  const updatedAt: string =
    typeof student.updatedAt === 'string'
      ? student.updatedAt
      : now;

  /*
   * Core storage record.
   *
   * The underlying storage layer is allowed to have its own
   * StudentRecord definition. We pass the complete student
   * object while explicitly normalizing the timestamps.
   */
  const normalized = {
    ...student,
    registeredAt,
    updatedAt,
  } as CoreStudentRecord;

  const created = leadStore.addStudent(normalized);

  /*
   * Do NOT read registeredAt / updatedAt back from `created`
   * because the legacy storage type may expose them as unknown.
   *
   * We already have validated string values above.
   */
  return {
    ...created,

    registeredAt,

    updatedAt,
  };
}

  

export function updateStudent(
  studentId: string,
  updates: Partial<StudentRecord>,
): StudentRecord | null {
  const students = getStudents();

  const index = students.findIndex(
    (student) => student.studentId === studentId,
  );

  if (index < 0) {
    return null;
  }

  const updatedAt = new Date().toISOString();

  const updated: StudentRecord = {
    ...students[index],
    ...updates,
    updatedAt,
  };

  students[index] = updated;

  /**
   * Excel compatibility persistence.
   *
   * In production, the database layer should be the primary
   * persistence mechanism. This write is retained for the
   * local/legacy Excel workflow.
   */
  try {
    writeRows(
      'Students',
      students,
    );
  } catch (error) {
    console.error(
      '[EduPath] Failed to write Students sheet:',
      error,
    );
  }

  return updated;
}

/**
 * ============================================================
 * DEMO BOOKINGS
 * ============================================================
 */

export function getDemoBookings(): DemoBooking[] {
  return leadStore
    .getDemoBookings()
    .map((booking) => {
      const registrationDate =
        String(
          booking.registrationDate ||
            '',
        );

      return {
        bookingId: String(
          booking.bookingId || '',
        ),

        studentId: String(
          booking.studentId || '',
        ),

        name: String(
          booking.name || '',
        ),

        email: String(
          booking.email || '',
        ),

        phone: String(
          booking.mobile || '',
        ),

        mobile: String(
          booking.mobile || '',
        ),

        interestedCourse: String(
          booking.interestedCourse || '',
        ),

        counsellingMode: String(
          booking.counsellingMode || '',
        ),

        preferredDate: String(
          booking.preferredDate || '',
        ),

        preferredTimeSlot: String(
          booking.preferredTimeSlot || '',
        ),

        status: String(
          booking.status ||
            'REQUEST RECEIVED',
        ),

        counsellor:
          booking.counsellor
            ? String(booking.counsellor)
            : undefined,

        createdAt:
          registrationDate ||
          new Date().toISOString(),

        updatedAt:
          registrationDate ||
          new Date().toISOString(),
      };
    });
}

export function getStudentDemoBookings(
  studentId: string,
): DemoBooking[] {
  return getDemoBookings().filter(
    (booking) =>
      booking.studentId === studentId,
  );
}

export function createDemoBooking(
  booking: DemoBooking,
): DemoBooking {
  const now =
    new Date().toISOString();

  const record: DemoBookingRecord = {
    bookingId: booking.bookingId,

    studentId:
      booking.studentId || '',

    name: booking.name,

    email: booking.email,

    mobile:
      booking.mobile ||
      booking.phone ||
      '',

    interestedCourse:
      booking.interestedCourse ||
      '',

    counsellingMode:
      booking.counsellingMode ||
      '',

    preferredDate:
      booking.preferredDate ||
      '',

    preferredTimeSlot:
      booking.preferredTimeSlot ||
      '',

    registrationDate:
      booking.createdAt ||
      now,

    status:
      (booking.status ||
        'REQUEST RECEIVED') as DemoBookingRecord['status'],

    counsellor:
      booking.counsellor,
  };

  const created =
    leadStore.addDemoBooking(record);

  const createdAt =
    created.registrationDate ||
    booking.createdAt ||
    now;

  return {
    ...booking,

    mobile:
      created.mobile,

    phone:
      created.mobile,

    createdAt,

    updatedAt:
      booking.updatedAt ||
      createdAt,
  };
}

/**
 * ============================================================
 * COURSE PURCHASES
 * ============================================================
 */

export function getCoursePurchases(): CoursePurchase[] {
  return readRows<CoursePurchase>(
    'CoursePurchases',
  );
}

export function getStudentCoursePurchases(
  studentId: string,
): CoursePurchase[] {
  return getCoursePurchases().filter(
    (purchase) =>
      purchase.studentId === studentId,
  );
}

export function findCoursePurchase(
  studentId: string,
  courseId: string,
): CoursePurchase | null {
  return (
    getCoursePurchases().find(
      (purchase) =>
        purchase.studentId === studentId &&
        purchase.courseId === courseId,
    ) || null
  );
}

export function createCoursePurchase(
  purchase: CoursePurchase,
): CoursePurchase {
  const existing =
    findCoursePurchase(
      purchase.studentId,
      purchase.courseId,
    );

  if (existing) {
    return existing;
  }

  const rows =
    getCoursePurchases();

  rows.unshift(purchase);

  try {
    writeRows(
      'CoursePurchases',
      rows,
    );
  } catch (error) {
    console.error(
      '[EduPath] Failed to persist course purchase:',
      error,
    );
  }

  return purchase;
}

/**
 * ============================================================
 * COURSE PROGRESS
 * ============================================================
 */

export function getCourseProgress(): CourseProgress[] {
  return readRows<CourseProgress>(
    'CourseProgress',
  );
}

export function getStudentCourseProgress(
  studentId: string,
): CourseProgress[] {
  return getCourseProgress().filter(
    (progress) =>
      progress.studentId === studentId,
  );
}

export function findCourseProgress(
  studentId: string,
  courseId: string,
): CourseProgress | null {
  return (
    getCourseProgress().find(
      (progress) =>
        progress.studentId === studentId &&
        progress.courseId === courseId,
    ) || null
  );
}

export function createCourseProgress(
  progress: CourseProgress,
): CourseProgress {
  const existing =
    findCourseProgress(
      progress.studentId,
      progress.courseId,
    );

  if (existing) {
    return existing;
  }

  const rows =
    getCourseProgress();

  rows.unshift(progress);

  try {
    writeRows(
      'CourseProgress',
      rows,
    );
  } catch (error) {
    console.error(
      '[EduPath] Failed to persist course progress:',
      error,
    );
  }

  return progress;
}

export function updateCourseProgress(
  progressId: string,
  updates: Partial<CourseProgress>,
): CourseProgress | null {
  const rows =
    getCourseProgress();

  const index =
    rows.findIndex(
      (progress) =>
        progress.progressId ===
        progressId,
    );

  if (index < 0) {
    return null;
  }

  rows[index] = {
    ...rows[index],
    ...updates,
    updatedAt:
      new Date().toISOString(),
  };

  try {
    writeRows(
      'CourseProgress',
      rows,
    );
  } catch (error) {
    console.error(
      '[EduPath] Failed to persist course progress:',
      error,
    );
  }

  return rows[index];
}

/**
 * ============================================================
 * STUDENT STATISTICS
 * ============================================================
 */

export function getStudentStatistics(
  studentId: string,
) {
  const purchases =
    getStudentCoursePurchases(
      studentId,
    );

  const progress =
    getStudentCourseProgress(
      studentId,
    );

  const averageProgress =
    progress.length > 0
      ? Math.round(
          progress.reduce(
            (sum, item) =>
              sum +
              Number(
                item.progressPercent ||
                  0,
              ),
            0,
          ) / progress.length,
        )
      : 0;

  return {
    purchasedCourses:
      purchases.length,

    activeCourses:
      purchases.filter(
        (purchase) =>
          purchase.status ===
          'ACTIVE',
      ).length,

    averageProgress,
  };
}