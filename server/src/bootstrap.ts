import type { Core } from '@strapi/strapi';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.server.use(async (ctx, next) => {
    const auditService = strapi.plugin('audit-logs').service('service');
    const originalBody = ctx.request.body;
    let previousEntity: Record<string, unknown> | null = null;

    // Fetch previous entity state before modification (for PUT, PATCH, DELETE)
    if (auditService.needsPreviousEntity(ctx.method, ctx.url)) {
      try {
        const { apiName, entityId } = auditService.parseApiUrl(ctx.url!);

        if (apiName && entityId) {
          const contentType = auditService.findContentTypeByPluralName(apiName);

          if (contentType) {
            const isEnabled = await auditService.isEnabled(contentType.uid);

            if (isEnabled) {
              previousEntity = await auditService.fetchPreviousEntity(contentType, entityId);
            }
          }
        }
      } catch (error) {
        strapi.log.debug('Error fetching previous entity in middleware:', error);
      }
    }

    await next();

    // Process successful requests to content API
    if (auditService.shouldProcessRequest(ctx.method, ctx.url, ctx.status)) {
      try {
        const { apiName, urlParts } = auditService.parseApiUrl(ctx.url!);

        if (!apiName) {
          return;
        }

        const contentType = auditService.findContentTypeByPluralName(apiName);

        if (!contentType) {
          strapi.log.debug(`[Audit Log] No content type found for API: ${apiName}`);
          return;
        }

        const isEnabled = await auditService.isEnabled(contentType.uid);

        strapi.log.info(
          `[Audit Log] Content type: ${contentType.uid}, Enabled: ${isEnabled}, URL: ${ctx.url}, Method: ${ctx.method}`
        );

        if (!isEnabled) {
          strapi.log.info(
            `[Audit Log] Skipping - audit logging not enabled for ${contentType.uid}`
          );
          return;
        }

        const action = auditService.getActionFromMethod(ctx.method, ctx.url!);
        const responseData = ctx.body?.data || ctx.body;

        strapi.log.info(
          `[Audit Log] Action: ${action}, Response data:`,
          JSON.stringify(responseData)
        );

        const entityId = auditService.extractEntityId(urlParts, responseData, originalBody);
        strapi.log.info(`[Audit Log] Extracted entityId: ${entityId}`);

        if (!action || !entityId) {
          strapi.log.warn(`[Audit Log] Skipping - action: ${action}, entityId: ${entityId}`);
          return;
        }

        strapi.log.info(
          `[Audit Log] Creating audit log for ${contentType.uid}, entityId: ${entityId}, action: ${action}`
        );

        const user = auditService.getUserFromContext(ctx);

        await auditService.createAuditLogEntry(
          contentType,
          entityId,
          action,
          user,
          previousEntity,
          responseData,
          ctx
        );

        strapi.log.info(`[Audit Log] Successfully created audit log entry`);
      } catch (error) {
        strapi.log.error('Error in audit log middleware:', error);
      }
    }
  });
};

export default bootstrap;
