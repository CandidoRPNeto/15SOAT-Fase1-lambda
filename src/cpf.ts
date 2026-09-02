/**
 * Validação de CPF por dígito verificador (algoritmo público da Receita
 * Federal) — só checksum, sem chamada a serviço externo. Consistente com a
 * convenção de stubs do projeto principal (15SOAT-Fase1/CLAUDE.md regra 7:
 * "não implementar integrações reais"), ver RFC-003.
 */

/** Remove tudo que não for dígito — aceita CPF com ou sem pontuação. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function checkDigit(digits: string, weightStart: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[i]) * (weightStart - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Valida o CPF (formatado ou só dígitos). Rejeita sequências com todos os
 * dígitos iguais (ex.: "000.000.000-00", "111.111.111-11") — matematicamente
 * "válidas" pelo checksum, mas nunca emitidas de verdade pela Receita.
 */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const firstCheck = checkDigit(digits.slice(0, 9), 10);
  const secondCheck = checkDigit(digits.slice(0, 10), 11);

  return firstCheck === Number(digits[9]) && secondCheck === Number(digits[10]);
}
