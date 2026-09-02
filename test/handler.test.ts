import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { handler } from '../src/handler.js';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const VALID_CPF = '111.444.777-35'; // ver test/cpf.test.ts pela conferência do dígito verificador

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function withEnv(overrides: Record<string, string>, run: () => Promise<void>): Promise<void> {
  const previous = { ...process.env };
  Object.assign(process.env, overrides);
  return run().finally(() => {
    process.env = previous;
  });
}

function makeEvent(body: unknown): APIGatewayProxyEventV2 {
  return { body: JSON.stringify(body) } as APIGatewayProxyEventV2;
}

test('returns 400 for a CPF that fails the checksum', async () => {
  const response = await handler(makeEvent({ cpf: '111.444.777-34' }));
  assert.equal(response.statusCode, 400);
});

test('returns 400 when the body has no cpf field', async () => {
  const response = await handler(makeEvent({}));
  assert.equal(response.statusCode, 400);
});

test('returns 403 when the client lookup finds nothing (without leaking why)', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 404 }) as Response);

  await withEnv(
    {
      APP_BASE_URL: 'https://app.example.com',
      INTERNAL_API_KEY: 'internal-secret',
      JWT_PRIVATE_KEY: privateKey,
    },
    async () => {
      const response = await handler(makeEvent({ cpf: VALID_CPF }));
      assert.equal(response.statusCode, 403);
    }
  );
});

test('returns 403 for a blocked client (same status as not-found)', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      ({ ok: true, status: 200, json: async () => ({ exists: true, user_id: 5, status: 'blocked' }) }) as Response
  );

  await withEnv(
    {
      APP_BASE_URL: 'https://app.example.com',
      INTERNAL_API_KEY: 'internal-secret',
      JWT_PRIVATE_KEY: privateKey,
    },
    async () => {
      const response = await handler(makeEvent({ cpf: VALID_CPF }));
      assert.equal(response.statusCode, 403);
    }
  );
});

test('returns a valid JWT for an active client', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      ({ ok: true, status: 200, json: async () => ({ exists: true, user_id: 42, status: 'active' }) }) as Response
  );

  await withEnv(
    {
      APP_BASE_URL: 'https://app.example.com',
      INTERNAL_API_KEY: 'internal-secret',
      JWT_PRIVATE_KEY: privateKey,
      JWT_ISSUER: 'workshop-os-lambda-auth',
    },
    async () => {
      const response = await handler(makeEvent({ cpf: VALID_CPF }));
      assert.equal(response.statusCode, 200);

      const { token } = JSON.parse(response.body as string);
      const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
      assert.equal(decoded.sub, '42');
      assert.equal(decoded.iss, 'workshop-os-lambda-auth');
    }
  );
});
