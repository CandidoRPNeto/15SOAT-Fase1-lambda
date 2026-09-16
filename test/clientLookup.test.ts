import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookupClientByCpf } from '../src/clientLookup.js';

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }) as Response) as typeof fetch;
}

test('returns exists=true with user id and status for an active client', async () => {
  const result = await lookupClientByCpf({
    cpfDigits: '11144477735',
    appBaseUrl: 'https://app.example.com',
    internalApiKey: 'secret',
    fetchImpl: fakeFetch(200, { exists: true, user_id: 7, status: 'active' }),
  });

  assert.deepEqual(result, { exists: true, userId: 7, status: 'active' });
});

test('returns exists=true with status blocked for a blocked client', async () => {
  const result = await lookupClientByCpf({
    cpfDigits: '11144477735',
    appBaseUrl: 'https://app.example.com',
    internalApiKey: 'secret',
    fetchImpl: fakeFetch(200, { exists: true, user_id: 7, status: 'blocked' }),
  });

  assert.equal(result.status, 'blocked');
});

test('returns exists=false on a 404 without throwing', async () => {
  const result = await lookupClientByCpf({
    cpfDigits: '00000000000',
    appBaseUrl: 'https://app.example.com',
    internalApiKey: 'secret',
    fetchImpl: fakeFetch(404, { exists: false }),
  });

  assert.deepEqual(result, { exists: false });
});

test('throws on an unexpected error status (e.g. wrong internal api key -> 401)', async () => {
  await assert.rejects(
    lookupClientByCpf({
      cpfDigits: '11144477735',
      appBaseUrl: 'https://app.example.com',
      internalApiKey: 'wrong',
      fetchImpl: fakeFetch(401, { message: 'Não autorizado.' }),
    })
  );
});

test('sends the CPF as digits-only in the request body', async () => {
  let capturedBody: string | undefined;
  const captureFetch = (async (_url: string, init: RequestInit) => {
    capturedBody = init.body as string;
    return { ok: true, status: 200, json: async () => ({ exists: false }) } as Response;
  }) as typeof fetch;

  await lookupClientByCpf({
    cpfDigits: '11144477735',
    appBaseUrl: 'https://app.example.com',
    internalApiKey: 'secret',
    fetchImpl: captureFetch,
  });

  assert.deepEqual(JSON.parse(capturedBody!), { cpf_cnpj: '11144477735' });
});
