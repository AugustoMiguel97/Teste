#!/bin/bash

# Script de Deploy para Hospital Meal System
# Use: ./deploy.sh seu-usuario@seu-vps.com

set -e

if [ -z "$1" ]; then
    echo "❌ Uso: ./deploy.sh usuario@seu-vps.com"
    echo "Exemplo: ./deploy.sh root@192.168.1.100"
    exit 1
fi

SERVER=$1
APP_DIR="/var/www/hospital-meals"
GIT_REPO="seu_repositorio_git_aqui" # Altere para seu repositório

echo "🚀 Iniciando deploy para $SERVER..."

# Função para executar comando no servidor
run_remote() {
    ssh $SERVER "cd $APP_DIR && $1"
}

# 1. Conectar e clonar/atualizar repo
echo "📦 Clonando/atualizando repositório..."
ssh $SERVER << 'EOF'
    if [ ! -d "/var/www/hospital-meals" ]; then
        git clone $GIT_REPO /var/www/hospital-meals
    else
        cd /var/www/hospital-meals
        git pull origin main
    fi
EOF

# 2. Instalar dependências
echo "📚 Instalando dependências..."
run_remote "npm install --production"

# 3. Executar migrações
echo "🗄️ Executando migrações do banco..."
run_remote "npm run migrate"

# 4. Parar aplicação anterior
echo "⏹️ Parando aplicação anterior..."
run_remote "pm2 delete hospital-meals-api || true"

# 5. Iniciar nova aplicação
echo "▶️ Iniciando aplicação..."
run_remote "pm2 start server.js --name 'hospital-meals-api' && pm2 save"

# 6. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
ssh $SERVER "systemctl reload nginx"

echo "✅ Deploy concluído com sucesso!"
echo ""
echo "Próximos passos:"
echo "1. Verificar logs: ssh $SERVER 'pm2 logs hospital-meals-api'"
echo "2. Testar API: curl https://seu-dominio.com/api/health"
echo "3. Acessar app: https://seu-dominio.com"
