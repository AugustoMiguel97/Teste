const pool = require('./db');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('Iniciando criação das tabelas...');

    // Criar tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'colaborador',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabela users criada');

    // Criar tabela de cardápio
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu (
        id SERIAL PRIMARY KEY,
        meal_date DATE NOT NULL,
        meal_time TIME NOT NULL,
        description VARCHAR(255) NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabela menu criada');

    // Criar tabela de solicitações
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meal_id INTEGER NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
        meal_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pendente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, meal_id)
      );
    `);
    console.log('✓ Tabela requests criada');

    // Criar índices para melhor performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_menu_date ON menu(meal_date);
      CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_requests_meal ON requests(meal_id);
    `);
    console.log('✓ Índices criados');

    // Verificar se já existe admin
    const adminCheck = await pool.query(
      "SELECT * FROM users WHERE email = 'admin@hospital.com'"
    );

    if (adminCheck.rows.length === 0) {
      // Criar usuário admin padrão
      const hashedPassword = await bcrypt.hash('Admin@2024', 10);
      
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Administrador', 'admin@hospital.com', hashedPassword, 'admin']
      );
      
      console.log('✓ Usuário admin criado com sucesso');
      console.log('\n📋 CREDENCIAIS DE ACESSO:');
      console.log('Email: admin@hospital.com');
      console.log('Senha: Admin@2024');
      console.log('\n⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!\n');
    } else {
      console.log('✓ Usuário admin já existe');
    }

    console.log('✅ Banco de dados inicializado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}

initDatabase();
