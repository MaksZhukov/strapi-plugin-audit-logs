const routes = [
  {
    method: 'GET',
    path: '/content-type-settings',
    handler: 'controller.getContentTypeSettings',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'PUT',
    path: '/content-type-settings/:contentType',
    handler: 'controller.updateContentTypeSetting',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/logs',
    handler: 'controller.getLogs',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/logs/:contentType/:entityId',
    handler: 'controller.getEntityLogs',
    config: {
      policies: [],
      auth: false,
    },
  },
];

export default {
  admin: {
    type: 'admin',
    routes: routes,
  },
};
