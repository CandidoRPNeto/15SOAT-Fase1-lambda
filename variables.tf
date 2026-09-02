variable "aws_region" {
  description = "Região AWS onde o Lambda e o API Gateway são provisionados."
  type        = string
  default     = "us-east-1"
}

variable "app_base_url" {
  description = "URL base da aplicação principal (Dokploy) — o Lambda chama POST {app_base_url}/internal/clients/cpf-lookup. Sem default: depende do domínio real (ver 15SOAT-Fase1-kubernetes)."
  type        = string
}

variable "internal_api_key" {
  description = "Segredo compartilhado com a app principal (LAMBDA_INTERNAL_API_KEY do lado de lá) — header X-Internal-Api-Key. Sensível, sem default."
  type        = string
  sensitive   = true
}

variable "jwt_private_key" {
  description = "Chave privada RS256 (PEM) usada pra assinar o JWT do cliente. A chave pública correspondente vai na env CLIENT_JWT_PUBLIC_KEY da app principal — nunca a privada. Sensível, sem default."
  type        = string
  sensitive   = true
}

variable "jwt_issuer" {
  description = "Claim `iss` do JWT emitido — precisa bater com CLIENT_JWT_ISSUER na app principal."
  type        = string
  default     = "15SOAT-Fase1-lambda"
}

variable "jwt_ttl_seconds" {
  description = "Tempo de expiração do JWT emitido, em segundos."
  type        = number
  default     = 900
}
