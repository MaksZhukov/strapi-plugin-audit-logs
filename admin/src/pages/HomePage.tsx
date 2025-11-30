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

interface ContentTypeSetting {
  contentType: string;
  enabled: boolean;
}

const HomePage = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ContentTypeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/audit-logs/content-type-settings');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      const data = await response.json();
      setSettings(data.data || []);
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
      setSuccess(null);

      const response = await fetch(
        `/audit-logs/content-type-settings/${encodeURIComponent(contentType)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to update setting');
      }

      const result = await response.json();

      // Update local state
      setSettings((prev) =>
        prev.map((s) => (s.contentType === contentType ? { ...s, enabled } : s))
      );

      setSuccess(formatMessage({ id: getTranslation('homepage.saveSuccess') }));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Toggle error:', err);
      setError(err.message || formatMessage({ id: getTranslation('homepage.saveError') }));
    } finally {
      setUpdating(null);
    }
  };

  const getContentTypeDisplayName = (uid: string) => {
    // Extract the content type name from uid (e.g., "api::article.article" -> "Article")
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

        {success && (
          <Box paddingBottom={4}>
            <Alert closeLabel="Close" title="Success" variant="success">
              {success}
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
              <Th>
                <Typography variant="sigma">
                  {formatMessage({ id: getTranslation('homepage.actions') })}
                </Typography>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {settings.map((setting) => (
              <Tr key={setting.contentType}>
                <Td>
                  <Typography textColor="neutral800">
                    {getContentTypeDisplayName(setting.contentType)}
                  </Typography>
                  <Typography variant="pi" textColor="neutral600">
                    {setting.contentType}
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

        {settings.length === 0 && (
          <Box padding={8} textAlign="center">
            <Typography variant="omega" textColor="neutral600">
              No content types found
            </Typography>
          </Box>
        )}
      </Box>
    </Main>
  );
};

export { HomePage };
