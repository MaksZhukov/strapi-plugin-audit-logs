import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  TextInput,
  Flex,
  Alert,
  Button,
  IconButton,
} from '@strapi/design-system';
import { ExternalLink, Search, ArrowLeft } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getTranslation } from '../utils/getTranslation';
import { fetchContentTypeSettings, fetchLogs } from '../api/api';
import { AuditLog } from '../api/types';
import { Pagination } from '../components/Pagination';

const LogsPage = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string>(
    searchParams.get('contentType') || ''
  );
  const [searchValue, setSearchValue] = useState<string>('');
  const [logSearchValue, setLogSearchValue] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    pageCount: 0,
  });

  const getContentTypeDisplayName = (uid: string) => {
    const parts = uid.split('.');
    if (parts.length > 1) {
      const name = parts[parts.length - 1];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return uid;
  };

  const loadContentTypes = async (searchQuery: string = '') => {
    try {
      const result = await fetchContentTypeSettings(
        pagination.page,
        pagination.pageSize,
        searchQuery
      );
      setContentTypes(result.results.map((s) => s.contentType));
      setPagination(result.pagination);
    } catch (err) {
      setError('Failed to load content types');
    }
  };

  useEffect(() => {
    loadContentTypes();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedContentType, pagination.page, pagination.pageSize, logSearchValue]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const isSelectedValue =
        selectedContentType && searchValue === getContentTypeDisplayName(selectedContentType);
      const searchQuery = isSelectedValue ? '' : searchValue;
      loadContentTypes(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, selectedContentType]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const logs = await fetchLogs(
        selectedContentType,
        pagination.page,
        pagination.pageSize,
        logSearchValue || undefined
      );
      setLogs(logs.results);
      setPagination(logs.pagination);
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleContentTypeChange = (value: string) => {
    setSelectedContentType(value);
    setSearchValue(value ? getContentTypeDisplayName(value) : '');
    setIsOpen(false);
    setPagination((prev) => ({ ...prev, page: 1 }));
    if (value) {
      setSearchParams({ contentType: value });
    } else {
      setSearchParams({});
    }
  };

  const handleLogSearchChange = (value: string) => {
    setLogSearchValue(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setSearchValue('');
    handleContentTypeChange('');
  };

  const filteredContentTypes = useMemo(() => {
    if (selectedContentType && searchValue === getContentTypeDisplayName(selectedContentType)) {
      return contentTypes;
    }
    if (!searchValue) {
      return contentTypes;
    }
    const searchLower = searchValue.toLowerCase();
    return contentTypes.filter((ct) => {
      const displayName = getContentTypeDisplayName(ct).toLowerCase();
      return displayName.includes(searchLower) || ct.toLowerCase().includes(searchLower);
    });
  }, [contentTypes, searchValue, selectedContentType]);

  useEffect(() => {
    if (selectedContentType) {
      setSearchValue(getContentTypeDisplayName(selectedContentType));
    } else {
      setSearchValue('');
    }
  }, [selectedContentType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  const getContentManagerUrl = (contentType: string, entityId: string) => {
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
          <Flex alignItems="center" gap={3}>
            <Button
              variant="tertiary"
              startIcon={<ArrowLeft />}
              onClick={() => navigate('/plugins/audit-logs')}
            ></Button>
            <Typography variant="alpha" as="h1">
              {formatMessage({ id: getTranslation('logs.title') })}
            </Typography>
          </Flex>
        </Box>

        <Box paddingBottom={4}>
          <Flex gap={3} justifyContent="space-between">
            <Box position="relative" ref={containerRef}>
              <TextInput
                ref={inputRef}
                label={formatMessage({ id: getTranslation('logs.filterByContentType') })}
                value={searchValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSearchChange(e.target.value)
                }
                onFocus={() => setIsOpen(true)}
                placeholder={formatMessage({ id: getTranslation('logs.allContentTypes') })}
                startAction={<Search />}
                onClear={handleClear}
              />
              {isOpen && (filteredContentTypes.length > 0 || searchValue === '') && (
                <Box
                  position="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  zIndex={10}
                  marginTop={1}
                  background="neutral0"
                  borderColor="neutral200"
                  borderStyle="solid"
                  borderWidth="1px"
                  borderRadius="4px"
                  shadow="tableShadow"
                  maxHeight="300px"
                  overflow="auto"
                >
                  <Box
                    as="button"
                    padding={3}
                    width="100%"
                    textAlign="left"
                    onClick={() => handleContentTypeChange('')}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.backgroundColor = 'var(--strapi-colors-neutral100)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.backgroundColor =
                        selectedContentType === ''
                          ? 'var(--strapi-colors-primary100)'
                          : 'transparent';
                    }}
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      background:
                        selectedContentType === ''
                          ? 'var(--strapi-colors-primary100)'
                          : 'transparent',
                    }}
                  >
                    <Typography>
                      {formatMessage({ id: getTranslation('logs.allContentTypes') })}
                    </Typography>
                  </Box>
                  {filteredContentTypes.map((ct) => (
                    <Box
                      key={ct}
                      as="button"
                      padding={3}
                      width="100%"
                      textAlign="left"
                      onClick={() => handleContentTypeChange(ct)}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.backgroundColor = 'var(--strapi-colors-neutral100)';
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.backgroundColor =
                          selectedContentType === ct
                            ? 'var(--strapi-colors-primary100)'
                            : 'transparent';
                      }}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background:
                          selectedContentType === ct
                            ? 'var(--strapi-colors-primary100)'
                            : 'transparent',
                      }}
                    >
                      <Typography>{getContentTypeDisplayName(ct)}</Typography>
                    </Box>
                  ))}
                  {filteredContentTypes.length === 0 && searchValue && (
                    <Box padding={3}>
                      <Typography textColor="neutral600">No content types found</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            <TextInput
              label={formatMessage({ id: getTranslation('logs.searchLogs') }) || 'Search logs'}
              value={logSearchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleLogSearchChange(e.target.value)
              }
              style={{ width: '400px' }}
              placeholder="Search by entity ID, user email, action, or content type..."
              startAction={<Search />}
              onClear={() => handleLogSearchChange('')}
            />
          </Flex>
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
                        {console.log(log)}
                        {log.action.toUpperCase()}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">
                        {log.userEmail || (log.userEmail ? `${log.userEmail}` : 'System')}
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
              <Pagination
                page={pagination.page}
                pageCount={pagination.pageCount}
                onPageChange={(page: number) => setPagination((prev) => ({ ...prev, page }))}
              />
            )}
          </>
        )}
      </Box>
    </Main>
  );
};

export { LogsPage };
