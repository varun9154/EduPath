export interface AuditLogRecord {
  id: string;
  action: string; // e.g. 'ADMIN_LOGIN', 'LEAD_STATUS_UPDATE', 'EXCEL_EXPORT', 'SHEETS_RETRY'
  actor: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

class AuditLogManager {
  private logs: AuditLogRecord[] = [];

  constructor() {
    this.addLog('SYSTEM_BOOT', 'System', 'EduPath AI Audit System Initialized');
  }

  public addLog(action: string, actor: string, details: string, ipAddress?: string): AuditLogRecord {
    const record: AuditLogRecord = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      actor,
      details,
      timestamp: new Date().toISOString(),
      ipAddress
    };
    this.logs.unshift(record);
    return record;
  }

  public getLogs(): AuditLogRecord[] {
    return this.logs;
  }
}

const globalForAudit = global as unknown as { auditLogManager: AuditLogManager };
export const auditLog = globalForAudit.auditLogManager || new AuditLogManager();
if (process.env.NODE_ENV !== 'production') globalForAudit.auditLogManager = auditLog;
