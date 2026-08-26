#!/bin/bash

# Script de Backup do Banco de Dados
# Crie um cron job para executar diariamente

set -e

# Configuração
DB_USER="hospital_user"
DB_NAME="hospital_meals"
DB_HOST="localhost"
BACKUP_DIR="/var/backups/hospital-meals"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/hospital_meals_$TIMESTAMP.sql"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

echo "🔄 Iniciando backup do banco de dados..."

# Fazer backup
PGPASSWORD="${DB_PASSWORD}" pg_dump -U $DB_USER -h $DB_HOST $DB_NAME > $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Backup criado: $BACKUP_FILE"

# Manter apenas últimos 7 dias
echo "🧹 Limpando backups antigos..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "✅ Backup concluído com sucesso!"
echo ""
echo "📍 Arquivo: $BACKUP_FILE"
echo "📊 Tamanho: $(du -h $BACKUP_FILE | cut -f1)"

# Opcional: Enviar para S3/Google Cloud
# aws s3 cp $BACKUP_FILE s3://seu-bucket-backup/hospital-meals/
