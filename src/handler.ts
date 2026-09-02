import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { isValidCpf, onlyDigits } from './cpf.js';
import { lookupClientByCpf } from './clientLookup.js';
import { signClientJwt } from './jwt.js';

/**
 * Handler HTTP API v2 (AWS API Gateway, ver ADR-007 em 15SOAT-Fase1) —
 * POST /auth/cpf { cpf }. Fluxo completo em
 * 15SOAT-Fase1/docs/architecture/diagrams/sequence-auth.md.
 *
 * Variáveis de ambiente (definidas pelo Terraform, ver main.tf — nunca
 * hardcoded): APP_BASE_URL, INTERNAL_API_KEY, JWT_PRIVATE_KEY, JWT_ISSUER.
 */
function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  let cpf: unknown;
  try {
    cpf = event.body ? (JSON.parse(event.body) as { cpf?: unknown }).cpf : undefined;
  } catch {
    return jsonResponse(400, { message: 'Corpo da requisição inválido — esperado JSON.' });
  }

  if (typeof cpf !== 'string' || !isValidCpf(cpf)) {
    return jsonResponse(400, { message: 'CPF inválido.' });
  }

  const appBaseUrl = requireEnv('APP_BASE_URL');
  const internalApiKey = requireEnv('INTERNAL_API_KEY');
  const jwtPrivateKey = requireEnv('JWT_PRIVATE_KEY');
  const jwtIssuer = process.env.JWT_ISSUER ?? 'workshop-os-lambda-auth';
  const jwtTtlSeconds = Number(process.env.JWT_TTL_SECONDS ?? 900);

  const lookup = await lookupClientByCpf({
    cpfDigits: onlyDigits(cpf),
    appBaseUrl,
    internalApiKey,
  });

  if (!lookup.exists || lookup.status !== 'active') {
    // Mesma resposta pra "não existe" e "existe mas bloqueado" — não vaza
    // qual dos dois casos aconteceu (mesma postura do guard client_jwt no
    // lado da app, ver RFC-003).
    return jsonResponse(403, { message: 'Cliente não encontrado ou inativo.' });
  }

  const token = signClientJwt({
    userId: lookup.userId!,
    privateKey: jwtPrivateKey,
    issuer: jwtIssuer,
    expiresInSeconds: jwtTtlSeconds,
  });

  return jsonResponse(200, { token, token_type: 'Bearer', expires_in: jwtTtlSeconds });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
