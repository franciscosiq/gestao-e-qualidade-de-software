const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'senhasuperscreta';

app.use(bodyParser.json());

let users = [];
let nextId = 1;

//crud de login e resgistro de usuário, listagem de usuários, alterar as próprias info de usuário e apagar o proprio usuario
//todas as rotas que tem authenticate precisa passar por autenticação jwt 

//vai pegar o token do headers e verificar informaçoes de usuario com JWT, também salvará o usuário na própria requisição  
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso necessário' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Nome de usuário, senha e e-mail são obrigatórios' });
    }

    const existingUser = users.find(user => user.username === username || user.email === email);
    if (existingUser) {
      return res.status(409).json({ message: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: nextId++,
      username,
      email,
      password: hashedPassword
    };

    users.push(newUser);

    res.status(201).json({ message: 'Usuário registrado com sucesso', userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios' });
    }

    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login bem-sucedido', token });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

//lista todos os usuários
app.get('/users', authenticateToken, (req, res) => {
  const userList = users.map(user => ({ id: user.id, username: user.username, email: user.email }));
  res.json(userList);
});

//pegar usuario pelo id
app.get('/users/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  res.json({ id: user.id, username: user.username, email: user.email });
});

//alterar somente o proprio usuario pode fazer usando o token
app.put('/users/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, email, password } = req.body;

  if(req.user.id !== id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  
  if (username) users[userIndex].username = username;

  if (email) users[userIndex].email = email;

  if (password) users[userIndex].password = await bcrypt.hash(password, 10);
  

  res.json({ message: 'Usuário atualizado com sucesso' });
});

//deletar somente o proprio usuario pode fazer usando o token
app.delete('/users/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);

  if(req.user.id !== id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  users.splice(userIndex, 1);
  res.json({ message: 'Usuário deletado com sucesso' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = { app, users, nextId };