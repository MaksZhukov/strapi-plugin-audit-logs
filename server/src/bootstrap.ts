import type { Core } from '@strapi/strapi';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  // Register middleware to intercept content API requests
  strapi.server.use(async (ctx, next) => {
    // Store original body for later use
    const originalBody = ctx.request.body;
    let previousEntity: any = null;

    // For update/delete operations, fetch previous entity state
    if (
      (ctx.method === 'PUT' || ctx.method === 'PATCH' || ctx.method === 'DELETE') &&
      ctx.url?.startsWith('/api/')
    ) {
      try {
        const urlParts = ctx.url.split('/').filter(Boolean);
        if (urlParts.length >= 3 && urlParts[0] === 'api') {
          const apiName = urlParts[1];
          const entityId = urlParts[2];

          const contentType = Object.values(strapi.contentTypes).find(
            (ct: any) =>
              ct.info?.pluralName === apiName &&
              ct.kind === 'collectionType' &&
              ct.uid?.startsWith('api::')
          ) as any;

          if (contentType) {
            const auditService = strapi.plugin('audit-logs').service('service');
            const isEnabled = await auditService.isEnabled(contentType.uid);

            if (isEnabled) {
              try {
                // Try to fetch the previous entity
                const document = await strapi.documents(contentType.uid).findOne({
                  documentId: entityId,
                });
                previousEntity = document;
              } catch (error) {
                // Entity might not exist or might be deleted, that's okay
                strapi.log.debug(`Could not fetch previous entity for audit log: ${error}`);
              }
            }
          }
        }
      } catch (error) {
        strapi.log.debug('Error fetching previous entity in middleware:', error);
      }
    }

    await next();

    // Only process successful requests to content API
    if (
      ctx.status >= 200 &&
      ctx.status < 300 &&
      ctx.url?.startsWith('/api/') &&
      ctx.method !== 'GET'
    ) {
      try {
        const auditService = strapi.plugin('audit-logs').service('service');

        // Extract content type from URL (e.g., /api/articles/1 -> api::article.article)
        const urlParts = ctx.url.split('/').filter(Boolean);
        if (urlParts.length >= 2 && urlParts[0] === 'api') {
          const apiName = urlParts[1];

          // Find the content type UID by matching pluralName
          const contentType = Object.values(strapi.contentTypes).find(
            (ct: any) =>
              ct.info?.pluralName === apiName &&
              ct.kind === 'collectionType' &&
              ct.uid?.startsWith('api::')
          ) as any;

          if (contentType) {
            const isEnabled = await auditService.isEnabled(contentType.uid);
            strapi.log.info(
              `[Audit Log] Content type: ${contentType.uid}, Enabled: ${isEnabled}, URL: ${ctx.url}, Method: ${ctx.method}`
            );

            if (isEnabled) {
              const action = getActionFromMethod(ctx.method, ctx.url);
              const responseData = ctx.body?.data || ctx.body;
              strapi.log.info(
                `[Audit Log] Action: ${action}, Response data:`,
                JSON.stringify(responseData)
              );

              // Extract entity ID from various sources
              let entityId: string | number | null = null;
              if (urlParts.length >= 3) {
                entityId = urlParts[2];
              } else if (responseData?.documentId) {
                entityId = responseData.documentId;
              } else if (responseData?.id) {
                entityId = responseData.id;
              } else if (originalBody?.data?.documentId) {
                entityId = originalBody.data.documentId;
              } else if (originalBody?.data?.id) {
                entityId = originalBody.data.id;
              }
              strapi.log.info(`[Audit Log] Extracted entityId: ${entityId}`);

              if (action && entityId) {
                strapi.log.info(
                  `[Audit Log] Creating audit log for ${contentType.uid}, entityId: ${entityId}, action: ${action}`
                );
                const user = ctx.state?.user || ctx.state?.auth?.user;

                // Calculate changes for update operations
                let changes: any = undefined;
                if (action === 'update' && previousEntity && responseData) {
                  changes = {};
                  Object.keys(responseData).forEach((key) => {
                    if (JSON.stringify(previousEntity[key]) !== JSON.stringify(responseData[key])) {
                      changes[key] = {
                        from: previousEntity[key],
                        to: responseData[key],
                      };
                    }
                  });
                  if (Object.keys(changes).length === 0) {
                    changes = undefined;
                  }
                }

                await auditService.createLog({
                  contentType: contentType.uid,
                  entityId: String(entityId),
                  action,
                  userId: user?.id,
                  userEmail: user?.email,
                  changes,
                  previousValues:
                    action === 'delete'
                      ? previousEntity
                      : action === 'update'
                        ? previousEntity
                        : undefined,
                  newValues: action !== 'delete' ? responseData : undefined,
                  ipAddress: ctx.request?.ip,
                  userAgent: ctx.request?.headers?.['user-agent'],
                });
                strapi.log.info(`[Audit Log] Successfully created audit log entry`);
              } else {
                strapi.log.warn(`[Audit Log] Skipping - action: ${action}, entityId: ${entityId}`);
              }
            } else {
              strapi.log.info(
                `[Audit Log] Skipping - audit logging not enabled for ${contentType.uid}`
              );
            }
          } else {
            strapi.log.debug(`[Audit Log] No content type found for API: ${apiName}`);
          }
        }
      } catch (error) {
        strapi.log.error('Error in audit log middleware:', error);
        // Don't fail the request if audit logging fails
      }
    }
  });
};

function getActionFromMethod(
  method: string,
  url: string
): 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | null {
  // Check for publish/unpublish actions
  if (url.includes('/actions/publish')) {
    return 'publish';
  }
  if (url.includes('/actions/unpublish')) {
    return 'unpublish';
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
}

export default bootstrap;
