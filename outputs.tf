output "api_endpoint" {
  description = "URL pública do endpoint de auth — POST {api_endpoint}/auth/cpf."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "lambda_function_name" {
  value = aws_lambda_function.cpf_auth.function_name
}
