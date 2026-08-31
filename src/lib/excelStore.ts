import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const DATA_DIR = path.join(process.cwd(), 'data');

const EXCEL_FILE = path.join(
  DATA_DIR,
  'edupath-data.xlsx'
);

const STUDENTS_SHEET = 'Students';
const DEMOS_SHEET = 'DemoBookings';
const COURSE_PURCHASES_SHEET = 'CoursePurchases';
const COURSE_PROGRESS_SHEET = 'CourseProgress';

/* =========================================================
   STUDENT
========================================================= */

export interface StudentRecord {
  studentId: string;

  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  password?: string;

  educationLevel?: string;
  currentClass?: string;
  stream?: string;
  board?: string;

  percentage?: string | number;
  passingYear?: string | number;

  marks10th?: string | number;
  marks12th?: string | number;

  tenthStatus?: string;
  twelfthStatus?: string;

  state?: string;
  city?: string;

  preferredStudyState?: string;
  preferredStudyMode?: string;
  learningMode?: string;

  careerGoal?: string;
  interestedCourse?: string;
  targetJob?: string;

  targetExam?: string;
  preferredExam?: string;
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

  registeredAt: string;
  updatedAt: string;

  status?: string;
}

/* =========================================================
   DEMO BOOKING
========================================================= */

export interface DemoBooking {
  bookingId: string;

  studentId?: string;

  name: string;
  email: string;
  phone?: string;

  interestedCourse?: string;

  counsellingMode?: string;

  preferredDate?: string;
  preferredTimeSlot?: string;

  status?: string;
  counsellor?: string;

  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   COURSE PURCHASE
========================================================= */

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

/* =========================================================
   COURSE PROGRESS
========================================================= */

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

/* =========================================================
   FILE HELPERS
========================================================= */

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true,
    });
  }
}

function createWorkbookIfMissing() {
  ensureDataDirectory();

  if (fs.existsSync(EXCEL_FILE)) {
    return;
  }

  const workbook = XLSX.utils.book_new();

  const studentsSheet =
    XLSX.utils.json_to_sheet([]);

  const demosSheet =
    XLSX.utils.json_to_sheet([]);

  const purchasesSheet =
    XLSX.utils.json_to_sheet([]);

  const progressSheet =
    XLSX.utils.json_to_sheet([]);

  XLSX.utils.book_append_sheet(
    workbook,
    studentsSheet,
    STUDENTS_SHEET
  );

  XLSX.utils.book_append_sheet(
    workbook,
    demosSheet,
    DEMOS_SHEET
  );

  XLSX.utils.book_append_sheet(
    workbook,
    purchasesSheet,
    COURSE_PURCHASES_SHEET
  );

  XLSX.utils.book_append_sheet(
    workbook,
    progressSheet,
    COURSE_PROGRESS_SHEET
  );

  XLSX.writeFile(
    workbook,
    EXCEL_FILE
  );
}

function loadWorkbook() {
  createWorkbookIfMissing();

  return XLSX.readFile(
    EXCEL_FILE
  );
}

function saveWorkbook(
  workbook: XLSX.WorkBook
) {
  XLSX.writeFile(
    workbook,
    EXCEL_FILE
  );
}

function readSheet<T>(
  workbook: XLSX.WorkBook,
  sheetName: string
): T[] {
  const sheet =
    workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<T>(
    sheet,
    {
      defval: '',
    }
  );
}

function writeSheet<T>(
  workbook: XLSX.WorkBook,
  sheetName: string,
  rows: T[]
) {
  const sheet =
    XLSX.utils.json_to_sheet(rows);

  workbook.Sheets[sheetName] =
    sheet;

  if (
    !workbook.SheetNames.includes(
      sheetName
    )
  ) {
    workbook.SheetNames.push(
      sheetName
    );
  }
}

/* =========================================================
   STUDENTS
========================================================= */

export function getStudents(): StudentRecord[] {
  const workbook =
    loadWorkbook();

  return readSheet<StudentRecord>(
    workbook,
    STUDENTS_SHEET
  );
}

export function findStudentByEmail(
  email: string
): StudentRecord | null {
  const normalized =
    email
      .trim()
      .toLowerCase();

  const students =
    getStudents();

  return (
    students.find(
      (student) =>
        student.email
          ?.trim()
          .toLowerCase() ===
        normalized
    ) || null
  );
}

export function findStudentById(
  studentId: string
): StudentRecord | null {
  const students =
    getStudents();

  return (
    students.find(
      (student) =>
        student.studentId ===
        studentId
    ) || null
  );
}

export function createStudent(
  student: StudentRecord
): StudentRecord {
  const workbook =
    loadWorkbook();

  const students =
    readSheet<StudentRecord>(
      workbook,
      STUDENTS_SHEET
    );

  const emailExists =
    students.some(
      (item) =>
        item.email
          ?.trim()
          .toLowerCase() ===
        student.email
          ?.trim()
          .toLowerCase()
    );

  if (emailExists) {
    throw new Error(
      'A student with this email already exists.'
    );
  }

  students.push(student);

  writeSheet(
    workbook,
    STUDENTS_SHEET,
    students
  );

  saveWorkbook(workbook);

  return student;
}

export function updateStudent(
  studentId: string,
  updates: Partial<StudentRecord>
): StudentRecord | null {
  const workbook =
    loadWorkbook();

  const students =
    readSheet<StudentRecord>(
      workbook,
      STUDENTS_SHEET
    );

  const index =
    students.findIndex(
      (student) =>
        student.studentId ===
        studentId
    );

  if (index === -1) {
    return null;
  }

  students[index] = {
    ...students[index],
    ...updates,
    updatedAt:
      new Date().toISOString(),
  };

  writeSheet(
    workbook,
    STUDENTS_SHEET,
    students
  );

  saveWorkbook(workbook);

  return students[index];
}

/* =========================================================
   DEMO BOOKINGS
========================================================= */

export function getDemoBookings(): DemoBooking[] {
  const workbook =
    loadWorkbook();

  return readSheet<DemoBooking>(
    workbook,
    DEMOS_SHEET
  );
}

export function getStudentDemoBookings(
  studentId: string
): DemoBooking[] {
  return getDemoBookings().filter(
    (demo) =>
      demo.studentId ===
      studentId
  );
}

export function createDemoBooking(
  booking: DemoBooking
): DemoBooking {
  const workbook =
    loadWorkbook();

  const bookings =
    readSheet<DemoBooking>(
      workbook,
      DEMOS_SHEET
    );

  bookings.push(booking);

  writeSheet(
    workbook,
    DEMOS_SHEET,
    bookings
  );

  saveWorkbook(workbook);

  return booking;
}

/* =========================================================
   COURSE PURCHASES
========================================================= */

export function getCoursePurchases(): CoursePurchase[] {
  const workbook =
    loadWorkbook();

  return readSheet<CoursePurchase>(
    workbook,
    COURSE_PURCHASES_SHEET
  );
}

export function getStudentCoursePurchases(
  studentId: string
): CoursePurchase[] {
  return getCoursePurchases().filter(
    (purchase) =>
      purchase.studentId ===
      studentId
  );
}

export function findCoursePurchase(
  studentId: string,
  courseId: string
): CoursePurchase | null {
  return (
    getCoursePurchases().find(
      (purchase) =>
        purchase.studentId ===
          studentId &&
        purchase.courseId ===
          courseId
    ) || null
  );
}

/*
  Supports both:

  createCoursePurchase(purchase)

  and

  createCoursePurchase(studentId, purchase)
*/

export function createCoursePurchase(
  purchaseOrStudentId:
    | CoursePurchase
    | string,
  maybePurchase?: CoursePurchase
): CoursePurchase {
  let purchase: CoursePurchase;

  if (
    typeof purchaseOrStudentId ===
    'string'
  ) {
    if (!maybePurchase) {
      throw new Error(
        'Course purchase data is required.'
      );
    }

    purchase = {
      ...maybePurchase,
      studentId:
        purchaseOrStudentId,
    };
  } else {
    purchase =
      purchaseOrStudentId;
  }

  const workbook =
    loadWorkbook();

  const purchases =
    readSheet<CoursePurchase>(
      workbook,
      COURSE_PURCHASES_SHEET
    );

  purchases.push(purchase);

  writeSheet(
    workbook,
    COURSE_PURCHASES_SHEET,
    purchases
  );

  saveWorkbook(workbook);

  return purchase;
}

/* =========================================================
   COURSE PROGRESS
========================================================= */

export function getCourseProgress(): CourseProgress[] {
  const workbook =
    loadWorkbook();

  return readSheet<CourseProgress>(
    workbook,
    COURSE_PROGRESS_SHEET
  );
}

export function getStudentCourseProgress(
  studentId: string
): CourseProgress[] {
  return getCourseProgress().filter(
    (progress) =>
      progress.studentId ===
      studentId
  );
}

export function findCourseProgress(
  studentId: string,
  courseId: string
): CourseProgress | null {
  return (
    getCourseProgress().find(
      (progress) =>
        progress.studentId ===
          studentId &&
        progress.courseId ===
          courseId
    ) || null
  );
}

/*
  Supports:

  createCourseProgress(progress)

  createCourseProgress(studentId, progress)
*/

export function createCourseProgress(
  progressOrStudentId:
    | CourseProgress
    | string,
  maybeProgress?: CourseProgress
): CourseProgress {
  let progress: CourseProgress;

  if (
    typeof progressOrStudentId ===
    'string'
  ) {
    if (!maybeProgress) {
      throw new Error(
        'Course progress data is required.'
      );
    }

    progress = {
      ...maybeProgress,
      studentId:
        progressOrStudentId,
    };
  } else {
    progress =
      progressOrStudentId;
  }

  const workbook =
    loadWorkbook();

  const rows =
    readSheet<CourseProgress>(
      workbook,
      COURSE_PROGRESS_SHEET
    );

  rows.push(progress);

  writeSheet(
    workbook,
    COURSE_PROGRESS_SHEET,
    rows
  );

  saveWorkbook(workbook);

  return progress;
}

/*
  Supports:

  updateCourseProgress(progressId, updates)

  and

  updateCourseProgress(studentId, courseId, updates)
*/

export function updateCourseProgress(
  firstId: string,
  second:
    | Partial<CourseProgress>
    | string,
  third?: Partial<CourseProgress>
): CourseProgress | null {
  const workbook =
    loadWorkbook();

  const rows =
    readSheet<CourseProgress>(
      workbook,
      COURSE_PROGRESS_SHEET
    );

  let index = -1;
  let updates: Partial<CourseProgress>;

  if (
    typeof second === 'string'
  ) {
    const courseId =
      second;

    updates =
      third || {};

    index =
      rows.findIndex(
        (row) =>
          row.studentId ===
            firstId &&
          row.courseId ===
            courseId
      );
  } else {
    updates =
      second;

    index =
      rows.findIndex(
        (row) =>
          row.progressId ===
          firstId
      );
  }

  if (index === -1) {
    return null;
  }

  rows[index] = {
    ...rows[index],
    ...updates,
    updatedAt:
      new Date().toISOString(),
  };

  writeSheet(
    workbook,
    COURSE_PROGRESS_SHEET,
    rows
  );

  saveWorkbook(workbook);

  return rows[index];
}

/* =========================================================
   ADMIN STATISTICS
========================================================= */

export function getStudentStatistics() {
  const students =
    getStudents();

  const demos =
    getDemoBookings();

  const purchases =
    getCoursePurchases();

  return {
    totalStudents:
      students.length,

    activeStudents:
      students.filter(
        (student) =>
          student.status !==
          'INACTIVE'
      ).length,

    completedOnboarding:
      students.filter(
        (student) =>
          student.onboardingCompleted ===
            true ||
          String(
            student.onboardingCompleted
          ).toLowerCase() ===
            'true'
      ).length,

    totalDemoBookings:
      demos.length,

    pendingDemoBookings:
      demos.filter(
        (demo) =>
          !demo.status ||
          demo.status ===
            'REQUEST RECEIVED' ||
          demo.status ===
            'PENDING'
      ).length,

    totalCoursePurchases:
      purchases.length,

    paidCoursePurchases:
      purchases.filter(
        (purchase) =>
          String(
            purchase.paymentStatus
          ).toUpperCase() ===
          'PAID'
      ).length,
  };
}

/* =========================================================
   EXPORTS
========================================================= */

export {
  EXCEL_FILE,
  DATA_DIR,
  STUDENTS_SHEET,
  DEMOS_SHEET,
  COURSE_PURCHASES_SHEET,
  COURSE_PROGRESS_SHEET,
};