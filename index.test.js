const request = require('supertest');
let { app, users, nextId } = require('./index');

//cada describe é uma organização separar melhor os testes


describe('API de Usuário', () => {
  beforeEach(() => {
    users = [];
    nextId = 1;
  });
  describe('POST /register', () => {
    //esta criando usuario com dados validos (nao é pra dar erro)
    it('Dado dados válidos de usuário, quando registrar, então deve criar usuário com sucesso', async () => {
      // Arrange
      const userData = {
        username: 'joao.silva',
        email: 'joao.silva@email.com',
        password: 'balablabla2'
      };

      // Act
      const response = await request(app)
        .post('/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuário registrado com sucesso');
      expect(response.body.userId).toBeDefined();
    });

    //esta criando usuario com dados invalidos (é pra dar erro)
    it('Dado dados incompletos, quando registrar, então deve retornar status 400', async () => {
      // Arrange
      const incompleteData = {
        username: 'joao.silva',
        password: 'senha123',
        // email faltando
      };

      // Act
      const response = await request(app)
        .post('/register')
        .send(incompleteData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Nome de usuário, senha e e-mail são obrigatórios');
    });

    //se tiver um usuario existente nao vai permitir (vai dar erro)
    it('Dado usuário já existente, quando registrar novamente, então deve retornar status 409', async () => {
      // Arrange
      const userData = {
        username: 'maria.santos',
        password: 'senha456',
        email: 'maria.santos@email.com'
      };
      await request(app)
        .post('/register')
        .send(userData);

      // Act
      const response = await request(app)
        .post('/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Usuário já existe');
    });
  });

  //teste de login
  describe('POST /login', () => {
    beforeEach(async () => {
      // Arrange - registrar usuário para testes de login (register de inicio so para logar no mesmo futuramente)
      await request(app)
        .post('/register')
        .send({
          username: 'carlos.oliveira',
          password: 'senha789',
          email: 'carlos.oliveira@email.com'
        });
    });

    it('Dado credenciais válidas, quando fazer login, então deve logar com sucesso', async () => {
      // Arrange
      const loginData = {
        username: 'carlos.oliveira',
        password: 'senha789'
      };

      // Act
      const response = await request(app)
        .post('/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login bem-sucedido');
      expect(response.body.token).toBeDefined();
    });

    it('Dado credenciais inválidas, quando fazer login, então deve retornar status 401', async () => {
      // Arrange
      const invalidLoginData = {
        username: 'carlos.oliveira',
        password: 'senhaerrada'
      };

      // Act
      const response = await request(app)
        .post('/login')
        .send(invalidLoginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Credenciais inválidas');
    });

    it('Dado dados incompletos, quando fazer login, então deve retornar status 400', async () => {
      // Arrange
      const incompleteLoginData = {
        username: 'carlos.oliveira'
        // password faltando
      };

      // Act
      const response = await request(app)
        .post('/login')
        .send(incompleteLoginData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Nome de usuário e senha são obrigatórios');
    });
  });
});