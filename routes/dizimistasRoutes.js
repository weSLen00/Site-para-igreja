// routes/dizimistasRoutes.js
const express = require('express');
const router = express.Router();

// Rota GET /api/dizimistas (lista todos)
router.get('/', async (req, res) => {
    const pool = req.app.get('dbPool');
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(`
            SELECT 
                d.id_dizimista, 
                d.nome_dizimista, 
                d.cpf, 
                d.data_nascimento, 
                d.telefone, 
                e.rua,          
                e.bairro,       
                e.numero_casa,  
                e.cep           
            FROM 
                dizimista d
            LEFT JOIN 
                endereco e ON d.id_dizimista = e.id_dizimista
        `);
        
        // **IMPORTANTE: Retornando campos de endereço separados**
        const dizimistasFormatados = rows.map(row => {
            return {
                id_dizimista: row.id_dizimista,          
                nome_completo: row.nome_dizimista,       
                cpf: row.cpf,
                data_nascimento: row.data_nascimento,
                telefone: row.telefone,
                rua: row.rua || '',            
                bairro: row.bairro || '',
                numero_casa: row.numero_casa || '', 
                cep: row.cep || ''             
            };
        });
        res.json(dizimistasFormatados);
    } catch (error) {
        console.error('Erro ao buscar dizimistas:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar dizimistas.' });
    } finally {
        if (connection) connection.release();
    }
});

// Rota POST /api/dizimistas (cadastra um novo) - Assegure-se que RECEBE campos separados
router.post('/', async (req, res) => {
    const pool = req.app.get('dbPool');
    // **IMPORTANTE: Recebendo campos de endereço separados**
    const { nome_completo, cpf, data_nascimento, rua, numero_casa, bairro, cep, telefone } = req.body; 

    if (!nome_completo || !rua || !bairro || !cep || !telefone) { // Ajustei a validação para os campos separados
        return res.status(400).json({ message: 'Nome Completo, Rua, Bairro, CEP e Telefone são obrigatórios.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [resultDizimista] = await connection.execute(
            'INSERT INTO dizimista (nome_dizimista, cpf, data_nascimento, telefone) VALUES (?, ?, ?, ?)',
            [nome_completo, cpf, data_nascimento, telefone]
        );
        const id_dizimista = resultDizimista.insertId;

        const [resultEndereco] = await connection.execute(
            'INSERT INTO endereco (id_dizimista, rua, bairro, numero_casa, cep) VALUES (?, ?, ?, ?, ?)',
            [id_dizimista, rua, bairro, numero_casa, cep]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Dizimista e Endereço adicionados com sucesso!',
            id_dizimista: id_dizimista,
            dizimista: { nome_completo, cpf, data_nascimento, rua, numero_casa, bairro, cep, telefone }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao adicionar dizimista e endereço:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'CPF já cadastrado.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar dizimista e endereço.' });
    } finally {
        if (connection) connection.release();
    }
});

// Rota GET /api/dizimistas/:id (busca por ID) - Assegure-se que RETORNA campos separados
router.get('/:id', async (req, res) => {
    const pool = req.app.get('dbPool');
    const { id } = req.params;

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(`
            SELECT 
                d.id_dizimista, 
                d.nome_dizimista, 
                d.cpf, 
                d.data_nascimento, 
                d.telefone, 
                e.rua,          
                e.bairro,       
                e.numero_casa,  
                e.cep           
            FROM 
                dizimista d
            LEFT JOIN 
                endereco e ON d.id_dizimista = e.id_dizimista
            WHERE d.id_dizimista = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Dizimista não encontrado.' });
        }
        
        const row = rows[0];
        // **IMPORTANTE: Retornando os campos de endereço separadamente**
        const dizimistaComEndereco = {
            id_dizimista: row.id_dizimista,
            nome_completo: row.nome_dizimista,
            cpf: row.cpf,
            data_nascimento: row.data_nascimento,
            telefone: row.telefone,
            rua: row.rua || '',
            bairro: row.bairro || '',
            numero_casa: row.numero_casa || '',
            cep: row.cep || ''
        };
        res.json(dizimistaComEndereco);
    } catch (error) {
        console.error(`Erro ao buscar dizimista com ID ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar dizimista.' });
    } finally {
        if (connection) connection.release();
    }
});

// Rota DELETE /api/dizimistas/:id (exclui um dizimista e seu endereço associado) - Sem alterações
router.delete('/:id', async (req, res) => {
    const pool = req.app.get('dbPool');
    const { id } = req.params;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.execute('DELETE FROM endereco WHERE id_dizimista = ?', [id]);

        const [resultDizimista] = await connection.execute('DELETE FROM dizimista WHERE id_dizimista = ?', [id]);

        if (resultDizimista.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Dizimista não encontrado para exclusão.' });
        }

        await connection.commit();

        res.status(200).json({ message: 'Dizimista e endereço associado excluídos com sucesso!' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao excluir dizimista e endereço:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir dizimista.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;