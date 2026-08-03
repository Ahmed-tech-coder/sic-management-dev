import { EventEmitter } from 'events';
import { prisma } from '../lib/prisma';

interface AuditLogPayload {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
}

class AuditEmitter extends EventEmitter {
  constructor() {
    super();
    // Register background worker listener
    this.on('log', this.handleLog);
  }

  private async handleLog(payload: AuditLogPayload) {
    try {
      const { userId, action, entityType, entityId, description } = payload;
      
      await prisma.activityLog.create({
        data: {
          user_id: userId || null,
          action,
          entity_type: entityType,
          entity_id: entityId,
          description,
        },
      });
    } catch (err) {
      console.error('Critical failure in async audit logging event listener:', err);
    }
  }

  /**
   * Dispatches a log execution to the background event listener without blocking.
   */
  public emitLog(payload: AuditLogPayload) {
    this.emit('log', payload);
  }
}

export const auditEmitter = new AuditEmitter();

