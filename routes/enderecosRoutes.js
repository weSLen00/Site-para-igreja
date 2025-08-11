// routes/enderecosRoutes.js
const express = require('express');
const router = express.Router();

// GET /api/enderecos
router.get('/', async (req, res) => {
    const pool = req.app.get('dbPool');
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM endereco');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar endereços:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        if (connection) connection.release();
    }
});

// POST /api/enderecos
router.post('/', async (req, res) => {
    const pool = req.app.get('dbPool');
    const { id_dizimista, rua, bairro, numero_casa, cep } = req.body;

    if (!id_dizimista || !rua || !bairro || !cep) {
        return res.status(400).json({ message: 'ID Dizimista, Rua, Bairro e CEP são obrigatórios.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO endereco (id_dizimista, rua, bairro, numero_casa, cep) VALUES (?, ?, ?, ?, ?)',
            [id_dizimista, rua, bairro, numero_casa, cep]
        );
        res.status(201).json({
            message: 'Endereço adicionado com sucesso!',
            id_endereco: result.insertId,
            endereco: { id_dizimista, rua, bairro, numero_casa, cep }
        });
    } catch (error) {
        console.error('Erro ao adicionar endereço:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar endereço.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;