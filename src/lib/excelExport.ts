import * as XLSX from 'xlsx';
import fs from 'fs';

import { EXCEL_FILE, prepareExcelStore } from '@/lib/excelPersistence';
import {
  getStudents,
  getDemoBookings,
  getLeads,
  getCounsellingRecords,
  getNotificationLogs,
  getAuditLogs,
  getTimeSlots,
} from '@/lib/productionDb';

function makeWorkbookFromProductionData(data: {
  students: unknown[];
  demoBookings: unknown[];
  leads: unknown[];
  counselling: unknown[];
  notifications: unknown[];
  auditLogs: unknown[];
  timeSlots: unknown[];
}): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheets: Record<string, unknown[]> = {
    Students: data.students,
    DemoBookings: data.demoBookings,
    Leads: data.leads,
    Counselling: data.counselling,
    Notifications: data.notifications,
    AuditLogs: data.auditLogs,
    TimeSlots: data.timeSlots,
  };

  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      name
    );
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export async function generateEduPathExcelBuffer(
  _filterType: 'all' | 'today' | 'upcoming' = 'all'
): Promise<{ buffer: Buffer; fileName: string }> {
  const dateStr = new Date().toISOString().slice(0, 10);

  if (process.env.DATABASE_URL) {
    const [students, demoBookings, leads, counselling, notifications, auditLogs, timeSlots] = await Promise.all([
      getStudents(),
      getDemoBookings(),
      getLeads(),
      getCounsellingRecords(),
      getNotificationLogs(),
      getAuditLogs(),
      getTimeSlots(),
    ]);

    return {
      buffer: makeWorkbookFromProductionData({
        students,
        demoBookings,
        leads,
        counselling,
        notifications,
        auditLogs,
        timeSlots,
      }),
      fileName: `EduPath_Export_${dateStr}.xlsx`,
    };
  }

  await prepareExcelStore();
  if (!fs.existsSync(EXCEL_FILE)) throw new Error('EduPath Excel workbook is not available.');
  const buffer = fs.readFileSync(EXCEL_FILE);
  return { buffer, fileName: `EduPath_Export_${dateStr}.xlsx` };
}
