import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Main,
  Box,
  Typography,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SingleSelect,
  SingleSelectOption,
  Pagination,
  Flex,
  Alert,
  Button,
  IconButton,
} from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';

interface AuditLog {
  id: number;
  contentType: string;
  entityId: string;
  action: string;
  userId?: number;
  userEmail?: string;
  createdAt: string;
  changes?: any;
  previousValues?: any;
  newValues?: any;
}

interface LogsResponse {
  results: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
}

const LogsPage = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string>(
    searchParams.get('contentType') || ''
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    pageCount: 0,
  });

  useEffect(() => {
    loadContentTypes();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedContentType, pagination.page, pagination.pageSize]);

  const loadContentTypes = async () => {
    try {
      const response = await fetch('/audit-logs/content-type-settings');
      if (!response.ok) {
        throw new Error('Failed to load content types');
      }
      const data = await response.json();
      const types = (data.data || []).map((s: any) => s.contentType);
      setContentTypes(types);
    } catch (err) {
      console.error('Error loading content types:', err);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (selectedContentType) {
        params.append('contentType', selectedContentType);
      }

      const response = await fetch(`/audit-logs/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load logs');
      }

      const data: LogsResponse = await response.json();
      setLogs(data.results || []);
      setPagination((prev) => ({
        ...prev,
        ...data.pagination,
      }));
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleContentTypeChange = (value: string) => {
    setSelectedContentType(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    if (value) {
      setSearchParams({ contentType: value });
    } else {
      setSearchParams({});
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success600';
      case 'update':
        return 'primary600';
      case 'delete':
        return 'danger600';
      case 'publish':
        return 'success600';
      case 'unpublish':
        return 'warning600';
      default:
        return 'neutral600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getContentTypeDisplayName = (uid: string) => {
    const parts = uid.split('.');
    if (parts.length > 1) {
      const name = parts[parts.length - 1];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return uid;
  };

  const getContentManagerUrl = (contentType: string, entityId: string) => {
    // Convert contentType UID (e.g., api::article.article) to URL format
    // Remove 'api::' prefix and use the format: api::article.article -> api::article.article
    return `/content-manager/collection-types/${encodeURIComponent(contentType)}/${encodeURIComponent(entityId)}`;
  };

  const handleViewEntity = (contentType: string, entityId: string) => {
    const url = getContentManagerUrl(contentType, entityId);
    navigate(url);
  };

  return (
    <Main>
      <Box padding={8}>
        <Box paddingBottom={4}>
          <Typography variant="alpha" as="h1">
            {formatMessage({ id: getTranslation('logs.title') })}
          </Typography>
        </Box>

        <Box paddingBottom={4}>
          <SingleSelect
            label={formatMessage({ id: getTranslation('logs.filterByContentType') })}
            value={selectedContentType}
            onChange={handleContentTypeChange}
            placeholder={formatMessage({ id: getTranslation('logs.allContentTypes') })}
          >
            <SingleSelectOption value="">
              {formatMessage({ id: getTranslation('logs.allContentTypes') })}
            </SingleSelectOption>
            {contentTypes.map((ct) => (
              <SingleSelectOption key={ct} value={ct}>
                {getContentTypeDisplayName(ct)}
              </SingleSelectOption>
            ))}
          </SingleSelect>
        </Box>

        {error && (
          <Box paddingBottom={4}>
            <Alert closeLabel="Close" title="Error" variant="danger">
              {error}
            </Alert>
          </Box>
        )}

        {loading ? (
          <Box padding={8} textAlign="center">
            <Typography variant="omega">
              {formatMessage({ id: getTranslation('homepage.loading') })}
            </Typography>
          </Box>
        ) : (
          <>
            <Table colCount={7} rowCount={logs.length}>
              <Thead>
                <Tr>
                  <Th>
                    <Typography variant="sigma">
                      {formatMessage({ id: getTranslation('logs.date') })}
                    </Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">
                      {formatMessage({ id: getTranslation('logs.contentType') })}
                    </Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">
                      {formatMessage({ id: getTranslation('logs.entityId') })}
                    </Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">
                      {formatMessage({ id: getTranslation('logs.action') })}
                    </Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">
                      {formatMessage({ id: getTranslation('logs.user') })}
                    </Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Link</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.map((log) => (
                  <Tr key={log.id}>
                    <Td>
                      <Typography textColor="neutral800">{formatDate(log.createdAt)}</Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">
                        {getContentTypeDisplayName(log.contentType)}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">{log.entityId}</Typography>
                    </Td>
                    <Td>
                      <Typography textColor={getActionColor(log.action)}>
                        {log.action.toUpperCase()}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">
                        {log.userEmail || (log.userId ? `User #${log.userId}` : 'System')}
                      </Typography>
                    </Td>
                    <Td>
                      <IconButton
                        variant="tertiary"
                        size="S"
                        label="View in Content Manager"
                        onClick={() => handleViewEntity(log.contentType, log.entityId)}
                      >
                        <ExternalLink />
                      </IconButton>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {logs.length === 0 && (
              <Box padding={8} textAlign="center">
                <Typography variant="omega" textColor="neutral600">
                  {formatMessage({ id: getTranslation('logs.noLogs') })}
                </Typography>
              </Box>
            )}

            {pagination.pageCount > 1 && (
              <Box paddingTop={4}>
                <Flex justifyContent="center">
                  <Pagination
                    activePage={pagination.page}
                    pageCount={pagination.pageCount}
                    onPageChange={(page: number) => setPagination((prev) => ({ ...prev, page }))}
                  />
                </Flex>
              </Box>
            )}
          </>
        )}
      </Box>
    </Main>
  );
};

export { LogsPage };
