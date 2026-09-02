# workshop-os-lambda-auth

Function Serverless (AWS Lambda) da Fase 3 do Workshop OS — valida o CPF do
cliente, consulta sua existência/status na base de dados da aplicação
principal, e emite um token JWT para consumo das APIs protegidas atrás do
API Gateway.

Parte do split em 4 repositórios da Fase 3 do projeto
[15SOAT-Fase1](https://github.com/CandidoRPNeto/15SOAT-Fase1) — requisito
completo em [`evolucao_fase3`](https://github.com/CandidoRPNeto/15SOAT-Fase1/blob/master/evolucao_fase3)
daquele repositório, decisões arquiteturais em
[`docs/architecture/`](https://github.com/CandidoRPNeto/15SOAT-Fase1/tree/master/docs/architecture)
(ver [ADR-002](https://github.com/CandidoRPNeto/15SOAT-Fase1/blob/master/docs/architecture/adrs/adr-002-four-repo-split.md)).

**Status**: scaffolding — implementação em
[epic 5](https://github.com/CandidoRPNeto/15SOAT-Fase1/blob/master/backlog.md#epic-5--auth-lambda--api-gateway--jwt-validation)
(runtime, alg. do JWT e estratégia de acesso ao banco ainda não decididos —
ver RFC-003, a ser escrito nesse epic).

## Propósito

_(preenchido no epic 5)_ — CPF → status do cliente → JWT.

## Tecnologias

_(preenchido no epic 5)_ — AWS Lambda + AWS API Gateway (decisão registrada
em RFC-001/ADR-007 do repo principal).

## Execução e deploy

_(preenchido no epic 5)_

## Diagrama de arquitetura

_(preenchido no epic 5 — diagrama de sequência do fluxo de autenticação)_

## Swagger / Postman

_(preenchido no epic 5 — este serviço não expõe Swagger próprio; ver a
collection Postman do repo principal para o fluxo de auth ponta a ponta)_
