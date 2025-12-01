# Strapi Audit Logs Plugin

A comprehensive audit logging plugin for Strapi v5 that tracks all content type changes including create, update, delete, publish, and unpublish actions.

## Features

- ✅ Track all content type changes (create, update, delete, publish, unpublish)
- ✅ Enable/disable audit logging per content type
- ✅ View audit logs with filtering by content type
- ✅ Detailed change tracking with before/after values
- ✅ User information tracking (user ID, email)
- ✅ IP address and user agent logging
- ✅ Direct link to view entities in Content Manager
- ✅ Hidden content types (not visible in Content Manager or Content-Type Builder)
- ✅ Well-structured service-based architecture
- ✅ TypeScript support with comprehensive type definitions

## Installation

```bash
npm install strapi-plugin-audit-logs
# or
yarn add strapi-plugin-audit-logs
```

## Configuration

The plugin is automatically available in your Strapi admin panel after installation. Navigate to the **Audit Logs** section in the sidebar.

## Usage

### Enabling Audit Logging

1. Go to **Audit Logs** in the Strapi admin panel
2. Toggle the switch for each content type you want to track
3. Audit logs will be automatically created for all changes to enabled content types

### Viewing Audit Logs

1. Navigate to **Audit Logs** → **Logs**
2. Filter by content type if needed
3. Click the link icon to view the entity in Content Manager

## What Gets Logged

The plugin automatically logs the following actions:

- **Create**: When a new entity is created
- **Update**: When an entity is updated
- **Delete**: When an entity is deleted
- **Publish**: When an entity is published
- **Unpublish**: When an entity is unpublished

Each log entry includes:

- Content type and entity ID
- Action type
- User information (ID and email)
- Timestamp
- Previous values (for update/delete)
- New values (for create/update)
- Changes (for update operations, showing field-by-field differences)
- IP address and user agent

## Architecture

The plugin follows a clean, service-based architecture:

### Service Methods

The audit logs service provides the following methods:

- `isEnabled(contentType)` - Check if audit logging is enabled for a content type
- `setEnabled(contentType, enabled)` - Enable/disable audit logging for a content type
- `getContentTypeSettings()` - Get all content types with their audit log settings
- `getContentTypeSettingsPaginated(page, pageSize, search)` - Get paginated content type settings
- `createLog(data)` - Create an audit log entry
- `getLogs(contentType, entityId, limit)` - Get audit logs for a content type
- `getLogsPaginated(contentType, page, pageSize, search)` - Get paginated audit logs

### Helper Methods

The service also includes helper methods used internally:

- `parseApiUrl(url)` - Parse API URL to extract API name and entity ID
- `findContentTypeByPluralName(pluralName)` - Find content type by plural name
- `fetchPreviousEntity(contentType, entityId)` - Fetch previous entity state before modification
- `extractEntityId(urlParts, responseData, originalBody)` - Extract entity ID from various sources
- `calculateChanges(previousEntity, newEntity)` - Calculate changes between entity states
- `getActionFromMethod(method, url)` - Determine audit action from HTTP method and URL
- `shouldProcessRequest(method, url, status)` - Check if request should be processed
- `needsPreviousEntity(method, url)` - Check if previous entity needs to be fetched
- `getUserFromContext(ctx)` - Extract user information from request context
- `createAuditLogEntry(...)` - Create audit log entry with all necessary data

### Type Definitions

All TypeScript types are centralized in `server/src/types/index.ts`:

- `AuditAction` - Type for audit actions (create, update, delete, publish, unpublish)
- `ContentType` - Type for Strapi content types
- `KoaContext` - Type for Koa request context
- `ParsedUrl` - Interface for parsed API URLs
- `AuditLogData` - Interface for audit log entry data

### Project Structure

```
src/plugins/audit-logs/
├── admin/              # Admin panel UI
│   └── src/
│       ├── api/       # API client functions
│       ├── components/ # React components
│       └── pages/     # Admin pages
├── server/            # Server-side code
│   └── src/
│       ├── bootstrap.ts    # Middleware setup
│       ├── controllers/    # API controllers
│       ├── content-types/  # Content type schemas
│       ├── routes/         # API routes
│       ├── services/       # Business logic service
│       └── types/          # TypeScript type definitions
└── README.md
```

## Requirements

- Strapi v5.31.2 or higher
- Node.js 18.x or higher

## Development

### Building the Plugin

```bash
npm run build
```

### Watching for Changes

```bash
npm run watch
```

### Type Checking

```bash
npm run test:ts:front  # Check admin TypeScript
npm run test:ts:back   # Check server TypeScript
```

## License

MIT
