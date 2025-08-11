// routes/lancamentosRoutes.js
const express = require('express');
const router = express.Router();

// Middleware de autenticação (assumindo que já está aplicado no server.js para esta rota)
// const { authenticateToken } = require('../authRoutes'); // Não precisa importar aqui se já está no server.js

// Rota GET para listar todos os lançamentos
router.get('/', async (req, res) => {
    const pool = req.app.get('dbPool');
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM lancamento');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar lançamentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar lançamentos.' });
    } finally {
        if (connection) connection.release();
    }
});

// Rota POST para adicionar um novo lançamento
router.post('/', async (req, res) => {
    const pool = req.app.get('dbPool');
    // Adicione 'natureza' à desestruturação do corpo da requisição
    const { id_dizimista, natureza, tipo_de_contribuicao, valor, data_contribuicao, observacao } = req.body;

    // Validação básica (ajuste conforme suas necessidades)
    if (!natureza || !tipo_de_contribuicao || !valor || !data_contribuicao) {
        return res.status(400).json({ message: 'Natureza, Tipo/Categoria, Valor e Data são obrigatórios.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO lancamento (id_dizimista, natureza, tipo_de_contribuicao, valor, data_contribuicao, observacao)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_dizimista, natureza, tipo_de_contribuicao, valor, data_contribuicao, observacao]
        );
        res.status(201).json({ message: 'Lançamento adicionado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao adicionar lançamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar lançamento.' });
    } finally {
        if (connection) connection.release();
    }
});

// Rota PUT para atualizar um lançamento existente (Exemplo, se você tiver esta rota)
router.put('/:id', async (req, res) => {
    const pool = req.app.get('dbPool');
    const { id } = req.params;
    // Adicione 'natureza' à desestruturação do corpo da requisição
    const { id_dizimista, natureza, tipo_de_contribuicao, valor, data_contribuicao, observacao } = req.body;

    // Validação básica
    if (!natureza || !tipo_de_contribuicao || !valor || !data_contribuicao) {
        return res.status(400).json({ message: 'Natureza, Tipo/Categoria, Valor e Data são obrigatórios.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `UPDATE lancamento SET
                id_dizimista = ?,
                natureza = ?, -- Adicionada a coluna natureza
                tipo_de_contribuicao = ?,
                valor = ?,
                data_contribuicao = ?,
                observacao = ?
             WHERE id_lancamento = ?`,
            [id_dizimista, natureza, tipo_de_contribuicao, valor, data_contribuicao, observacao, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lançamento não encontrado.' });
        }
        res.status(200).json({ message: 'Lançamento atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar lançamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar lançamento.' });
    } finally {
        if (connection) connection.release();
    }
});

// Rota DELETE para remover um lançamento
router.delete('/:id', async (req, res) => {
    const pool = req.app.get('dbPool');
    const { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute('DELETE FROM lancamento WHERE id_lancamento = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lançamento não encontrado.' });
        }
        res.status(200).json({ message: 'Lançamento excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir lançamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir lançamento.' });
    } finally {
        if (connection) connection.release();
    }
});


module.exports = router;