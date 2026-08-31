import * as XLSX from 'xlsx';
import { getRows } from '@/lib/googleSheets';

export async function generateEduPathExcelBuffer(filterType: 'all' | 'today' | 'upcoming' = 'all'): Promise<{ buffer: Buffer; fileName: string }> {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `EduPath_Export_${dateStr}.xlsx`;

  // 1. Students Sheet
  const studentRows = await getRows('Students');
  const students = studentRows as any[];
  const wsStudents = XLSX.utils.json_to_sheet(
    students.map(s => ({
      'Student ID': s.studentId,
      'Full Name': s.name,
      'Email': s.email,
      'Mobile': s.mobile,
      'Education': s.educationLevel,
      'Stream': s.stream,
      'State': s.state,
      'City': s.city,
      '10th Marks': s.marks10th,
      '12th Marks': s.marks12th,
      'Registration Date': s.registrationDate,
    }))
  );
  formatSheet(wsStudents);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');

  // 2. Demo Bookings Sheet
  const demoRows = await getRows('DemoBookings');
  let demoBookings = demoRows as any[];
  if (filterType === 'today') {
    demoBookings = demoBookings.filter(b => b.preferredDate === dateStr);
  } else if (filterType === 'upcoming') {
    demoBookings = demoBookings.filter(b => b.preferredDate >= dateStr);
  }
  const wsDemo = XLSX.utils.json_to_sheet(
    demoBookings.map(b => ({
      'Booking ID': b.bookingId,
      'Student ID': b.studentId,
      'Student Name': b.name,
      'Email': b.email,
      'Mobile': b.mobile,
      'Interested Course': b.interestedCourse,
      'Counselling Mode': b.counsellingMode,
      'Preferred Date': b.preferredDate,
      'Preferred Time Slot': b.preferredTimeSlot,
      'Registration Date': b.registrationDate,
      'Status': b.status,
      'Assigned Counsellor': b.counsellor || 'Unassigned',
      'Notes': b.notes || '',
    }))
  );
  formatSheet(wsDemo);
  XLSX.utils.book_append_sheet(wb, wsDemo, 'Demo Bookings');

  // 3. Leads Sheet
  const leadRows = await getRows('Leads');
  const leads = leadRows as any[];
  const wsLeads = XLSX.utils.json_to_sheet(
    leads.map(l => ({
      'Lead ID': l.leadId,
      'Student ID': l.studentId,
      'Student Name': l.name,
      'Email': l.email,
      'Mobile': l.mobile,
      'Education': l.educationLevel,
      'Stream': l.stream,
      'State': l.state,
      'City': l.city,
      'Interested Course': l.interestedCourse,
      'Career Goal': l.careerGoal,
      'Entrance Exam': l.entranceExam,
      'Counselling Mode': l.counsellingMode,
      'Preferred Date': l.preferredDate,
      'Preferred Time Slot': l.preferredTimeSlot,
      'Registration Date': l.registrationDate,
      'Lead Source': l.leadSource,
      'Status': l.status,
      'Assigned Counsellor': l.counsellor,
      'Notes': l.notes,
      'Sheets Sync Status': l.sheetsSyncStatus,
    }))
  );
  formatSheet(wsLeads);
  XLSX.utils.book_append_sheet(wb, wsLeads, 'Leads');

  // 4. Counselling Sheet
  const counsellingRows = await getRows('Counselling');
  const counselling = counsellingRows as any[];
  const wsCounselling = XLSX.utils.json_to_sheet(
    counselling.map(c => ({
      'Session ID': c.sessionId,
      'Student ID': c.studentId,
      'Student Name': c.name,
      'Preferred Slot': c.preferredSlot,
      'Counsellor': c.counsellor,
      'Mode': c.mode,
      'Session Notes': c.notes,
      'Outcome': c.outcome,
      'Date': c.date,
    }))
  );
  formatSheet(wsCounselling);
  XLSX.utils.book_append_sheet(wb, wsCounselling, 'Counselling');

  // 5. Notification Logs Sheet
  const notifRows = await getRows('NotificationLogs');
  const notifications = notifRows as any[];
  const wsNotif = XLSX.utils.json_to_sheet(
    notifications.map(n => ({
      'Log ID': n.id,
      'Target Type': n.targetType,
      'Recipient': n.recipient,
      'Message Snippet': n.messageSnippet,
      'Delivery Status': n.status,
      'Provider': n.provider,
      'Timestamp': n.timestamp,
      'Error Details': n.errorDetail || 'N/A',
    }))
  );
  formatSheet(wsNotif);
  XLSX.utils.book_append_sheet(wb, wsNotif, 'Notification Logs');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return { buffer, fileName };
}

function formatSheet(ws: XLSX.WorkSheet) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  const colWidths: number[] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLen = 12;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && cell.v) {
        const valStr = String(cell.v);
        if (valStr.length > maxLen) {
          maxLen = Math.min(valStr.length, 50);
        }
      }
    }
    colWidths.push(maxLen + 3);
  }
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
}



