import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: process.env.SWAGGER_TITLE || 'NestJS API',
  description:
    process.env.SWAGGER_DESCRIPTION ||
    'API documentation for NestJS application',
  version: process.env.SWAGGER_VERSION || '1.0.0',
  path: process.env.SWAGGER_PATH || 'api/docs',
  enabled: process.env.SWAGGER_ENABLED !== 'false', // Default to true unless explicitly disabled
  tags: process.env.SWAGGER_TAGS ? process.env.SWAGGER_TAGS.split(',') : [],
  servers: process.env.SWAGGER_SERVERS
    ? JSON.parse(process.env.SWAGGER_SERVERS)
    : [{ url: 'http://localhost:3000', description: 'Development server' }],
  contact: {
    name: process.env.SWAGGER_CONTACT_NAME || undefined,
    email: process.env.SWAGGER_CONTACT_EMAIL || undefined,
    url: process.env.SWAGGER_CONTACT_URL || undefined,
  },
  license: {
    name: process.env.SWAGGER_LICENSE_NAME || undefined,
    url: process.env.SWAGGER_LICENSE_URL || undefined,
  },
  externalDocs: {
    description: process.env.SWAGGER_EXTERNAL_DOCS_DESC || undefined,
    url: process.env.SWAGGER_EXTERNAL_DOCS_URL || undefined,
  },
  security: {
    bearerAuth: process.env.SWAGGER_BEARER_AUTH === 'true',
    apiKey: process.env.SWAGGER_API_KEY === 'true',
    oauth2: process.env.SWAGGER_OAUTH2 === 'true',
  },
}));
