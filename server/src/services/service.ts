import type { Core } from '@strapi/strapi';

export interface AuditLogData {
  contentType: string;
  entityId: string | number;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  userId?: number;
  userEmail?: string;
  changes?: any;
  previousValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Check if audit logging is enabled for a content type
   */
  async isEnabled(contentType: string): Promise<boolean> {
    try {
      const setting = await strapi.db.query('plugin::audit-logs.audit-log-setting').findOne({
        where: { contentType },
      });

      return setting?.enabled ?? false;
    } catch (error) {
      strapi.log.error('Error checking audit log setting:', error);
      return false;
    }
  },

  /**
   * Enable or disable audit logging for a content type
   */
  async setEnabled(contentType: string, enabled: boolean): Promise<void> {
    try {
      const existing = await strapi.db.query('plugin::audit-logs.audit-log-setting').findOne({
        where: { contentType },
      });

      if (existing) {
        await strapi.db.query('plugin::audit-logs.audit-log-setting').update({
          where: { id: existing.id },
          data: { enabled },
        });
      } else {
        await strapi.db.query('plugin::audit-logs.audit-log-setting').create({
          data: { contentType, enabled },
        });
      }
    } catch (error) {
      strapi.log.error('Error setting audit log setting:', error);
      throw error;
    }
  },

  /**
   * Get all content types with their audit log settings
   */
  async getContentTypeSettings(): Promise<Array<{ contentType: string; enabled: boolean }>> {
    try {
      const settings = await strapi.db.query('plugin::audit-logs.audit-log-setting').findMany();

      const settingsMap = new Map(settings.map((s) => [s.contentType, s.enabled]));

      // Get all content types
      const contentTypes = Object.values(strapi.contentTypes)
        .filter((ct: any) => ct.uid?.startsWith('api::') && ct.kind === 'collectionType')
        .map((ct: any) => ({
          contentType: ct.uid,
          enabled: settingsMap.get(ct.uid) ?? false,
        }));

      return contentTypes;
    } catch (error) {
      strapi.log.error('Error getting content type settings:', error);
      throw error;
    }
  },

  /**
   * Create an audit log entry
   */
  async createLog(data: AuditLogData): Promise<void> {
    try {
      const isEnabled = await this.isEnabled(data.contentType);
      if (!isEnabled) {
        return;
      }

      await strapi.db.query('plugin::audit-logs.audit-log').create({
        data: {
          contentType: data.contentType,
          entityId: String(data.entityId),
          action: data.action,
          userId: data.userId,
          userEmail: data.userEmail,
          changes: data.changes,
          previousValues: data.previousValues,
          newValues: data.newValues,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      strapi.log.error('Error creating audit log:', error);
      // Don't throw - we don't want audit logging to break the main operation
    }
  },

  /**
   * Get audit logs for a content type
   */
  async getLogs(contentType: string, entityId?: string, limit = 50) {
    try {
      const where: any = { contentType };
      if (entityId) {
        where.entityId = entityId;
      }

      const logs = await strapi.db.query('plugin::audit-logs.audit-log').findMany({
        where,
        orderBy: { createdAt: 'desc' },
        limit,
      });

      return logs;
    } catch (error) {
      strapi.log.error('Error getting audit logs:', error);
      throw error;
    }
  },

  /**
   * Get audit logs with pagination
   */
  async getLogsPaginated(contentType?: string, page = 1, pageSize = 25) {
    try {
      const where: any = {};
      if (contentType) {
        where.contentType = contentType;
      }

      const [logs, total] = await Promise.all([
        strapi.db.query('plugin::audit-logs.audit-log').findMany({
          where,
          orderBy: { createdAt: 'desc' },
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        strapi.db.query('plugin::audit-logs.audit-log').count({ where }),
      ]);

      return {
        results: logs,
        pagination: {
          page,
          pageSize,
          total,
          pageCount: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      strapi.log.error('Error getting paginated audit logs:', error);
      throw error;
    }
  },
});

export default service;
