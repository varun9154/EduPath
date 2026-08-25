import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

/**
 * ============================================================
 * EduPath Production Excel Persistence
 * ============================================================
 *
 * Development:
 *   src/data/excel/edupath.xlsx
 *
 * Vercel:
 *   /tmp/edupath-excel/edupath.xlsx
 *   +
 *   private Vercel Blob persistence
 *
 * IMPORTANT:
 *   /tmp is temporary on Vercel.
 *   Vercel Blob is therefore used as the persistent
 *   source of truth for the Excel workbook.
 *
 * The workbook remains private.
 * ============================================================
 */

/* ------------------------------------------------------------
 * Environment
 * ------------------------------------------------------------ */

const IS_VERCEL =
  process.env.VERCEL === '1';

const DATA_DIR =
  path.join(
    '/tmp',
    'edupath-excel'
  );

const LOCAL_DATA_DIR =
  path.join(
    process.cwd(),
    'src',
    'data',
    'excel'
  );

const RUNTIME_DATA_DIR =
  IS_VERCEL
    ? DATA_DIR
    : LOCAL_DATA_DIR;

export const EXCEL_FILE =
  path.join(
    RUNTIME_DATA_DIR,
    'edupath.xlsx'
  );

const BLOB_PATH =
  process.env.EDUPATH_EXCEL_BLOB_PATH ||
  'edupath/edupath.xlsx';

const BLOB_BASE =
  'https://blob.vercel-storage.com';

const EXCEL_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/* ------------------------------------------------------------
 * Runtime state
 * ------------------------------------------------------------ */

let prepared = false;

let lastRemoteEtag:
  string | null = null;

/**
 * Use Uint8Array internally instead of assigning
 * Node Buffer<ArrayBufferLike> to a narrower Buffer type.
 *
 * This avoids the Node 22 TypeScript incompatibility:
 *
 * Buffer<ArrayBufferLike>
 *        vs
 * NonSharedBuffer / ArrayBuffer
 */
type WorkbookBytes = Uint8Array;

/* ------------------------------------------------------------
 * Production storage validation
 * ------------------------------------------------------------ */

/**
 * Returns whether production Excel persistence is available.
 *
 * Local:
 *   Always true.
 *
 * Vercel:
 *   BLOB_READ_WRITE_TOKEN is required.
 */
export function hasProductionExcelStorage(): boolean {
  return (
    !IS_VERCEL ||
    Boolean(
      process.env.BLOB_READ_WRITE_TOKEN
    )
  );
}

/**
 * Fail early with a useful production configuration error.
 */
export function assertProductionExcelStorage(): void {
  if (
    IS_VERCEL &&
    !process.env.BLOB_READ_WRITE_TOKEN
  ) {
    throw new Error(
      'EDUPATH_STORAGE_NOT_CONFIGURED: Add a private Vercel Blob store and set BLOB_READ_WRITE_TOKEN before accepting production registrations.'
    );
  }
}

/* ------------------------------------------------------------
 * Local filesystem
 * ------------------------------------------------------------ */

function ensureLocalDir(): void {
  fs.mkdirSync(
    RUNTIME_DATA_DIR,
    {
      recursive: true,
    }
  );
}

/* ------------------------------------------------------------
 * Empty workbook
 * ------------------------------------------------------------ */

function createEmptyWorkbook(): void {
  ensureLocalDir();

  const workbook =
    XLSX.utils.book_new();

  const sheets = [
    'Students',
    'DemoBookings',
    'Leads',
    'Counselling',
    'Notifications',
    'AuditLogs',
    'CoursePurchases',
    'CourseProgress',
  ];

  for (
    const sheetName of sheets
  ) {
    const worksheet =
      XLSX.utils.json_to_sheet([]);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName
    );
  }

  /*
   * Default counselling slots.
   */
  const timeSlots = [
    {
      slotId: 'slot-10-11',
      time: '10:00 AM - 11:00 AM',
      capacity: 1,
      booked: 0,
      available: 1,
      enabled: true,
    },
    {
      slotId: 'slot-11-12',
      time: '11:00 AM - 12:00 PM',
      capacity: 1,
      booked: 0,
      available: 1,
      enabled: true,
    },
    {
      slotId: 'slot-12-1',
      time: '12:00 PM - 1:00 PM',
      capacity: 1,
      booked: 0,
      available: 1,
      enabled: true,
    },
    {
      slotId: 'slot-2-3',
      time: '2:00 PM - 3:00 PM',
      capacity: 1,
      booked: 0,
      available: 1,
      enabled: true,
    },
    {
      slotId: 'slot-3-4',
      time: '3:00 PM - 4:00 PM',
      capacity: 1,
      booked: 0,
      available: 1,
      enabled: true,
    },
    {
      slotId: 'slot-4-5',
      time: '4:00 PM - 5:00 PM',
      capacity: 1,
      booked: 0,
      available: 1,
      enabled: true,
    },
    {
      slotId: 'slot-5-6',
      time: '5:00 PM - 6:00 PM',
      capacity: 1,
      booked: 0,
      available: 1,
      enabled: true,
    },
    {
      slotId: 'slot-6-7',
      time: '6:00 PM - 7:00 PM',
      capacity: 1,
      booked: 0,
      available: 1,
      enabled: true,
    },
  ];

  const timeSlotSheet =
    XLSX.utils.json_to_sheet(
      timeSlots
    );

  XLSX.utils.book_append_sheet(
    workbook,
    timeSlotSheet,
    'TimeSlots'
  );

  XLSX.writeFile(
    workbook,
    EXCEL_FILE
  );
}

/* ------------------------------------------------------------
 * Local workbook bytes
 * ------------------------------------------------------------ */

function localWorkbookBytes(): WorkbookBytes {
  ensureLocalDir();

  if (
    !fs.existsSync(
      EXCEL_FILE
    )
  ) {
    createEmptyWorkbook();
  }

  /*
   * Explicitly create a Uint8Array.
   *
   * Do NOT use:
   *
   * let local: Buffer
   *
   * here.
   */
  return new Uint8Array(
    fs.readFileSync(
      EXCEL_FILE
    )
  );
}

/* ------------------------------------------------------------
 * Vercel Blob request helper
 * ------------------------------------------------------------ */

async function blobRequest(
  pathname: string,
  init: RequestInit = {}
): Promise<Response> {
  assertProductionExcelStorage();

  const token =
    process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not configured.'
    );
  }

  const normalizedPath =
    pathname.replace(
      /^\/+/,
      ''
    );

  const url =
    `${BLOB_BASE}/${normalizedPath}`;

  const headers =
    new Headers(
      init.headers
    );

  headers.set(
    'Authorization',
    `Bearer ${token}`
  );

  headers.set(
    'x-api-version',
    '7'
  );

  /*
   * Keep workbook private.
   */
  headers.set(
    'access',
    'private'
  );

  return fetch(
    url,
    {
      ...init,
      headers,
      cache: 'no-store',
    }
  );
}

/* ------------------------------------------------------------
 * Remote workbook
 * ------------------------------------------------------------ */

interface RemoteWorkbook {
  found: boolean;
  buffer?: WorkbookBytes;
  etag?: string;
}

/* ------------------------------------------------------------
 * Download workbook from Vercel Blob
 * ------------------------------------------------------------ */

async function downloadRemote(): Promise<RemoteWorkbook> {
  const response =
    await blobRequest(
      BLOB_PATH,
      {
        method: 'GET',
      }
    );

  /*
   * Blob doesn't exist yet.
   */
  if (
    response.status === 404
  ) {
    return {
      found: false,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Excel Blob download failed (${response.status}).`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  /*
   * Convert directly to Uint8Array.
   *
   * This prevents Buffer generic incompatibility.
   */
  const buffer =
    new Uint8Array(
      arrayBuffer
    );

  return {
    found: true,
    buffer,
    etag:
      response.headers.get(
        'etag'
      ) || undefined,
  };
}

/* ------------------------------------------------------------
 * Upload workbook to Vercel Blob
 * ------------------------------------------------------------ */

async function uploadRemote(
  buffer: WorkbookBytes,
  etag?: string | null
): Promise<string | null> {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not configured.'
    );
  }

  const headers =
    new Headers();

  headers.set(
    'Authorization',
    `Bearer ${token}`
  );

  headers.set(
    'x-api-version',
    '7'
  );

  headers.set(
    'access',
    'private'
  );

  headers.set(
    'x-content-type',
    EXCEL_CONTENT_TYPE
  );

  headers.set(
    'x-add-random-suffix',
    '0'
  );

  headers.set(
    'x-allow-overwrite',
    '1'
  );

  headers.set(
    'Content-Type',
    EXCEL_CONTENT_TYPE
  );

  /*
   * Optimistic concurrency.
   */
  if (etag) {
    headers.set(
      'x-if-match',
      etag
    );
  }

  /*
   * Uint8Array is used as the fetch body.
   */
  const body =
    new Uint8Array(
      buffer
    );

  const response =
    await fetch(
      `${BLOB_BASE}/${BLOB_PATH}`,
      {
        method: 'PUT',
        headers,
        body,
        cache: 'no-store',
      }
    );

  /*
   * Concurrent update.
   */
  if (
    response.status === 409 ||
    response.status === 412
  ) {
    const error =
      new Error(
        'EXCEL_BLOB_CONFLICT'
      ) as Error & {
        code?: string;
      };

    error.code =
      'EXCEL_BLOB_CONFLICT';

    throw error;
  }

  if (!response.ok) {
    throw new Error(
      `Excel Blob upload failed (${response.status}).`
    );
  }

  return (
    response.headers.get(
      'etag'
    )
  );
}

/* ------------------------------------------------------------
 * Row identity
 * ------------------------------------------------------------ */

function keyForRow(
  row: Record<string, unknown>
): string | null {
  const identityFields = [
    'studentId',
    'bookingId',
    'leadId',
    'sessionId',
    'purchaseId',
    'progressId',
    'id',
    'slotId',
  ];

  for (
    const field of identityFields
  ) {
    const value =
      row[field];

    if (
      value !== undefined &&
      value !== null &&
      String(value)
    ) {
      return (
        `${field}:${String(value)}`
      );
    }
  }

  return null;
}

/* ------------------------------------------------------------
 * Workbook merge
 * ------------------------------------------------------------ */

/**
 * Merge local and remote workbook bytes.
 *
 * Remote workbook is treated as the latest persisted copy.
 *
 * Local rows are merged into it.
 *
 * Same identity:
 *   local row replaces remote row.
 *
 * No identity:
 *   append only when it is not an exact duplicate.
 *
 * Returns Uint8Array rather than Buffer.
 *
 * This is the important Node 22 TypeScript fix.
 */
function mergeWorkbookBuffers(
  localBuffer: WorkbookBytes,
  remoteBuffer: WorkbookBytes
): WorkbookBytes {
  const localWorkbook =
    XLSX.read(
      localBuffer
    );

  const remoteWorkbook =
    XLSX.read(
      remoteBuffer
    );

  const sheetNames =
    Array.from(
      new Set([
        ...remoteWorkbook.SheetNames,
        ...localWorkbook.SheetNames,
      ])
    );

  for (
    const sheetName of sheetNames
  ) {
    const remoteRows =
      remoteWorkbook.Sheets[
        sheetName
      ]
        ? XLSX.utils.sheet_to_json<
            Record<string, unknown>
          >(
            remoteWorkbook.Sheets[
              sheetName
            ],
            {
              defval: '',
            }
          )
        : [];

    const localRows =
      localWorkbook.Sheets[
        sheetName
      ]
        ? XLSX.utils.sheet_to_json<
            Record<string, unknown>
          >(
            localWorkbook.Sheets[
              sheetName
            ],
            {
              defval: '',
            }
          )
        : [];

    /*
     * Start with latest remote data.
     */
    const mergedRows =
      [...remoteRows];

    const indexes =
      new Map<
        string,
        number
      >();

    /*
     * Index remote rows.
     */
    mergedRows.forEach(
      (
        row,
        index
      ) => {
        const key =
          keyForRow(row);

        if (key) {
          indexes.set(
            key,
            index
          );
        }
      }
    );

    /*
     * Merge local rows.
     */
    for (
      const row of localRows
    ) {
      const key =
        keyForRow(row);

      /*
       * Existing identity.
       */
      if (
        key &&
        indexes.has(key)
      ) {
        const index =
          indexes.get(key)!;

        mergedRows[index] =
          row;

        continue;
      }

      /*
       * New row / no identity.
       */
      const duplicate =
        mergedRows.some(
          (
            existing
          ) =>
            JSON.stringify(
              existing
            ) ===
            JSON.stringify(
              row
            )
        );

      if (!duplicate) {
        mergedRows.push(
          row
        );
      }
    }

    /*
     * Recreate sheet.
     */
    localWorkbook.Sheets[
      sheetName
    ] =
      XLSX.utils.json_to_sheet(
        mergedRows
      );

    /*
     * Add missing sheet.
     */
    if (
      !localWorkbook.SheetNames.includes(
        sheetName
      )
    ) {
      localWorkbook.SheetNames.push(
        sheetName
      );
    }
  }

  /*
   * XLSX.write(..., type:'buffer') returns a
   * Node Buffer-like value.
   *
   * Convert it immediately into Uint8Array.
   */
  const output =
    XLSX.write(
      localWorkbook,
      {
        type: 'buffer',
        bookType: 'xlsx',
      }
    );

  return new Uint8Array(
    output as Uint8Array
  );
}

/* ------------------------------------------------------------
 * Prepare Excel store
 * ------------------------------------------------------------ */

/**
 * Called before business-data operations.
 *
 * Local:
 *   Create workbook if necessary.
 *
 * Vercel:
 *   Download private Blob workbook.
 *
 * If Blob does not exist:
 *   create local workbook
 *   upload it to Blob.
 */
export async function prepareExcelStore(): Promise<void> {
  if (prepared) {
    return;
  }

  assertProductionExcelStorage();

  ensureLocalDir();

  /*
   * Local development.
   */
  if (!IS_VERCEL) {
    if (
      !fs.existsSync(
        EXCEL_FILE
      )
    ) {
      createEmptyWorkbook();
    }

    prepared = true;

    return;
  }

  /*
   * Vercel production.
   */
  const remote =
    await downloadRemote();

  if (
    remote.found &&
    remote.buffer
  ) {
    /*
     * Normalize remote bytes.
     */
    const buffer =
      new Uint8Array(
        remote.buffer
      );

    fs.writeFileSync(
      EXCEL_FILE,
      Buffer.from(buffer)
    );

    lastRemoteEtag =
      remote.etag ||
      null;
  } else {
    /*
     * First production deployment.
     */
    const local =
      localWorkbookBytes();

    lastRemoteEtag =
      await uploadRemote(
        local,
        null
      );
  }

  prepared = true;
}

/* ------------------------------------------------------------
 * Persist Excel store
 * ------------------------------------------------------------ */

/**
 * Persist local workbook to Vercel Blob.
 *
 * Optimistic concurrency:
 *
 *   local workbook
 *        ↓
 *   upload with ETag
 *        ↓
 *   conflict?
 *        ↓
 *   download latest
 *        ↓
 *   merge
 *        ↓
 *   retry
 */
export async function persistExcelStore(): Promise<void> {
  assertProductionExcelStorage();

  /*
   * Local filesystem is persistent enough
   * for local development.
   */
  if (!IS_VERCEL) {
    return;
  }

  /*
   * Nothing to persist.
   */
  if (
    !fs.existsSync(
      EXCEL_FILE
    )
  ) {
    return;
  }

  /*
   * IMPORTANT:
   *
   * Keep the variable as Uint8Array.
   *
   * Do NOT declare:
   *
   * let local: Buffer
   *
   * because Node 22 may infer:
   *
   * Buffer<ArrayBufferLike>
   *
   * which causes:
   *
   * Buffer<ArrayBufferLike>
   * not assignable to
   * NonSharedBuffer
   */
  let local: WorkbookBytes =
    new Uint8Array(
      fs.readFileSync(
        EXCEL_FILE
      )
    );

  let etag =
    lastRemoteEtag;

  /*
   * Retry concurrent writes.
   */
  for (
    let attempt = 0;
    attempt < 6;
    attempt += 1
  ) {
    try {
      /*
       * Upload current workbook.
       */
      etag =
        await uploadRemote(
          local,
          etag
        );

      lastRemoteEtag =
        etag || null;

      /*
       * Force next operation to check
       * the remote workbook again.
       */
      prepared = false;

      return;
    } catch (error) {
      const isConflict =
        error instanceof Error &&
        (
          error as Error & {
            code?: string;
          }
        ).code ===
          'EXCEL_BLOB_CONFLICT';

      /*
       * Normal errors are not retried
       * as concurrency conflicts.
       */
      if (!isConflict) {
        throw error;
      }

      /*
       * Another Vercel instance changed
       * the workbook.
       */
      const latest =
        await downloadRemote();

      if (
        !latest.found ||
        !latest.buffer
      ) {
        throw new Error(
          'Excel Blob disappeared during concurrent write.'
        );
      }

      /*
       * Merge our workbook with the newest
       * remote workbook.
       *
       * BOTH arguments and result are Uint8Array.
       */
      local =
        mergeWorkbookBuffers(
          local,
          new Uint8Array(
            latest.buffer
          )
        );

      /*
       * Synchronize local runtime cache.
       *
       * Buffer.from() is only used at the
       * filesystem boundary.
       */
      fs.writeFileSync(
        EXCEL_FILE,
        Buffer.from(local)
      );

      /*
       * Next attempt uses latest ETag.
       */
      etag =
        latest.etag ||
        null;

      /*
       * All retries exhausted.
       */
      if (
        attempt === 5
      ) {
        throw new Error(
          'Excel storage is busy. Please retry the operation.'
        );
      }
    }
  }
}

/* ------------------------------------------------------------
 * Test reset
 * ------------------------------------------------------------ */

/**
 * Reset in-memory persistence state.
 *
 * Does NOT delete the actual workbook.
 */
export function resetExcelPersistenceForTests(): void {
  prepared = false;
  lastRemoteEtag = null;
}