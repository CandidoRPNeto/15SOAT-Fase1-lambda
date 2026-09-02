import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { signClientJwt } from '../src/jwt.js';

function testKeyPair() {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

test('signs a token that verifies with the matching public key', () => {
  const { privateKey, publicKey } = testKeyPair();

  const token = signClientJwt({
    userId: 42,
    privateKey,
    issuer: 'workshop-os-lambda-auth',
    expiresInSeconds: 300,
  });

  const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
  assert.equal(decoded.sub, '42');
  assert.equal(decoded.iss, 'workshop-os-lambda-auth');
  assert.ok(decoded.exp && decoded.exp > Date.now() / 1000);
});

test('rejects verification with a different key pair', () => {
  const { privateKey } = testKeyPair();
  const { publicKey: otherPublicKey } = testKeyPair();

  const token = signClientJwt({
    userId: 1,
    privateKey,
    issuer: 'workshop-os-lambda-auth',
    expiresInSeconds: 300,
  });

  assert.throws(() => jwt.verify(token, otherPublicKey, { algorithms: ['RS256'] }));
});
