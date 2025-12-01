import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get all content types with their audit log settings
   */
  async getContentTypeSettings(ctx: any) {
    try {
      const page = parseInt(ctx.query.page || '1');
      const pageSize = parseInt(ctx.query.pageSize || '25');
      const search = ctx.query.search || '';

      const service = strapi.plugin('audit-logs').service('service');
      const result = await service.getContentTypeSettingsPaginated(page, pageSize, search);
      ctx.body = result;
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
      const { enabled } = JSON.parse(ctx.request.body);
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
      const page = parseInt(ctx.query.page || '1');
      const pageSize = parseInt(ctx.query.pageSize || '25');
      const search = ctx.query.search || '';

      const service = strapi.plugin('audit-logs').service('service');
      const result = await service.getLogsPaginated(contentType, page, pageSize, search);

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
      const page = parseInt(ctx.query.page || '1');
      const pageSize = parseInt(ctx.query.pageSize || '25');
      const search = ctx.query.search || '';

      const service = strapi.plugin('audit-logs').service('service');
      const result = await service.getLogsPaginated(contentType, page, pageSize, search, entityId);

      ctx.body = result;
    } catch (error) {
      ctx.throw(500, error);
    }
  },
});

export default controller;
