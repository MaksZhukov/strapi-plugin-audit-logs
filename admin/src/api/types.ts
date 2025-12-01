export interface ContentTypeSetting {
  contentType: string;
  enabled: boolean;
}

export interface AuditLog {
  id: number;
  contentType: string;
  entityId: string;
  action: string;
  userId?: number;
  userEmail?: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface LogsResponse {
  results: AuditLog[];
  pagination: Pagination;
}

export interface ContentTypeSettingsResponse {
  results: ContentTypeSetting[];
  pagination: Pagination;
}
