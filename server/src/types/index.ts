import type { Core } from '@strapi/strapi';

export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'unpublish';

export type ContentType = {
  uid?: string;
  kind?: string;
  info?: {
    pluralName?: string;
  };
  [key: string]: unknown;
};

export type KoaContext = Parameters<Parameters<Core.Strapi['server']['use']>[0]>[0];

export interface ParsedUrl {
  apiName: string | null;
  entityId: string | null;
  urlParts: string[];
}

export interface AuditLogData {
  contentType: string;
  entityId: string | number;
  action: AuditAction;
  userId?: number;
  userEmail?: string;
  changes?: any;
  previousValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}
