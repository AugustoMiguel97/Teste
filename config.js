/**
 * config.js - Configuração do Frontend
 *
 * Este arquivo é carregado antes do app principal.
 * Em PRODUÇÃO: altere API_URL para a URL real do seu backend.
 * Em DESENVOLVIMENTO: deixe apontando para localhost:3000.
 *
 * Como usar:
 *   1. Adicione no index.html (antes do </body>):
 *      <script src="config.js"></script>
 *
 *   2. No servidor de produção, sirva este arquivo com a URL correta.
 *      Ou gere automaticamente com um script de build.
 *
 * Exemplos de URL:
 *   Heroku:        https://seu-app.herokuapp.com/api
 *   DigitalOcean:  https://seu-dominio.com/api
 *   AWS:           https://api.seu-dominio.com/api
 */

window.API_URL = 'http://localhost:3000/api'; // ← Altere em produção
