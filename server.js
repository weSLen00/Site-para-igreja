// server.js

// 1. Importar módulos necessários
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// Importe suas rotas aqui
// ESTAS LINHAS DEVEM FICAR AQUI NO TOPO, APÓS OS OUTROS REQUIRES
const dizimistasRoutes = require('./routes/dizimistasRoutes');
const lancamentosRoutes = require('./routes/lancamentosRoutes');
const enderecosRoutes = require('./routes/enderecosRoutes');
const { router: authRouter, authenticateToken } = require('./routes/authRoutes'); // <<-- IMPORTAÇÃO CORRETA DE authRouter E authenticateToken
const relatoriosRoutes = require('./routes/relatoriosRoutes'); // <<-- Certifique-se que esta linha está aqui


// 2. Configurar o aplicativo Express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. Configurar a conexão com o banco de dados
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

let pool;
async function initializeDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        await pool.getConnection();
        console.log('Conexão com o MySQL estabelecida com sucesso!');
        // ANEXA O POOL DE CONEXÕES AO OBJETO 'APP' PARA QUE AS ROTAS POSSAM ACESSÁ-LO
        app.set('dbPool', pool);

        // 5. Usar as rotas
        app.use('/api/dizimistas', dizimistasRoutes);
        app.use('/api/lancamentos', lancamentosRoutes);
        app.use('/api/enderecos', enderecosRoutes);
        app.use('/api/auth', authRouter); // Usa o router de autenticação
        // <<-- APLICA O MIDDLEWARE authenticateToken À ROTA DE RELATÓRIOS
        app.use('/api/relatorios', authenticateToken, relatoriosRoutes); // <<-- ADIÇÃO CHAVE AQUI

        // Serve arquivos estáticos (se você tiver uma pasta 'public' para o frontend ou outros assets)
        // Se você separou totalmente o frontend do backend, esta linha pode ser opcional.
        // Se o seu login.html, relatorios.html, etc., estiverem na pasta 'public' do backend, mantenha esta linha.
        app.use(express.static('public'));

        // 6. Iniciar o servidor
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });

    } catch (error) {
        console.error('Falha ao conectar ao banco de dados ou iniciar o servidor:', error);
        process.exit(1); // Encerra o processo se a conexão com o DB falhar
    }
}

// Inicia o processo
initializeDatabase();

// Você pode remover o exports aqui se não for importar 'app' em outros arquivos,
// mas para fins de teste ou estrutura modular, pode ser útil.
// module.exports = app;