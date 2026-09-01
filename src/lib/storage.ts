// src/lib/storage.ts

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// ============================================================
// TYPES
// ============================================================

export interface StudentRecord {
  studentId: string;
  name: string;
  email: string;
  mobile: string;

  educationLevel: string;
  stream: string;
  state: string;
  city: string;

  marks10th: string;
  marks12th: string;

  registrationDate: string;

  [key: string]: unknown;
}

export interface DemoBookingRecord {
  bookingId: string;
  studentId: string;

  name: string;
  email: string;
  mobile: string;

  interestedCourse: string;
  counsellingMode: string;

  preferredDate: string;
  preferredTimeSlot: string;

  registrationDate: string;

  status:
    | 'REQUEST RECEIVED'
    | 'CONTACTED'
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'RESCHEDULED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO SHOW'
    | 'FOLLOW UP';

  counsellor?: string;
  notes?: string;

  [key: string]: unknown;
}

export interface LeadRecord {
  leadId: string;
  studentId: string;

  name: string;
  email: string;
  mobile: string;

  educationLevel: string;
  stream: string;

  state: string;
  city: string;

  marks10th: string;
  marks12th: string;

  interestedCourse: string;
  careerGoal: string;
  entranceExam: string;

  counsellingMode: string;
  preferredDate: string;
  preferredTimeSlot: string;

  registrationDate: string;
  leadSource: string;

  status:
    | 'NEW'
    | 'CONTACTED'
    | 'REQUESTED'
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'RESCHEDULED'
    | 'CANCELLED'
    | 'NO SHOW'
    | 'FOLLOW UP';

  counsellor: string;
  notes: string;

  sheetsSyncStatus:
    | 'SYNCED'
    | 'PENDING_SYNC'
    | 'FAILED';

  [key: string]: unknown;
}

export interface CounsellingRecord {
  sessionId: string;
  studentId: string;
  name: string;

  preferredSlot: string;
  counsellor: string;

  mode: string;
  notes: string;
  outcome: string;

  date: string;

  [key: string]: unknown;
}

export interface NotificationLogRecord {
  id: string;

  targetType:
    | 'ADMIN_EMAIL'
    | 'STUDENT_EMAIL'
    | 'ADMIN_WHATSAPP'
    | 'STUDENT_WHATSAPP'
    | 'STUDENT_SMS';

  recipient: string;
  messageSnippet: string;

  status:
    | 'SENT'
    | 'PENDING'
    | 'FAILED'
    | 'DEV_MODE'
    | 'NOT_CONFIGURED';

  provider: string;
  timestamp: string;

  errorDetail?: string;

  [key: string]: unknown;
}

export interface TimeSlotConfig {
  id?: string;
  slotId?: string;

  date?: string;
  day?: string;

  startTime?: string;
  endTime?: string;

  time?: string;
  label?: string;
  slot?: string;
  timeSlot?: string;

  capacity?: number;
  booked?: number;
  available?: number;

  enabled?: boolean;
  active?: boolean;

  status?: string;

  counsellor?: string;
  counsellorId?: string;

  blockedDates?: string[];

  createdAt?: string;
  updatedAt?: string;

  [key: string]: unknown;
}

export interface AuditLogRecord {
  id: string;

  action: string;
  actor: string;

  target?: string;
  details?: string;

  timestamp: string;

  [key: string]: unknown;
}

export interface CounsellorRecord {
  counsellorId: string;
  name: string;
  email: string;
  phone: string;

  specialization: string;
  bio?: string;

  active: boolean;
  availability?: string;

  createdAt: string;
  updatedAt?: string;

  [key: string]: unknown;
}

// ============================================================
// DATA DIRECTORY
// ============================================================
//
// LOCAL:
// C:\Users\tvaru\Desktop\Edupath\src\data\excel
//
// VERCEL:
// Vercel's application directory is not writable.
// /tmp is the writable temporary directory.
//
// ============================================================

const DATA_DIR =
  process.env.VERCEL === '1'
    ? path.join('/tmp', 'edupath-excel')
    : path.join(
        process.cwd(),
        'src',
        'data',
        'excel'
      );

const EXCEL_FILE = path.join(
  DATA_DIR,
  'edupath.xlsx'
);

// ============================================================
// SHEETS
// ============================================================

export const SHEETS = {
  STUDENTS: 'Students',
  DEMOS: 'DemoBookings',
  LEADS: 'Leads',
  COUNSELLING: 'Counselling',
  NOTIFICATIONS: 'Notifications',
  AUDIT: 'AuditLogs',
  TIME_SLOTS: 'TimeSlots',
} as const;

// ============================================================
// DEFAULT TIME SLOTS
// ============================================================

const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  {
    id: 'slot-10-11',
    slotId: 'slot-10-11',
    time: '10:00 AM - 11:00 AM',
    label: '10:00 AM - 11:00 AM',
    slot: '10:00 AM - 11:00 AM',
    timeSlot: '10:00 AM - 11:00 AM',
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  },

  {
    id: 'slot-11-12',
    slotId: 'slot-11-12',
    time: '11:00 AM - 12:00 PM',
    label: '11:00 AM - 12:00 PM',
    slot: '11:00 AM - 12:00 PM',
    timeSlot: '11:00 AM - 12:00 PM',
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  },

  {
    id: 'slot-12-1',
    slotId: 'slot-12-1',
    time: '12:00 PM - 1:00 PM',
    label: '12:00 PM - 1:00 PM',
    slot: '12:00 PM - 1:00 PM',
    timeSlot: '12:00 PM - 1:00 PM',
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  },

  {
    id: 'slot-2-3',
    slotId: 'slot-2-3',
    time: '2:00 PM - 3:00 PM',
    label: '2:00 PM - 3:00 PM',
    slot: '2:00 PM - 3:00 PM',
    timeSlot: '2:00 PM - 3:00 PM',
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  },

  {
    id: 'slot-3-4',
    slotId: 'slot-3-4',
    time: '3:00 PM - 4:00 PM',
    label: '3:00 PM - 4:00 PM',
    slot: '3:00 PM - 4:00 PM',
    timeSlot: '3:00 PM - 4:00 PM',
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  },

  {
    id: 'slot-4-5',
    slotId: 'slot-4-5',
    time: '4:00 PM - 5:00 PM',
    label: '4:00 PM - 5:00 PM',
    slot: '4:00 PM - 5:00 PM',
    timeSlot: '4:00 PM - 5:00 PM',
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  },

  {
    id: 'slot-5-6',
    slotId: 'slot-5-6',
    time: '5:00 PM - 6:00 PM',
    label: '5:00 PM - 6:00 PM',
    slot: '5:00 PM - 6:00 PM',
    timeSlot: '5:00 PM - 6:00 PM',
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  },

  {
    id: 'slot-6-7',
    slotId: 'slot-6-7',
    time: '6:00 PM - 7:00 PM',
    label: '6:00 PM - 7:00 PM',
    slot: '6:00 PM - 7:00 PM',
    timeSlot: '6:00 PM - 7:00 PM',
    capacity: 1,
    booked: 0,
    available: 1,
    enabled: true,
    active: true,
    blockedDates: [],
  },
];

// ============================================================
// FILE INITIALIZATION
// ============================================================

function ensureExcelFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true,
    });
  }

  if (fs.existsSync(EXCEL_FILE)) {
    return;
  }

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([]),
    SHEETS.STUDENTS
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([]),
    SHEETS.DEMOS
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([]),
    SHEETS.LEADS
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([]),
    SHEETS.COUNSELLING
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([]),
    SHEETS.NOTIFICATIONS
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([]),
    SHEETS.AUDIT
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      DEFAULT_TIME_SLOTS
    ),
    SHEETS.TIME_SLOTS
  );

  XLSX.writeFile(
    workbook,
    EXCEL_FILE
  );
}

// ============================================================
// WORKBOOK
// ============================================================

function readWorkbook(): XLSX.WorkBook {
  ensureExcelFile();

  return XLSX.readFile(
    EXCEL_FILE
  );
}

// ============================================================
// READ SHEET
// ============================================================

function readSheet<T>(
  sheetName: string
): T[] {
  const workbook =
    readWorkbook();

  const worksheet =
    workbook.Sheets[sheetName];

  if (!worksheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<T>(
    worksheet,
    {
      defval: '',
    }
  );
}

// ============================================================
// WRITE SHEET
// ============================================================

function writeSheet<T>(
  sheetName: string,
  rows: T[]
): void {
  ensureExcelFile();

  const workbook =
    readWorkbook();

  const worksheet =
    XLSX.utils.json_to_sheet(
      rows
    );

  workbook.Sheets[sheetName] =
    worksheet;

  if (
    !workbook.SheetNames.includes(
      sheetName
    )
  ) {
    workbook.SheetNames.push(
      sheetName
    );
  }

  XLSX.writeFile(
    workbook,
    EXCEL_FILE
  );
}

// ============================================================
// STORAGE MANAGER
// ============================================================

export class ExcelStorageManager {

  // ==========================================================
  // STUDENTS
  // ==========================================================

  getStudents(): StudentRecord[] {
    return readSheet<StudentRecord>(
      SHEETS.STUDENTS
    );
  }

  getStudentByEmail(
    email: string
  ): StudentRecord | null {
    const normalized =
      email
        .trim()
        .toLowerCase();

    return (
      this.getStudents().find(
        (student) =>
          String(
            student.email || ''
          )
            .trim()
            .toLowerCase() ===
          normalized
      ) || null
    );
  }

  getStudentById(
    studentId: string
  ): StudentRecord | null {
    return (
      this.getStudents().find(
        (student) =>
          student.studentId ===
          studentId
      ) || null
    );
  }

  addStudent(
    student: StudentRecord
  ): StudentRecord {
    const students =
      this.getStudents();

    students.unshift(student);

    writeSheet(
      SHEETS.STUDENTS,
      students
    );

    return student;
  }

  // ==========================================================
  // DEMO BOOKINGS
  // ==========================================================

  getDemoBookings():
    DemoBookingRecord[] {
    return readSheet<DemoBookingRecord>(
      SHEETS.DEMOS
    );
  }

  getDemoBookingsByStudent(
    studentId: string
  ): DemoBookingRecord[] {
    return this
      .getDemoBookings()
      .filter(
        (booking) =>
          booking.studentId ===
          studentId
      );
  }

  addDemoBooking(
    booking: DemoBookingRecord
  ): DemoBookingRecord {
    const bookings =
      this.getDemoBookings();

    bookings.unshift(booking);

    writeSheet(
      SHEETS.DEMOS,
      bookings
    );

    return booking;
  }

  updateDemoBooking(
    bookingId: string,
    updates: Partial<DemoBookingRecord>
  ): DemoBookingRecord | null {
    const bookings =
      this.getDemoBookings();

    const index =
      bookings.findIndex(
        (booking) =>
          booking.bookingId ===
          bookingId
      );

    if (index === -1) {
      return null;
    }

    bookings[index] = {
      ...bookings[index],
      ...updates,
    };

    writeSheet(
      SHEETS.DEMOS,
      bookings
    );

    return bookings[index];
  }

  isSlotBooked(
    date: string,
    timeSlot: string
  ): boolean {
    return this
      .getDemoBookings()
      .some(
        (booking) =>
          booking.preferredDate ===
            date &&
          booking.preferredTimeSlot ===
            timeSlot &&
          booking.status !==
            'CANCELLED'
      );
  }

  // ==========================================================
  // LEADS
  // ==========================================================

  getLeads(): LeadRecord[] {
    return readSheet<LeadRecord>(
      SHEETS.LEADS
    );
  }

  getLeadById(
    leadId: string
  ): LeadRecord | null {
    return (
      this.getLeads().find(
        (lead) =>
          lead.leadId ===
          leadId
      ) || null
    );
  }

  addLead(
    lead: LeadRecord
  ): LeadRecord {
    const leads =
      this.getLeads();

    leads.unshift(lead);

    writeSheet(
      SHEETS.LEADS,
      leads
    );

    return lead;
  }

  updateLeadStatus(
    leadId: string,
    status: LeadRecord['status'],
    counsellor?: string,
    notes?: string
  ): LeadRecord | null {
    const leads =
      this.getLeads();

    const index =
      leads.findIndex(
        (lead) =>
          lead.leadId ===
          leadId
      );

    if (index === -1) {
      return null;
    }

    leads[index] = {
      ...leads[index],
      status,

      ...(counsellor !== undefined
        ? { counsellor }
        : {}),

      ...(notes !== undefined
        ? { notes }
        : {}),
    };

    writeSheet(
      SHEETS.LEADS,
      leads
    );

    return leads[index];
  }

  // ==========================================================
  // GOOGLE SHEETS SYNC
  // ==========================================================

  getPendingSyncLeads():
    LeadRecord[] {
    return this
      .getLeads()
      .filter(
        (lead) =>
          lead.sheetsSyncStatus ===
            'PENDING_SYNC' ||
          lead.sheetsSyncStatus ===
            'FAILED'
      );
  }

  // Compatibility alias
  getPendingSyncedLeads():
    LeadRecord[] {
    return this.getPendingSyncLeads();
  }

  markLeadSynced(
    leadId: string
  ): void {
    const leads =
      this.getLeads();

    const index =
      leads.findIndex(
        (lead) =>
          lead.leadId ===
          leadId
      );

    if (index === -1) {
      return;
    }

    leads[index] = {
      ...leads[index],
      sheetsSyncStatus:
        'SYNCED',
    };

    writeSheet(
      SHEETS.LEADS,
      leads
    );
  }

  markLeadSyncFailed(
    leadId: string
  ): void {
    const leads =
      this.getLeads();

    const index =
      leads.findIndex(
        (lead) =>
          lead.leadId ===
          leadId
      );

    if (index === -1) {
      return;
    }

    leads[index] = {
      ...leads[index],
      sheetsSyncStatus:
        'FAILED',
    };

    writeSheet(
      SHEETS.LEADS,
      leads
    );
  }

  // ==========================================================
  // TIME SLOTS
  // ==========================================================

  getTimeSlots(): TimeSlotConfig[] {
    let slots =
      readSheet<TimeSlotConfig>(
        SHEETS.TIME_SLOTS
      );

    if (slots.length === 0) {
      slots =
        DEFAULT_TIME_SLOTS.map(
          (slot) => ({
            ...slot,
            blockedDates:
              slot.blockedDates || [],
          })
        );

      writeSheet(
        SHEETS.TIME_SLOTS,
        slots
      );
    }

    return slots;
  }

  getTimeSlotById(
    slotId: string
  ): TimeSlotConfig | null {
    return (
      this
        .getTimeSlots()
        .find(
          (slot) =>
            slot.id === slotId ||
            slot.slotId === slotId
        ) || null
    );
  }

  updateTimeSlot(
    slotId: string,
    enabledOrUpdates:
      | boolean
      | Partial<TimeSlotConfig>,
    blockDate?: string
  ): TimeSlotConfig | null {

    const slots =
      this.getTimeSlots();

    const index =
      slots.findIndex(
        (slot) =>
          slot.id === slotId ||
          slot.slotId === slotId
      );

    if (index === -1) {
      return null;
    }

    let updates:
      Partial<TimeSlotConfig>;

    // --------------------------------------------------------
    // 3 argument format
    // updateTimeSlot(slotId, enabled, blockDate)
    // --------------------------------------------------------

    if (
      typeof enabledOrUpdates ===
      'boolean'
    ) {
      const existingBlockedDates =
        Array.isArray(
          slots[index].blockedDates
        )
          ? [
              ...(slots[index]
                .blockedDates || []),
            ]
          : [];

      const blockedDates =
        existingBlockedDates;

      if (
        blockDate &&
        !blockedDates.includes(
          blockDate
        )
      ) {
        blockedDates.push(
          blockDate
        );
      }

      updates = {
        enabled:
          enabledOrUpdates,

        active:
          enabledOrUpdates,

        blockedDates,
      };
    } else {
      // ------------------------------------------------------
      // Object format
      // updateTimeSlot(slotId, { enabled: true })
      // ------------------------------------------------------

      updates =
        enabledOrUpdates;
    }

    slots[index] = {
      ...slots[index],
      ...updates,

      updatedAt:
        new Date().toISOString(),
    };

    // Keep enabled and active synchronized.
    if (
      typeof updates.enabled ===
      'boolean'
    ) {
      slots[index].active =
        updates.enabled;
    }

    // Recalculate availability.
    const capacity =
      Number(
        slots[index].capacity ?? 0
      );

    const booked =
      Number(
        slots[index].booked ?? 0
      );

    if (capacity > 0) {
      slots[index].available =
        Math.max(
          0,
          capacity - booked
        );
    }

    writeSheet(
      SHEETS.TIME_SLOTS,
      slots
    );

    return slots[index];
  }

  setTimeSlotEnabled(
    slotId: string,
    enabled: boolean
  ): TimeSlotConfig | null {
    return this.updateTimeSlot(
      slotId,
      enabled
    );
  }

  blockTimeSlotDate(
    slotId: string,
    date: string
  ): TimeSlotConfig | null {

    const slot =
      this.getTimeSlotById(
        slotId
      );

    if (!slot) {
      return null;
    }

    const blockedDates =
      Array.isArray(
        slot.blockedDates
      )
        ? [
            ...slot.blockedDates,
          ]
        : [];

    if (
      !blockedDates.includes(
        date
      )
    ) {
      blockedDates.push(
        date
      );
    }

    return this.updateTimeSlot(
      slotId,
      {
        blockedDates,
      }
    );
  }

  unblockTimeSlotDate(
    slotId: string,
    date: string
  ): TimeSlotConfig | null {

    const slot =
      this.getTimeSlotById(
        slotId
      );

    if (!slot) {
      return null;
    }

    const blockedDates =
      Array.isArray(
        slot.blockedDates
      )
        ? slot.blockedDates.filter(
            (item) =>
              item !== date
          )
        : [];

    return this.updateTimeSlot(
      slotId,
      {
        blockedDates,
      }
    );
  }

  addCustomTimeSlot(
    timeSlot: string,
    capacity: number = 1
  ): TimeSlotConfig {

    const slots =
      this.getTimeSlots();

    const id =
      `slot-${Date.now()}`;

    const newSlot:
      TimeSlotConfig = {
      id,
      slotId: id,

      time: timeSlot,
      label: timeSlot,
      slot: timeSlot,
      timeSlot,

      capacity,
      booked: 0,
      available: capacity,

      enabled: true,
      active: true,

      blockedDates: [],

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    };

    slots.push(
      newSlot
    );

    writeSheet(
      SHEETS.TIME_SLOTS,
      slots
    );

    return newSlot;
  }

  removeTimeSlot(
    slotId: string
  ): boolean {

    const slots =
      this.getTimeSlots();

    const filtered =
      slots.filter(
        (slot) =>
          slot.id !== slotId &&
          slot.slotId !== slotId
      );

    if (
      filtered.length ===
      slots.length
    ) {
      return false;
    }

    writeSheet(
      SHEETS.TIME_SLOTS,
      filtered
    );

    return true;
  }

  // ==========================================================
  // COUNSELLING
  // ==========================================================

  getCounsellingRecords():
    CounsellingRecord[] {
    return readSheet<CounsellingRecord>(
      SHEETS.COUNSELLING
    );
  }

  addCounsellingRecord(
    record: CounsellingRecord
  ): CounsellingRecord {

    const records =
      this.getCounsellingRecords();

    records.unshift(
      record
    );

    writeSheet(
      SHEETS.COUNSELLING,
      records
    );

    return record;
  }

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  getNotificationLogs():
    NotificationLogRecord[] {
    return readSheet<NotificationLogRecord>(
      SHEETS.NOTIFICATIONS
    );
  }

  addNotificationLog(
    log: NotificationLogRecord
  ): NotificationLogRecord {

    const logs =
      this.getNotificationLogs();

    logs.unshift(log);

    writeSheet(
      SHEETS.NOTIFICATIONS,
      logs
    );

    return log;
  }

  // ==========================================================
  // AUDIT LOGS
  // ==========================================================

  getAuditLogs():
    AuditLogRecord[] {
    return readSheet<AuditLogRecord>(
      SHEETS.AUDIT
    );
  }

  addAuditLog(
    log: AuditLogRecord
  ): AuditLogRecord {

    const logs =
      this.getAuditLogs();

    logs.unshift(log);

    writeSheet(
      SHEETS.AUDIT,
      logs
    );

    return log;
  }

  // ==========================================================
  // DASHBOARD DATA
  // ==========================================================

  getDashboardData() {

    const students =
      this.getStudents();

    const demos =
      this.getDemoBookings();

    const leads =
      this.getLeads();

    const notifications =
      this.getNotificationLogs();

    const auditLogs =
      this.getAuditLogs();

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const todayRegistrations =
      students.filter(
        (student) =>
          String(
            student.registrationDate ||
              ''
          ).slice(0, 10) ===
          today
      ).length;

    const todayBookings =
      demos.filter(
        (booking) =>
          String(
            booking.registrationDate ||
              ''
          ).slice(0, 10) ===
          today
      ).length;

    const activeBookings =
      demos.filter(
        (booking) =>
          ![
            'CANCELLED',
            'COMPLETED',
          ].includes(
            booking.status
          )
      ).length;

    const completedBookings =
      demos.filter(
        (booking) =>
          booking.status ===
          'COMPLETED'
      ).length;

    const cancelledBookings =
      demos.filter(
        (booking) =>
          booking.status ===
          'CANCELLED'
      ).length;

    const pendingSync =
      leads.filter(
        (lead) =>
          lead.sheetsSyncStatus ===
            'PENDING_SYNC' ||
          lead.sheetsSyncStatus ===
            'FAILED'
      ).length;

    return {
      stats: {
        totalStudents:
          students.length,

        totalDemoBookings:
          demos.length,

        activeDemoBookings:
          activeBookings,

        completedDemoBookings:
          completedBookings,

        cancelledDemoBookings:
          cancelledBookings,

        totalLeads:
          leads.length,

        pendingSyncCount:
          pendingSync,

        totalNotifications:
          notifications.length,

        todayRegistrations,

        todayBookings,
      },

      students,

      demoBookings:
        demos,

      leads,

      notifications:
        notifications.slice(
          0,
          50
        ),

      auditLogs:
        auditLogs.slice(
          0,
          50
        ),

      timeSlots:
        this.getTimeSlots(),
    };
  }
}

// ============================================================
// SINGLETON
// ============================================================

const globalStorage =
  globalThis as typeof globalThis & {
    __edupathExcelStorage?:
      ExcelStorageManager;
  };

export const leadStore =
  globalStorage
    .__edupathExcelStorage ??
  new ExcelStorageManager();

if (
  process.env.NODE_ENV !==
  'production'
) {
  globalStorage
    .__edupathExcelStorage =
    leadStore;
}

// ============================================================
// COMPATIBILITY EXPORT
// ============================================================
//
// Some API files use getExcelStorage().
// Keep this function so those imports continue to work.
//

export function getExcelStorage():
  ExcelStorageManager {
  return leadStore;
}

// ============================================================
// EXPORT PATHS
// ============================================================

export {
  DATA_DIR,
  EXCEL_FILE,
};