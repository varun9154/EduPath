import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const DATA_DIR = process.env.VERCEL === '1'
  ? path.join('/tmp', 'edupath-excel')
  : path.join(process.cwd(), 'src', 'data', 'excel');

export const EXCEL_FILE = path.join(DATA_DIR, 'edupath.xlsx');
const BLOB_PATH = process.env.EDUPATH_EXCEL_BLOB_PATH || 'edupath/edupath.xlsx';
const BLOB_BASE = 'https://blob.vercel-storage.com';

let prepared = false;
let lastRemoteEtag: string | null = null;

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function ensureLocalDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function createEmptyWorkbook() {
  const wb = XLSX.utils.book_new();
  for (const name of ['Students', 'DemoBookings', 'Leads', 'Counselling', 'Notifications', 'AuditLogs', 'TimeSlots', 'CoursePurchases', 'CourseProgress']) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), name);
  }
  XLSX.writeFile(wb, EXCEL_FILE);
}

function localWorkbookBuffer(): Buffer {
  ensureLocalDir();
  if (!fs.existsSync(EXCEL_FILE)) createEmptyWorkbook();
  return fs.readFileSync(EXCEL_FILE);
}

async function blobRequest(pathname: string, init: RequestInit = {}) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  const url = `${BLOB_BASE}/${pathname.replace(/^\//, '')}`;
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('x-api-version', '7');
  headers.set('access', 'private');
  return fetch(url, { ...init, headers, cache: 'no-store' });
}

async function downloadRemote(): Promise<{ found: boolean; buffer?: Buffer; etag?: string }> {
  const response = await blobRequest(BLOB_PATH, { method: 'GET' });
  if (response.status === 404) return { found: false };
  if (!response.ok) throw new Error(`Excel Blob download failed (${response.status}).`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { found: true, buffer, etag: response.headers.get('etag') || undefined };
}

async function uploadRemote(buffer: Buffer, etag?: string | null) {
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`);
  headers.set('x-api-version', '7');
  headers.set('access', 'private');
  headers.set('x-content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  headers.set('x-add-random-suffix', '0');
  headers.set('x-allow-overwrite', '1');
  headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  if (etag) headers.set('x-if-match', etag);

  const response = await fetch(`${BLOB_BASE}/${BLOB_PATH}`, {
    method: 'PUT',
    headers,
    body: new Uint8Array(buffer),
    cache: 'no-store',
  });

  if (response.status === 412 || response.status === 409) {
    const error = new Error('EXCEL_BLOB_CONFLICT');
    (error as Error & { code?: string }).code = 'EXCEL_BLOB_CONFLICT';
    throw error;
  }
  if (!response.ok) throw new Error(`Excel Blob upload failed (${response.status}).`);
  return response.headers.get('etag');
}

function keyForRow(row: Record<string, unknown>): string | null {
  for (const field of ['studentId', 'bookingId', 'leadId', 'sessionId', 'purchaseId', 'progressId', 'id', 'slotId']) {
    const value = row[field];
    if (value !== undefined && value !== null && String(value)) return `${field}:${String(value)}`;
  }
  return null;
}

function mergeWorkbookBuffers(localBuffer: Buffer, remoteBuffer: Buffer): Buffer {
  const local = XLSX.read(localBuffer);
  const remote = XLSX.read(remoteBuffer);
  const names = Array.from(new Set([...remote.SheetNames, ...local.SheetNames]));

  for (const name of names) {
    const remoteRows = remote.Sheets[name]
      ? XLSX.utils.sheet_to_json<Record<string, unknown>>(remote.Sheets[name], { defval: '' })
      : [];
    const localRows = local.Sheets[name]
      ? XLSX.utils.sheet_to_json<Record<string, unknown>>(local.Sheets[name], { defval: '' })
      : [];

    const merged = [...remoteRows];
    const indexes = new Map<string, number>();
    merged.forEach((row, index) => {
      const key = keyForRow(row);
      if (key) indexes.set(key, index);
    });

    for (const row of localRows) {
      const key = keyForRow(row);
      if (key && indexes.has(key)) merged[indexes.get(key)!] = row;
      else merged.push(row);
    }

    local.Sheets[name] = XLSX.utils.json_to_sheet(merged);
    if (!local.SheetNames.includes(name)) local.SheetNames.push(name);
  }

  return XLSX.write(local, { type: 'buffer', bookType: 'xlsx' });
}

export async function prepareExcelStore(): Promise<void> {
  if (prepared) return;
  ensureLocalDir();

  if (!hasBlobStorage()) {
    if (!fs.existsSync(EXCEL_FILE)) createEmptyWorkbook();
    prepared = true;
    return;
  }

  const remote = await downloadRemote();
  if (remote.found && remote.buffer) {
    fs.writeFileSync(EXCEL_FILE, remote.buffer);
    lastRemoteEtag = remote.etag || null;
  } else {
    const local = localWorkbookBuffer();
    lastRemoteEtag = await uploadRemote(local, null);
  }
  prepared = true;
}

export async function persistExcelStore(): Promise<void> {
  if (!hasBlobStorage()) return;
  if (!fs.existsSync(EXCEL_FILE)) return;

  let local = fs.readFileSync(EXCEL_FILE);
  let etag = lastRemoteEtag;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      etag = await uploadRemote(local, etag);
      lastRemoteEtag = etag || null;
      prepared = false;
      return;
    } catch (error) {
      if (!(error instanceof Error) || (error as Error & { code?: string }).code !== 'EXCEL_BLOB_CONFLICT') throw error;
      const latest = await downloadRemote();
      if (!latest.found || !latest.buffer) throw new Error('Excel Blob disappeared during concurrent write.');
      const merged = mergeWorkbookBuffers(local, latest.buffer);
      local = Buffer.from(merged);
      fs.writeFileSync(EXCEL_FILE, merged);
      etag = latest.etag || null;
      if (attempt === 3) throw new Error('Excel storage is busy. Please retry the operation.');
    }
  }
}

export function resetExcelPersistenceForTests() {
  prepared = false;
  lastRemoteEtag = null;
}
