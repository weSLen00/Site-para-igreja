// routes/relatoriosRoutes.js
const express = require('express');
const router = express.Router();

// Middleware de autenticação (assumindo que você o tem em algum lugar e o está usando)
// const authenticateToken = require('../middlewares/authMiddleware'); 
// router.use(authenticateToken); // Descomente se você já configurou isso globalmente ou adicione na rota específica

router.get('/caixa', async (req, res) => { // Mudança de ':ano/:mes' para query parameters
    const pool = req.app.get('dbPool');
    const { mes, ano } = req.query; // Pega 'mes' e 'ano' de query parameters (ex: /caixa?mes=7&ano=2025)

    if (!mes || !ano) {
        return res.status(400).json({ message: 'Parâmetros de mês e ano são obrigatórios.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Calcular o total de ENTRADAS para o mês
        const [entradasResult] = await connection.execute(
            `SELECT COALESCE(SUM(valor), 0) AS total_entradas FROM lancamento
             WHERE YEAR(data_contribuicao) = ? AND MONTH(data_contribuicao) = ? AND natureza = 'Entrada'`,
            [ano, mes]
        );
        const totalEntradas = entradasResult[0].total_entradas;

        // 2. Calcular o total de SAÍDAS para o mês
        const [saidasResult] = await connection.execute(
            `SELECT COALESCE(SUM(valor), 0) AS total_saidas FROM lancamento
             WHERE YEAR(data_contribuicao) = ? AND MONTH(data_contribuicao) = ? AND natureza = 'Saida'`,
            [ano, mes]
        );
        const totalSaidas = saidasResult[0].total_saidas;

        // 3. Obter Dízimos e Ofertas por categoria (ajustando os nomes para corresponder ao HTML/DB)
        const categoriasDeOferta = [
            'Dizimo', // Adicionado
            'Oferta EBD',
            'Oferta Culto Evangelistico',
            'Oferta PBB' // Assumindo que este é o valor real no DB
        ];

        const ofertasPorCategoria = {};
        for (const categoria of categoriasDeOferta) {
            const [result] = await connection.execute(
                `SELECT COALESCE(SUM(valor), 0) AS total FROM lancamento
                 WHERE YEAR(data_contribuicao) = ? AND MONTH(data_contribuicao) = ?
                 AND tipo_de_contribuicao = ? AND natureza = 'Entrada'`,
                [ano, mes, categoria]
            );
            ofertasPorCategoria[categoria] = result[0].total;
        }

        // 4. Calcular o saldo inicial do mês anterior
        let saldoInicial = 0;
        let mesAnterior = parseInt(mes) - 1;
        let anoAnterior = parseInt(ano);

        if (mesAnterior === 0) { // Se o mês atual é Janeiro, o mês anterior é Dezembro do ano anterior
            mesAnterior = 12;
            anoAnterior--;
        }
        
        // Consulta para pegar o saldo final do mês anterior.
        // Assumindo que a tabela `relatorio` armazena o *saldo final* do mês.
        // A coluna `mes_referente` deve ser uma data do último dia do mês para essa query funcionar bem.
        // Ajustei a query para ser mais robusta, buscando o saldo do final do mês anterior diretamente.
        const lastDayOfPreviousMonth = new Date(ano, mes - 1, 0); // Ultimo dia do mes anterior
        const prevMonthFormatted = String(lastDayOfPreviousMonth.getMonth() + 1).padStart(2, '0');
        const prevYearFormatted = lastDayOfPreviousMonth.getFullYear();

        const [saldoAnteriorResult] = await connection.execute(
            `SELECT saldo_caixa_atual FROM relatorio
             WHERE YEAR(mes_referente) = ? AND MONTH(mes_referente) = ?
             ORDER BY mes_referente DESC LIMIT 1`, // Pega o mais recente se houver vários para o mês
            [prevYearFormatted, prevMonthFormatted]
        );

        if (saldoAnteriorResult.length > 0) {
            saldoInicial = saldoAnteriorResult[0].saldo_caixa_atual;
        }

        const saldoCaixaAtual = parseFloat(saldoInicial) + parseFloat(totalEntradas) - parseFloat(totalSaidas);
        const totalGeral = parseFloat(saldoInicial) + parseFloat(totalEntradas); // Total geral considerando saldo inicial + entradas do mês

        // 5. Retornar os dados
        res.json({
            mes_referente: `${mes}/${ano}`,
            saldoInicial: parseFloat(saldoInicial).toFixed(2),
            totalEntradas: parseFloat(totalEntradas).toFixed(2),
            totalSaidas: parseFloat(totalSaidas).toFixed(2),
            saldoAtual: parseFloat(saldoCaixaAtual).toFixed(2),
            totalGeral: parseFloat(totalGeral).toFixed(2),
            ofertasPorCategoria: ofertasPorCategoria // Retorna um objeto com as categorias e seus totais
        });

    } catch (error) {
        console.error('Erro ao gerar relatório mensal:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar relatório.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;