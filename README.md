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
- Changes (for update operations)
- IP address and user agent

## Requirements

- Strapi v5.31.2 or higher
- Node.js 18.x or higher

## License

MIT
