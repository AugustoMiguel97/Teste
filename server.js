const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./db');

dotenv.config();

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// ========== MIDDLEWARE DE AUTENTICAÇÃO ==========
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  next();
};

// ========== ROTAS DE AUTENTICAÇÃO ==========

// Registrar novo usuário (apenas admin)
app.post('/api/auth/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nome, email, senha e role são obrigatórios' });
    }

    if (!['colaborador', 'nutricionista', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role inválido' });
    }

    // Verificar se email já existe
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir novo usuário
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const user = result.rows[0];

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ========== ROTAS DE USUÁRIOS ==========

// Listar todos os usuários (apenas admin)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Atualizar usuário (apenas admin pode alterar role, usuário pode alterar próprio perfil)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    // Usuário só pode alterar seu próprio perfil (exceto role)
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Apenas admin pode alterar role
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas admin pode alterar o tipo de acesso' });
    }

    let query = 'UPDATE users SET';
    const values = [];
    const updates = [];

    if (name) {
      updates.push(`name = $${updates.length + 1}`);
      values.push(name);
    }

    if (role && req.user.role === 'admin') {
      updates.push(`role = $${updates.length + 1}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    query += ' ' + updates.join(', ') + ` WHERE id = $${updates.length + 1}`;
    values.push(id);

    await pool.query(query, values);

    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário (apenas admin)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir deletar a si mesmo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// ========== ROTAS DE CARDÁPIO ==========

// Criar/adicionar refeição (apenas nutricionista e admin)
app.post('/api/menu', authenticateToken, async (req, res) => {
  try {
    if (!['nutricionista', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Apenas nutricionistas e admin podem criar refeições' });
    }

    const { meal_date, meal_time, description } = req.body;

    if (!meal_date || !meal_time || !description) {
      return res.status(400).json({ error: 'Data, horário e descrição são obrigatórios' });
    }

    const result = await pool.query(
      'INSERT INTO menu (meal_date, meal_time, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [meal_date, meal_time, description, req.user.id]
    );

    res.status(201).json({
      message: 'Refeição adicionada com sucesso',
      menu: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao adicionar refeição' });
  }
});

// Listar cardápio
app.get('/api/menu', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu ORDER BY meal_date ASC, meal_time ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar cardápio' });
  }
});

// Deletar refeição (apenas nutricionista e admin)
app.delete('/api/menu/:id', authenticateToken, async (req, res) => {
  try {
    if (!['nutricionista', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Apenas nutricionistas e admin podem deletar refeições' });
    }

    const { id } = req.params;
    await pool.query('DELETE FROM menu WHERE id = $1', [id]);

    res.json({ message: 'Refeição removida com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar refeição' });
  }
});

// ========== ROTAS DE SOLICITAÇÕES ==========

// Criar solicitação de refeição (colaborador)
app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const { meal_id, meal_type } = req.body;

    if (!meal_id || !['carne', 'ovo'].includes(meal_type)) {
      return res.status(400).json({ error: 'meal_id e meal_type (carne/ovo) são obrigatórios' });
    }

    // Verificar se a refeição existe e está com antecedência de 24h
    const mealResult = await pool.query('SELECT * FROM menu WHERE id = $1', [meal_id]);
    
    if (mealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Refeição não encontrada' });
    }

    const meal = mealResult.rows[0];
    const mealDateTime = new Date(`${meal.meal_date}T${meal.meal_time}`);
    const now = new Date();
    const hoursUntilMeal = (mealDateTime - now) / (1000 * 60 * 60);

    if (hoursUntilMeal < 24) {
      return res.status(400).json({ error: 'Solicitação deve ser feita com no mínimo 24 horas de antecedência' });
    }

    // Verificar se já fez solicitação para essa refeição
    const existingRequest = await pool.query(
      'SELECT * FROM requests WHERE user_id = $1 AND meal_id = $2',
      [req.user.id, meal_id]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'Você já fez uma solicitação para essa refeição' });
    }

    const result = await pool.query(
      'INSERT INTO requests (user_id, meal_id, meal_type, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, meal_id, meal_type, 'pendente']
    );

    res.status(201).json({
      message: 'Solicitação criada com sucesso',
      request: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar solicitação' });
  }
});

// Listar solicitações do usuário logado
app.get('/api/requests/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, m.meal_date, m.meal_time, m.description, u.name
       FROM requests r
       JOIN menu m ON r.meal_id = m.id
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = $1
       ORDER BY m.meal_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
});

// Listar todas as solicitações (apenas nutricionista e admin)
app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    if (!['nutricionista', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Apenas nutricionistas e admin podem listar todas as solicitações' });
    }

    const result = await pool.query(
      `SELECT r.*, m.meal_date, m.meal_time, m.description, u.name, u.email
       FROM requests r
       JOIN menu m ON r.meal_id = m.id
       JOIN users u ON r.user_id = u.id
       ORDER BY m.meal_date ASC, u.name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
});

// Cancelar solicitação (usuário ou nutricionista)
app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissão
    const requestResult = await pool.query('SELECT user_id FROM requests WHERE id = $1', [id]);
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    const isOwner = requestResult.rows[0].user_id === req.user.id;
    const isNutricionista = req.user.role === 'nutricionista' || req.user.role === 'admin';

    if (!isOwner && !isNutricionista) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await pool.query('DELETE FROM requests WHERE id = $1', [id]);

    res.json({ message: 'Solicitação cancelada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao cancelar solicitação' });
  }
});

// ========== ROTAS DE ESTATÍSTICAS ==========

// Dashboard da nutrição (contagem de refeições por tipo)
app.get('/api/stats/meals', authenticateToken, async (req, res) => {
  try {
    if (!['nutricionista', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Apenas nutricionistas e admin podem acessar' });
    }

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN meal_type = 'carne' THEN 1 ELSE 0 END) as carne_count,
        SUM(CASE WHEN meal_type = 'ovo' THEN 1 ELSE 0 END) as ovo_count,
        (SELECT COUNT(*) FROM menu) as total_menu_items
       FROM requests`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// ========== VERIFICAÇÃO DE SAÚDE ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
