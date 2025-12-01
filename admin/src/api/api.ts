import type { ContentTypeSetting, LogsResponse, ContentTypeSettingsResponse } from './types';

export const fetchContentTypeSettings = async (
  page: number = 1,
  pageSize: number = 25,
  search?: string
): Promise<ContentTypeSettingsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search: search || '',
  });
  const response = await fetch(`/audit-logs/content-type-settings?${params.toString()}`);
  return response.json();
};

export const updateContentTypeSetting = async (
  contentType: string,
  enabled: boolean
): Promise<ContentTypeSetting> => {
  const response = await fetch(`/audit-logs/content-type-settings/${contentType}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
  return response.json();
};

export const fetchLogs = async (
  contentType: string,
  page: number,
  pageSize: number,
  search?: string
): Promise<LogsResponse> => {
  const params = new URLSearchParams({
    contentType: contentType || '',
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (search) {
    params.append('search', search);
  }
  const response = await fetch(`/audit-logs/logs?${params.toString()}`);
  return response.json();
};

export const fetchEntityLogs = async (
  contentType: string,
  entityId: string,
  page: number = 1,
  pageSize: number = 25,
  search?: string
): Promise<LogsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (search) {
    params.append('search', search);
  }
  const response = await fetch(`/audit-logs/logs/${contentType}/${entityId}?${params.toString()}`);
  return response.json();
};
