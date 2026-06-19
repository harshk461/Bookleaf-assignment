/**
 * Generates docs/api/openapi.yaml from Zod schemas.
 * Run: npm run openapi:generate -w apps/backend
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify as yamlStringify } from 'yaml';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { loginBodySchema } from '../src/schemas/auth.schema.js';
import { bookIdParamsSchema } from '../src/schemas/books.schema.js';
import {
  adminTicketsQuerySchema,
  createTicketBodySchema,
  messageBodySchema,
  patchTicketBodySchema,
  ticketIdParamsSchema,
  attachmentIdParamsSchema,
} from '../src/schemas/tickets.schema.js';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const errorResponse = {
  description: 'Error',
  content: {
    'application/json': {
      schema: z.object({ message: z.string(), statusCode: z.number().optional() }),
    },
  },
};

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Health check',
  responses: { 200: { description: 'Service health status' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Login',
  request: { body: { content: { 'application/json': { schema: loginBodySchema } } } },
  responses: {
    200: { description: 'JWT token and user profile' },
    400: errorResponse,
    401: errorResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  summary: 'Current user profile',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'User profile' }, 401: errorResponse },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  summary: 'Logout (stateless — client clears JWT)',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'Logged out' }, 401: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/author/books',
  summary: 'List author books',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'Array of books' }, 401: errorResponse, 403: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/author/books/{bookId}',
  summary: 'Get book detail',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: bookIdParamsSchema },
  responses: {
    200: { description: 'Book detail' },
    401: errorResponse,
    403: errorResponse,
    404: errorResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/author/books/{bookId}/sales',
  summary: 'Book sales breakdown',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: bookIdParamsSchema },
  responses: { 200: { description: 'Sales rows' }, 401: errorResponse, 404: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/author/tickets',
  summary: 'List author tickets',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'Array of tickets' }, 401: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/author/tickets/stream',
  summary: 'SSE stream of author tickets',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'text/event-stream' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/author/tickets/{id}/stream',
  summary: 'SSE stream of single ticket',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: ticketIdParamsSchema },
  responses: { 200: { description: 'text/event-stream' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/author/tickets/{id}',
  summary: 'Get author ticket',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: ticketIdParamsSchema },
  responses: { 200: { description: 'Ticket with messages' }, 404: errorResponse },
});

registry.registerPath({
  method: 'post',
  path: '/api/author/tickets',
  summary: 'Create ticket (triggers AI classify)',
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { 'application/json': { schema: createTicketBodySchema } } } },
  responses: { 201: { description: 'Created ticket' }, 400: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/author/tickets/{id}/attachments/{attachmentId}',
  summary: 'Download ticket attachment',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: attachmentIdParamsSchema },
  responses: { 200: { description: 'File download' }, 404: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/tickets',
  summary: 'Admin ticket queue',
  security: [{ [bearerAuth.name]: [] }],
  request: { query: adminTicketsQuerySchema },
  responses: { 200: { description: 'Filtered ticket list' }, 401: errorResponse, 403: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/tickets/stream',
  summary: 'SSE stream of admin ticket queue',
  security: [{ [bearerAuth.name]: [] }],
  request: { query: adminTicketsQuerySchema },
  responses: { 200: { description: 'text/event-stream' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/tickets/{id}',
  summary: 'Get admin ticket with cached AI draft',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: ticketIdParamsSchema },
  responses: { 200: { description: 'Ticket detail' }, 404: errorResponse },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/tickets/{id}',
  summary: 'Update ticket status, category, priority, assignee',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: ticketIdParamsSchema,
    body: { content: { 'application/json': { schema: patchTicketBodySchema } } },
  },
  responses: { 200: { description: 'Updated ticket' }, 400: errorResponse, 404: errorResponse },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/tickets/{id}/draft',
  summary: 'Generate or regenerate AI draft response',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: ticketIdParamsSchema },
  responses: { 200: { description: 'AI draft content' }, 404: errorResponse, 503: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/tickets/{id}/attachments/{attachmentId}',
  summary: 'Download ticket attachment',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: attachmentIdParamsSchema },
  responses: { 200: { description: 'File download' }, 404: errorResponse },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/tickets/{id}/responses',
  summary: 'Send admin response to author',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: ticketIdParamsSchema,
    body: { content: { 'application/json': { schema: messageBodySchema } } },
  },
  responses: { 200: { description: 'Updated ticket' }, 400: errorResponse },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/tickets/{id}/notes',
  summary: 'List internal notes',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: ticketIdParamsSchema },
  responses: { 200: { description: 'Internal notes' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/tickets/{id}/notes',
  summary: 'Add internal note',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: ticketIdParamsSchema,
    body: { content: { 'application/json': { schema: messageBodySchema } } },
  },
  responses: { 201: { description: 'Created note' }, 400: errorResponse },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const document = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'BookLeaf Author Support API',
    version: '0.2.0',
    description: 'REST API for author and admin portals',
  },
  servers: [{ url: 'http://localhost:4000' }],
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../../../docs/api/openapi.yaml');
fs.writeFileSync(outPath, yamlStringify(document));
console.log(`OpenAPI spec written to ${outPath}`);
