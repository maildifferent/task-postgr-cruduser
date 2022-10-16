export const config = Object.freeze({
  isProduction: process.env['PROD_FLAG'] || false,
  port: process.env['PORT'] || 8080,
  jwtSecret: process.env['JWT_32CHAR_SECRET'] || 'MxnflwpEKNPgyYHfFZ7iMQHemtb4sJXt',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '30m',
} as const)