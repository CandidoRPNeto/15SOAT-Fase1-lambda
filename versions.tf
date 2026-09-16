terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# Credenciais via variáveis de ambiente padrão da AWS
# (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY ou um profile) — nunca em
# arquivo versionado.
provider "aws" {
  region = var.aws_region
}
