import jwt from 'jsonwebtoken';

/**
 * Emite o JWT (RS256) que a app principal aceita via seu guard `client_jwt`
 * (15SOAT-Fase1/app/Providers/AppServiceProvider.php). RS256 escolhido pra
 * não precisar sincronizar segredo simétrico entre AWS e Dokploy — só a
 * chave pública precisa existir do outro lado (ver RFC-003, ADR
 * correspondente em 15SOAT-Fase1).
 */
export interface ClientJwtParams {
  userId: number;
  privateKey: string;
  issuer: string;
  /** Segundos até expirar. Curto de propósito — sem refresh token nesta fase (ver RFC-003, "Perguntas em aberto"). */
  expiresInSeconds: number;
}

export function signClientJwt({ userId, privateKey, issuer, expiresInSeconds }: ClientJwtParams): string {
  return jwt.sign({}, privateKey, {
    algorithm: 'RS256',
    subject: String(userId),
    issuer,
    expiresIn: expiresInSeconds,
  });
}
