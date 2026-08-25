import * as XLSX from 'xlsx';
import fs from 'fs';
import { EXCEL_FILE, prepareExcelStore } from '@/lib/excelPersistence';

export async function generateEduPathExcelBuffer(_filterType: 'all' | 'today' | 'upcoming' = 'all'): Promise<{ buffer: Buffer; fileName: string }> {
  await prepareExcelStore();
  if (!fs.existsSync(EXCEL_FILE)) throw new Error('EduPath Excel workbook is not available.');
  const buffer = fs.readFileSync(EXCEL_FILE);
  const dateStr = new Date().toISOString().slice(0, 10);
  return { buffer, fileName: `EduPath_Export_${dateStr}.xlsx` };
}
