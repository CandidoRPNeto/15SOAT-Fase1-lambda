# Empacota o bundle já gerado por `npm run build` (dist/handler.js, ver
# package.json) — Terraform não builda o TypeScript, só empacota o
# resultado. Rodar `npm run build` antes de `terraform plan`/`apply`
# (o CI faz isso, ver .github/workflows/deploy.yml).
data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/dist/handler.js"
  output_path = "${path.module}/dist/handler.zip"
}

resource "aws_iam_role" "lambda_exec" {
  name = "15SOAT-Fase1-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Só CloudWatch Logs — este Lambda não toca em nenhum outro recurso AWS
# (o acesso a dados do cliente é via HTTPS pro endpoint interno da app,
# não via SDK da AWS, ver RFC-003 em 15SOAT-Fase1).
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "cpf_auth" {
  function_name = "15SOAT-Fase1-cpf-auth"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "handler.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 128

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  environment {
    variables = {
      APP_BASE_URL     = var.app_base_url
      INTERNAL_API_KEY = var.internal_api_key
      JWT_PRIVATE_KEY  = var.jwt_private_key
      JWT_ISSUER       = var.jwt_issuer
      JWT_TTL_SECONDS  = tostring(var.jwt_ttl_seconds)
    }
  }
}

# HTTP API (não REST API) — mais barata e simples pra um único endpoint
# proxy-Lambda, ver ADR-007 em 15SOAT-Fase1.
resource "aws_apigatewayv2_api" "auth" {
  name          = "15SOAT-Fase1-auth"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "cpf_auth" {
  api_id                 = aws_apigatewayv2_api.auth.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.cpf_auth.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "cpf_auth" {
  api_id    = aws_apigatewayv2_api.auth.id
  route_key = "POST /auth/cpf"
  target    = "integrations/${aws_apigatewayv2_integration.cpf_auth.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.auth.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cpf_auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.auth.execution_arn}/*/*"
}
