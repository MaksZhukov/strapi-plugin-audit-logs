import React, { useState, useEffect } from 'react';
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
  Switch,
  Button,
  Flex,
  Alert,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Eye } from '@strapi/icons';
import { getTranslation } from '../utils/getTranslation';
import { fetchContentTypeSettings, updateContentTypeSetting } from '../api/api';
import { ContentTypeSetting } from '../api/types';
import { Pagination } from '../components/Pagination';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ContentTypeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    pageCount: 0,
  });

  useEffect(() => {
    loadSettings();
  }, [pagination.page, pagination.pageSize]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchContentTypeSettings(pagination.page, pagination.pageSize, '');
      setSettings(result.results);
      setPagination(result.pagination);
    } catch (err) {
      setError(formatMessage({ id: getTranslation('homepage.error') }));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (contentType: string, enabled: boolean) => {
    try {
      setUpdating(contentType);
      setError(null);

      await updateContentTypeSetting(contentType, enabled);

      setSettings((prev) =>
        prev.map((s) => (s.contentType === contentType ? { ...s, enabled } : s))
      );
    } catch (err: any) {
      console.error('Toggle error:', err);
      setError(err.message || formatMessage({ id: getTranslation('homepage.saveError') }));
    } finally {
      setUpdating(null);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const getContentTypeDisplayName = (uid: string) => {
    const parts = uid.split('.');
    if (parts.length > 1) {
      const name = parts[parts.length - 1];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return uid;
  };

  if (loading) {
    return (
      <Main>
        <Box padding={8}>
          <Typography variant="alpha">
            {formatMessage({ id: getTranslation('homepage.loading') })}
          </Typography>
        </Box>
      </Main>
    );
  }

  return (
    <Main>
      <Box padding={8}>
        <Box paddingBottom={4}>
          <Typography variant="alpha" as="h1">
            {formatMessage({ id: getTranslation('homepage.title') })}
          </Typography>
          <Typography variant="omega" textColor="neutral600" as="p">
            {formatMessage({ id: getTranslation('homepage.description') })}
          </Typography>
        </Box>

        {error && (
          <Box paddingBottom={4}>
            <Alert closeLabel="Close" title="Error" variant="danger">
              {error}
            </Alert>
          </Box>
        )}

        <Table colCount={3} rowCount={settings.length}>
          <Thead>
            <Tr>
              <Th>
                <Typography variant="sigma">
                  {formatMessage({ id: getTranslation('homepage.contentType') })}
                </Typography>
              </Th>
              <Th>
                <Typography variant="sigma">
                  {formatMessage({ id: getTranslation('homepage.enabled') })}
                </Typography>
              </Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {settings.map((setting) => (
              <Tr key={setting.contentType}>
                <Td>
                  <Typography textColor="neutral800">
                    {getContentTypeDisplayName(setting.contentType)}
                  </Typography>
                </Td>
                <Td>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={(checked: boolean) =>
                      handleToggle(setting.contentType, checked)
                    }
                    disabled={updating === setting.contentType}
                    label={setting.enabled ? 'Audit logging enabled' : 'Audit logging disabled'}
                  />
                </Td>
                <Td>
                  <Flex gap={2}>
                    <Button
                      variant="tertiary"
                      size="S"
                      startIcon={<Eye />}
                      onClick={() =>
                        navigate(
                          `/plugins/audit-logs/logs?contentType=${encodeURIComponent(setting.contentType)}`
                        )
                      }
                    >
                      {formatMessage({ id: getTranslation('homepage.viewLogs') })}
                    </Button>
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {settings.length === 0 && !loading && (
          <Box padding={8} textAlign="center">
            <Typography variant="omega" textColor="neutral600">
              No content types found
            </Typography>
          </Box>
        )}

        {pagination.pageCount > 1 && (
          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            onPageChange={handlePageChange}
          />
        )}
      </Box>
    </Main>
  );
};

export { HomePage };
