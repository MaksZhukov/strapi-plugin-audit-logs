import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get all content types with their audit log settings
   */
  async getContentTypeSettings(ctx: any) {
    try {
      const service = strapi.plugin('audit-logs').service('service');
      const settings = await service.getContentTypeSettings();
      ctx.body = { data: settings };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Update audit log setting for a content type
   */
  async updateContentTypeSetting(ctx: any) {
    try {
      const { contentType } = ctx.params;
      const { enabled } = ctx.request.body;

      if (typeof enabled !== 'boolean') {
        return ctx.badRequest('enabled must be a boolean');
      }

      const service = strapi.plugin('audit-logs').service('service');
      await service.setEnabled(contentType, enabled);

      ctx.body = { data: { contentType, enabled } };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get audit logs with pagination
   */
  async getLogs(ctx: any) {
    try {
      const { contentType } = ctx.query;
      const page = parseInt(ctx.query.page || '1', 10);
      const pageSize = parseInt(ctx.query.pageSize || '25', 10);

      const service = strapi.plugin('audit-logs').service('service');
      const result = await service.getLogsPaginated(contentType, page, pageSize);

      ctx.body = result;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Get audit logs for a specific entity
   */
  async getEntityLogs(ctx: any) {
    try {
      const { contentType, entityId } = ctx.params;
      const limit = parseInt(ctx.query.limit || '50', 10);

      const service = strapi.plugin('audit-logs').service('service');
      const logs = await service.getLogs(contentType, entityId, limit);

      ctx.body = { data: logs };
    } catch (error) {
      ctx.throw(500, error);
    }
  },
});

export default controller;
