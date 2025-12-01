import type { Core } from '@strapi/strapi';
import type { AuditAction, ContentType, KoaContext, ParsedUrl, AuditLogData } from '../types';

export type { AuditAction, ContentType, KoaContext, ParsedUrl, AuditLogData };

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

      // Get all content types (API and user collection)
      const contentTypes = Object.values(strapi.contentTypes)
        .filter(
          (ct: any) =>
            (ct.uid?.startsWith('api::') || ct.uid === 'plugin::users-permissions.user') &&
            ct.kind === 'collectionType'
        )
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
   * Get content types with their audit log settings with pagination
   */
  async getContentTypeSettingsPaginated(page = 1, pageSize = 25, search = '') {
    try {
      const settings = await strapi.db.query('plugin::audit-logs.audit-log-setting').findMany();

      const settingsMap = new Map(settings.map((s) => [s.contentType, s.enabled]));

      let allContentTypes = Object.values(strapi.contentTypes)
        .filter(
          (ct: any) =>
            (ct.uid?.startsWith('api::') || ct.uid === 'plugin::users-permissions.user') &&
            ct.kind === 'collectionType'
        )
        .map((ct: any) => ({
          contentType: ct.uid,
          enabled: settingsMap.get(ct.uid) ?? false,
        }));

      if (search) {
        const searchLower = search.toLowerCase();
        allContentTypes = allContentTypes.filter((ct) => {
          const displayName = this.getContentTypeDisplayName(ct.contentType).toLowerCase();
          return (
            displayName.includes(searchLower) || ct.contentType.toLowerCase().includes(searchLower)
          );
        });
      }

      const total = allContentTypes.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedContentTypes = allContentTypes.slice(startIndex, endIndex);

      return {
        results: paginatedContentTypes,
        pagination: {
          page,
          pageSize,
          total,
          pageCount: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      strapi.log.error('Error getting paginated content type settings:', error);
      throw error;
    }
  },

  /**
   * Helper method to get display name from content type UID
   */
  getContentTypeDisplayName(uid: string): string {
    const parts = uid.split('.');
    if (parts.length > 1) {
      const name = parts[parts.length - 1];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return uid;
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
    }
  },

  /**
   * Get audit logs with pagination
   */
  async getLogsPaginated(
    contentType?: string,
    page = 1,
    pageSize = 25,
    search = '',
    entityId?: string
  ) {
    try {
      const where: any = {};
      if (contentType) {
        where.contentType = contentType;
      }

      if (entityId) {
        where.entityId = entityId;
      }

      if (search) {
        const searchLower = search.toLowerCase();
        where.$or = [
          { entityId: { $contains: search } },
          { userEmail: { $contains: search } },
          { action: { $contains: searchLower } },
          { contentType: { $contains: search } },
        ];
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

  /**
   * Parses the API URL to extract API name and entity ID
   */
  parseApiUrl(url: string): ParsedUrl {
    const urlParts = url.split('/').filter(Boolean);
    const isApiRoute = urlParts.length >= 2 && urlParts[0] === 'api';

    return {
      apiName: isApiRoute ? urlParts[1] : null,
      entityId: urlParts.length >= 3 ? urlParts[2] : null,
      urlParts,
    };
  },

  /**
   * Finds a content type by its plural name
   */
  findContentTypeByPluralName(pluralName: string): ContentType | undefined {
    return Object.values(strapi.contentTypes).find(
      (ct): ct is ContentType =>
        ct.info?.pluralName === pluralName &&
        ct.kind === 'collectionType' &&
        (ct.uid?.startsWith('api::') || ct.uid?.startsWith('plugin::'))
    );
  },

  /**
   * Finds a content type by its UID
   */
  findContentTypeByUid(uid: string): ContentType | undefined {
    return Object.values(strapi.contentTypes).find(
      (ct): ct is ContentType => ct.uid === uid && ct.kind === 'collectionType'
    );
  },

  /**
   * Fetches the previous entity state before modification
   */
  async fetchPreviousEntity(
    contentType: ContentType,
    entityId: string
  ): Promise<Record<string, unknown> | null> {
    const contentTypeUid = contentType.uid;
    if (!contentTypeUid || typeof contentTypeUid !== 'string') {
      return null;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const document = await (strapi.documents as any)(contentTypeUid).findOne({
        documentId: entityId,
      });
      return document as Record<string, unknown> | null;
    } catch (error) {
      strapi.log.debug(`Could not fetch previous entity for audit log: ${error}`);
      return null;
    }
  },

  /**
   * Extracts entity ID from various sources (URL, response, request body)
   */
  extractEntityId(
    urlParts: string[],
    responseData: unknown,
    originalBody: unknown
  ): string | number | null {
    // Try URL first
    if (urlParts.length >= 3) {
      return urlParts[2];
    }

    // Try response data
    const response = responseData as Record<string, unknown> | undefined;
    if (response?.documentId) return response.documentId as string | number;
    if (response?.id) return response.id as string | number;

    // Try request body
    const body = originalBody as { data?: Record<string, unknown> } | undefined;
    if (body?.data?.documentId) return body.data.documentId as string | number;
    if (body?.data?.id) return body.data.id as string | number;

    return null;
  },

  /**
   * Calculates changes between previous and new entity states
   */
  calculateChanges(
    previousEntity: Record<string, unknown>,
    newEntity: Record<string, unknown>
  ): Record<string, { from: unknown; to: unknown }> | undefined {
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    Object.keys(newEntity).forEach((key) => {
      const prevValue = previousEntity[key];
      const newValue = newEntity[key];

      if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
        changes[key] = { from: prevValue, to: newValue };
      }
    });

    return Object.keys(changes).length > 0 ? changes : undefined;
  },

  /**
   * Determines the audit action from HTTP method and URL
   * Also checks for publish/unpublish via publishedAt field changes
   */
  getActionFromMethod(
    method: string,
    url: string,
    requestBody?: Record<string, unknown>,
    previousEntity?: Record<string, unknown> | null,
    responseData?: Record<string, unknown>
  ): AuditAction | null {
    // Check for login action
    if (url.includes('/auth/local') && method === 'POST') {
      return 'login';
    }

    if (url.includes('/actions/publish')) {
      return 'publish';
    }
    if (url.includes('/actions/unpublish')) {
      return 'unpublish';
    }

    // Check for publish/unpublish via publishedAt field changes (PUT/PATCH)
    if ((method === 'PUT' || method === 'PATCH') && previousEntity) {
      const requestData = (requestBody?.data || requestBody) as Record<string, unknown> | undefined;
      const response = responseData as Record<string, unknown> | undefined;
      const finalPublishedAt = (response?.publishedAt ?? requestData?.publishedAt) as
        | string
        | null
        | undefined;
      const previousPublishedAt = previousEntity?.publishedAt as string | null | undefined;

      // Publish: publishedAt changes from null/undefined to a date
      if (finalPublishedAt !== null && finalPublishedAt !== undefined) {
        if (previousPublishedAt === null || previousPublishedAt === undefined) {
          return 'publish';
        }
      }

      // Unpublish: publishedAt changes from a date to null
      if (finalPublishedAt === null) {
        if (previousPublishedAt !== null && previousPublishedAt !== undefined) {
          return 'unpublish';
        }
      }
    }

    switch (method) {
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return null;
    }
  },

  /**
   * Checks if the request should be processed for audit logging
   */
  shouldProcessRequest(method: string, url: string | undefined, status: number): boolean {
    return status >= 200 && status < 300 && url?.startsWith('/api/') === true && method !== 'GET';
  },

  /**
   * Checks if the request needs previous entity fetching
   */
  needsPreviousEntity(method: string, url: string | undefined): boolean {
    return (
      (method === 'PUT' || method === 'PATCH' || method === 'DELETE') &&
      url?.startsWith('/api/') === true
    );
  },

  /**
   * Gets user information from the request context
   */
  getUserFromContext(ctx: KoaContext) {
    return ctx.state?.user || ctx.state?.auth?.user;
  },

  /**
   * Creates an audit log entry with all necessary data
   */
  async createAuditLogEntry(
    contentType: ContentType,
    entityId: string | number,
    action: AuditAction,
    user: { id?: unknown; email?: unknown } | undefined,
    previousEntity: Record<string, unknown> | null,
    responseData: unknown,
    ctx: KoaContext
  ): Promise<void> {
    const response = responseData as Record<string, unknown> | undefined;

    // Calculate changes for update operations
    const changes =
      action === 'update' && previousEntity && response
        ? this.calculateChanges(previousEntity, response)
        : undefined;

    // Determine previous and new values based on action
    const previousValues = action === 'delete' || action === 'update' ? previousEntity : undefined;
    const newValues = action !== 'delete' ? responseData : undefined;

    await this.createLog({
      contentType: contentType.uid || '',
      entityId: String(entityId),
      action,
      userId: user?.id as number | undefined,
      userEmail: user?.email as string | undefined,
      changes,
      previousValues,
      newValues,
      ipAddress: ctx.request?.ip,
      userAgent: ctx.request?.headers?.['user-agent'],
    });
  },
});

export default service;
