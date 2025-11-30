import { Page } from '@strapi/strapi/admin';
import { Routes, Route } from 'react-router-dom';

import { HomePage } from './HomePage';
import { LogsPage } from './LogsPage';
import { DesignSystemProvider } from '@strapi/design-system';
import { Box } from '@strapi/design-system';

const App = () => {
  return (
    <DesignSystemProvider>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="*" element={<Page.Error />} />
      </Routes>
    </DesignSystemProvider>
  );
};

export { App };
