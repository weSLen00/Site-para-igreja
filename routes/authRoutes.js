// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Importa jsonwebtoken

// Carrega variáveis de ambiente (garante que JWT_SECRET esteja disponível)
// Se seu server.js já tem require('dotenv').config(); no topo, esta linha pode ser opcional aqui.
require('dotenv').config();

// Obtém a chave secreta do ambiente, ou usa uma fallback (NUNCA use fallback em produção!)
const JWT_SECRET = process.env.JWT_SECRET || 'Xp7F!jK2@LmN9oP3$qR5&sT8uV1wXyZ0aBcD4eFgH6iJ7'; // Mude para uma real!

// Rota de Login (POST /api/auth/login)
router.post('/login', async (req, res) => {
    const pool = req.app.get('dbPool');
    const { nome_usuario, senha } = req.body;

    if (!nome_usuario || !senha) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT id, nome_usuario, senha_hash, role FROM usuarios WHERE nome_usuario = ?',
            [nome_usuario]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(senha, user.senha_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Se o login for bem-sucedido, gera um token JWT
        const token = jwt.sign(
            { id: user.id, nome_usuario: user.nome_usuario, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expira em 1 hora
        );

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token, // Envia o token para o cliente
            user: {
                id: user.id,
                nome_usuario: user.nome_usuario,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
    } finally {
        if (connection) connection.release();
    }
});

// Middleware para autenticar o token JWT em rotas protegidas
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // O token é enviado no formato "Bearer SEU_TOKEN_AQUI"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação ausente.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Se o token for inválido, expirado ou manipulado
            return res.status(403).json({ message: 'Token de autenticação inválido ou expirado.' });
        }
        req.user = user; // Adiciona as informações do usuário ao objeto request
        next(); // Continua para a próxima função middleware/rota
    });
}

// Exporta o router E a função authenticateToken
module.exports = { router, authenticateToken };