// public/relatorios.js

const API_BASE_URL = 'http://localhost:3000/api';

let messageArea; // Global para displayMessage
let relatorioSection; // A seção principal do relatório
let lancamentosTableBodyRelatorio;
let dizimistasTableBodyRelatorio;

function displayMessage(message, isError = false) {
    if (!messageArea) {
        messageArea = document.getElementById('message-area');
        if (!messageArea) {
            console.error("Elemento 'message-area' não encontrado no DOM.");
            return;
        }
    }
    messageArea.textContent = message;
    messageArea.className = isError ? 'error' : 'success'; // Adiciona classes para styling
    messageArea.style.display = 'block';
    setTimeout(() => {
        messageArea.style.display = 'none';
        messageArea.textContent = '';
        messageArea.classList.remove('success', 'error');
    }, 5000);
}

// Função para formatar CPF
function formatCpf(cpf) {
    if (!cpf) return 'N/A';
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length === 11) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

// Função para formatar CEP com ponto
function formatCep(cep) {
    if (!cep) return 'N/A';
    cep = String(cep).replace(/\D/g, ''); // Garante que é string e remove tudo que não é dígito
    if (cep.length === 8) {
        return cep.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2-$3');
    }
    return cep; // Retorna o CEP como está se não tiver 8 dígitos
}

// NOVO: Função para formatar Telefone (99)99999-9999 ou (99)9999-9999
function formatTelefone(telefone) {
    if (!telefone) return 'N/A';
    telefone = String(telefone).replace(/\D/g, ''); // Remove tudo que não é dígito
    if (telefone.length === 11) { // Celular com DDD (ex: 68999994179)
        return telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1)$2-$3');
    } else if (telefone.length === 10) { // Fixo com DDD (ex: 6833334444)
        return telefone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1)$2-$3');
    }
    return telefone; // Retorna o telefone como está se não corresponder aos padrões
}

// Função para formatar valores monetários no padrão brasileiro
function formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado. Iniciando script relatorios.js');

    const token = localStorage.getItem('jwtToken');
    relatorioSection = document.getElementById('relatorio-financeiro-section');
    messageArea = document.getElementById('message-area');
    lancamentosTableBodyRelatorio = document.getElementById('lancamentos-table-body-relatorio');
    dizimistasTableBodyRelatorio = document.getElementById('dizimistas-table-body-relatorio');

    const mesInput = document.getElementById('mes');
    const anoInput = document.getElementById('ano');
    const gerarRelatorioBtn = document.getElementById('gerar-relatorio-btn');
    const relatorioPeriodoSpan = document.getElementById('relatorio-periodo');
    const saldoInicialSpan = document.getElementById('saldo-inicial');
    const totalEntradasSpan = document.getElementById('total-entradas');
    const totalSaidasSpan = document.getElementById('total-saidas');
    const saldoAtualSpan = document.getElementById('saldo-atual');
    const totalGeralSpan = document.getElementById('total-geral');
    const ofertasPorCategoriaUl = document.getElementById('ofertas-por-categoria');

    if (!token) {
        displayMessage('Você precisa estar logado para acessar os relatórios.', true);
        if (relatorioSection) relatorioSection.classList.add('hidden');
        return;
    } else {
        if (relatorioSection) relatorioSection.classList.remove('hidden');
    }

    const today = new Date();
    mesInput.value = today.getMonth() + 1;
    anoInput.value = today.getFullYear();

    if (gerarRelatorioBtn) {
        gerarRelatorioBtn.addEventListener('click', () => {
            carregarRelatorioFinanceiro(mesInput.value, anoInput.value);
            carregarLancamentosRelatorio();
            carregarDizimistasRelatorio();
        });
    }

    carregarRelatorioFinanceiro(mesInput.value, anoInput.value);
    carregarLancamentosRelatorio();
    carregarDizimistasRelatorio();

    async function carregarRelatorioFinanceiro(mes, ano) {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/relatorios/caixa?mes=${mes}&ano=${ano}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao carregar relatório financeiro.');
            }

            const relatorio = await response.json();
            
            relatorioPeriodoSpan.textContent = `${mes}/${ano}`;
            saldoInicialSpan.textContent = formatCurrency(relatorio.saldoInicial || 0);
            totalEntradasSpan.textContent = formatCurrency(relatorio.totalEntradas || 0);
            totalSaidasSpan.textContent = formatCurrency(relatorio.totalSaidas || 0);
            saldoAtualSpan.textContent = formatCurrency(relatorio.saldoAtual || 0);
            totalGeralSpan.textContent = formatCurrency(relatorio.totalGeral || 0);

            ofertasPorCategoriaUl.innerHTML = '';
            if (relatorio.ofertasPorCategoria && Object.keys(relatorio.ofertasPorCategoria).length > 0) {
                for (const categoria in relatorio.ofertasPorCategoria) {
                    const li = document.createElement('li');
                    li.textContent = `${categoria}: ${formatCurrency(relatorio.ofertasPorCategoria[categoria] || 0)}`;
                    ofertasPorCategoriaUl.appendChild(li);
                }
            } else {
                const li = document.createElement('li');
                li.textContent = 'Nenhuma oferta por categoria encontrada para o período.';
                ofertasPorCategoriaUl.appendChild(li);
            }

        } catch (error) {
            console.error('Erro ao carregar relatório financeiro:', error);
            displayMessage(`Erro: ${error.message}`, true);
        }
    }

    async function carregarLancamentosRelatorio() {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/lancamentos`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao carregar lançamentos para o relatório.');
            }

            const lancamentos = await response.json();
            
            if (lancamentosTableBodyRelatorio) {
                lancamentosTableBodyRelatorio.innerHTML = '';

                if (lancamentos.length === 0) {
                    const row = lancamentosTableBodyRelatorio.insertRow();
                    row.innerHTML = '<td colspan="7" style="text-align: center;">Nenhum lançamento encontrado.</td>';
                    return;
                }

                lancamentos.forEach(lancamento => {
                    const row = lancamentosTableBodyRelatorio.insertRow();
                    row.innerHTML = `
                        <td>${lancamento.id_lancamento}</td>
                        <td>${lancamento.id_dizimista || 'N/A'}</td>
                        <td>${lancamento.natureza}</td>
                        <td>${lancamento.tipo_de_contribuicao}</td> 
                        <td>${formatCurrency(lancamento.valor)}</td>
                        <td>${new Date(lancamento.data_contribuicao).toLocaleDateString('pt-BR')}</td>
                        <td>${lancamento.observacao || ''}</td>
                    `;
                });
            } else {
                 console.error("Elemento 'lancamentos-table-body-relatorio' não encontrado.");
            }

        } catch (error) {
            console.error('Erro ao carregar lançamentos para o relatório:', error);
            if (lancamentosTableBodyRelatorio) {
                lancamentosTableBodyRelatorio.innerHTML = `<td colspan="7" style="text-align: center; color: red;">Erro ao carregar lançamentos: ${error.message}</td>`;
            }
        }
    }

    // Função para carregar e exibir dizimistas na página de relatório
    async function carregarDizimistasRelatorio() {
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/dizimistas`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao carregar dizimistas para o relatório.');
            }

            const dizimistas = await response.json();

            if (dizimistasTableBodyRelatorio) {
                dizimistasTableBodyRelatorio.innerHTML = ''; // Limpa o corpo da tabela

                if (dizimistas.length === 0) {
                    const row = dizimistasTableBodyRelatorio.insertRow();
                    row.innerHTML = '<td colspan="6" style="text-align: center;">Nenhum dizimista encontrado.</td>';
                    return;
                }

                dizimistas.forEach(dizimista => {
                    const row = dizimistasTableBodyRelatorio.insertRow();
                    
                    let enderecoParts = [];
                    if (dizimista.rua) enderecoParts.push(dizimista.rua);
                    if (dizimista.numero_casa) enderecoParts.push(dizimista.numero_casa); 
                    
                    let enderecoFormatado = enderecoParts.join(', '); 
                    
                    if (dizimista.bairro) {
                        if (enderecoFormatado) enderecoFormatado += ' - '; 
                        enderecoFormatado += dizimista.bairro;
                    }
                    if (dizimista.cep) {
                        if (enderecoFormatado) enderecoFormatado += ' - '; 
                        enderecoFormatado += formatCep(dizimista.cep);
                    }

                    const enderecoCompletoFormatado = enderecoFormatado || 'N/A'; 

                    row.innerHTML = `
                        <td>${dizimista.id_dizimista}</td>
                        <td>${dizimista.nome_completo}</td>
                        <td>${formatCpf(dizimista.cpf)}</td>
                        <td>${dizimista.data_nascimento ? new Date(dizimista.data_nascimento).toLocaleDateString('pt-BR') : 'N/A'}</td>
                        <td>${enderecoCompletoFormatado}</td> 
                        <td>${formatTelefone(dizimista.telefone)}</td> `;
                });
            } else {
                 console.error("Elemento 'dizimistas-table-body-relatorio' não encontrado.");
            }

        } catch (error) {
            console.error('Erro ao carregar dizimistas para o relatório:', error);
            if (dizimistasTableBodyRelatorio) {
                dizimistasTableBodyRelatorio.innerHTML = `<td colspan="6" style="text-align: center; color: red;">Erro ao carregar dizimistas: ${error.message}</td>`;
            }
        }
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('jwtToken');
            window.location.href = 'login.html';
        });
    }
});