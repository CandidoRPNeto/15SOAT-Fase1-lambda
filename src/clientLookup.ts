/**
 * Chama o endpoint interno da app principal — único jeito que este Lambda
 * tem de saber se um CPF corresponde a um cliente e qual seu status.
 * Nunca acessa o Postgres diretamente (decisão de segurança, RFC-003 §1 em
 * 15SOAT-Fase1).
 */
export interface ClientLookupResult {
  exists: boolean;
  userId?: number;
  status?: 'active' | 'blocked';
}

export interface ClientLookupParams {
  cpfDigits: string;
  appBaseUrl: string;
  internalApiKey: string;
  /** Injetável pra teste — default é o fetch global do runtime Node 18+/Lambda. */
  fetchImpl?: typeof fetch;
}

export async function lookupClientByCpf({
  cpfDigits,
  appBaseUrl,
  internalApiKey,
  fetchImpl = fetch,
}: ClientLookupParams): Promise<ClientLookupResult> {
  const response = await fetchImpl(`${appBaseUrl}/internal/clients/cpf-lookup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Api-Key': internalApiKey,
    },
    body: JSON.stringify({ cpf_cnpj: cpfDigits }),
  });

  if (response.status === 404) {
    return { exists: false };
  }

  if (!response.ok) {
    throw new Error(`internal cpf-lookup failed with status ${response.status}`);
  }

  const body = (await response.json()) as { exists: boolean; user_id: number; status: 'active' | 'blocked' };

  return { exists: body.exists, userId: body.user_id, status: body.status };
}
