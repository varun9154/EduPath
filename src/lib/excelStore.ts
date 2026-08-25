import { leadStore, StudentRecord as CoreStudentRecord, DemoBookingRecord } from '@/lib/storage';
import { EXCEL_FILE } from '@/lib/excelPersistence';
import * as XLSX from 'xlsx';
import fs from 'fs';

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
  registeredAt: string;
  updatedAt: string;
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

function readWorkbook() {
  if (!fs.existsSync(EXCEL_FILE)) return XLSX.utils.book_new();
  return XLSX.readFile(EXCEL_FILE);
}

function readRows<T>(sheet: string): T[] {
  const wb = readWorkbook();
  return wb.Sheets[sheet] ? XLSX.utils.sheet_to_json<T>(wb.Sheets[sheet], { defval: '' }) : [];
}

function writeRows<T>(sheet: string, rows: T[]) {
  const wb = readWorkbook();
  wb.Sheets[sheet] = XLSX.utils.json_to_sheet(rows);
  if (!wb.SheetNames.includes(sheet)) wb.SheetNames.push(sheet);
  XLSX.writeFile(wb, EXCEL_FILE);
}

export function getStudents(): StudentRecord[] { return leadStore.getStudents() as StudentRecord[]; }
export function findStudentByEmail(email: string): StudentRecord | null { return leadStore.getStudentByEmail(email) as StudentRecord | null; }
export function findStudentById(id: string): StudentRecord | null { return leadStore.getStudentById(id) as StudentRecord | null; }
export function createStudent(student: StudentRecord) { return leadStore.addStudent(student as CoreStudentRecord) as StudentRecord; }
export function updateStudent(studentId: string, updates: Partial<StudentRecord>) {
  const students = getStudents();
  const index = students.findIndex(s => s.studentId === studentId);
  if (index < 0) return null;
  students[index] = { ...students[index], ...updates, updatedAt: new Date().toISOString() };
  writeRows('Students', students);
  return students[index];
}

export function getDemoBookings(): DemoBooking[] {
  return leadStore.getDemoBookings().map((b) => ({
    bookingId: String(b.bookingId),
    studentId: String(b.studentId || ''),
    name: String(b.name || ''),
    email: String(b.email || ''),
    phone: String(b.mobile || ''),
    mobile: String(b.mobile || ''),
    interestedCourse: String(b.interestedCourse || ''),
    counsellingMode: String(b.counsellingMode || ''),
    preferredDate: String(b.preferredDate || ''),
    preferredTimeSlot: String(b.preferredTimeSlot || ''),
    status: String(b.status || 'REQUEST RECEIVED'),
    counsellor: b.counsellor ? String(b.counsellor) : undefined,
    createdAt: String(b.registrationDate || ''),
    updatedAt: String(b.registrationDate || ''),
  }));
}

export function getStudentDemoBookings(studentId: string) {
  return getDemoBookings().filter((b) => b.studentId === studentId);
}

export function createDemoBooking(booking: DemoBooking) {
  const record: DemoBookingRecord = {
    bookingId: booking.bookingId,
    studentId: booking.studentId || '',
    name: booking.name,
    email: booking.email,
    mobile: booking.mobile || booking.phone || '',
    interestedCourse: booking.interestedCourse || '',
    counsellingMode: booking.counsellingMode || '',
    preferredDate: booking.preferredDate || '',
    preferredTimeSlot: booking.preferredTimeSlot || '',
    registrationDate: booking.createdAt || new Date().toISOString(),
    status: (booking.status || 'REQUEST RECEIVED') as DemoBookingRecord['status'],
    counsellor: booking.counsellor,
  };
  const created = leadStore.addDemoBooking(record);
  return {
    ...booking,
    mobile: created.mobile,
    phone: created.mobile,
    createdAt: created.registrationDate,
    updatedAt: created.registrationDate,
  };
}

export function getCoursePurchases(): CoursePurchase[] { return readRows<CoursePurchase>('CoursePurchases'); }
export function getStudentCoursePurchases(studentId: string) { return getCoursePurchases().filter(p => p.studentId === studentId); }
export function findCoursePurchase(studentId: string, courseId: string) { return getCoursePurchases().find(p => p.studentId === studentId && p.courseId === courseId) || null; }
export function createCoursePurchase(purchase: CoursePurchase) {
  const existing = findCoursePurchase(purchase.studentId, purchase.courseId);
  if (existing) return existing;
  const rows = getCoursePurchases(); rows.unshift(purchase); writeRows('CoursePurchases', rows); return purchase;
}

export function getCourseProgress(): CourseProgress[] { return readRows<CourseProgress>('CourseProgress'); }
export function getStudentCourseProgress(studentId: string) { return getCourseProgress().filter(p => p.studentId === studentId); }
export function findCourseProgress(studentId: string, courseId: string) { return getCourseProgress().find(p => p.studentId === studentId && p.courseId === courseId) || null; }
export function createCourseProgress(progress: CourseProgress) {
  const existing = findCourseProgress(progress.studentId, progress.courseId);
  if (existing) return existing;
  const rows = getCourseProgress(); rows.unshift(progress); writeRows('CourseProgress', rows); return progress;
}
export function updateCourseProgress(progressId: string, updates: Partial<CourseProgress>) {
  const rows = getCourseProgress(); const index = rows.findIndex(p => p.progressId === progressId); if (index < 0) return null;
  rows[index] = { ...rows[index], ...updates, updatedAt: new Date().toISOString() }; writeRows('CourseProgress', rows); return rows[index];
}

export function getStudentStatistics(studentId: string) {
  const purchases = getStudentCoursePurchases(studentId);
  const progress = getStudentCourseProgress(studentId);
  return { purchasedCourses: purchases.length, activeCourses: purchases.filter(p => p.status === 'ACTIVE').length, averageProgress: progress.length ? Math.round(progress.reduce((sum, p) => sum + Number(p.progressPercent || 0), 0) / progress.length) : 0 };
}
