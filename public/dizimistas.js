// public/dizimistas.js

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const dizimistaForm = document.getElementById('dizimista-form');
    const messageArea = document.getElementById('message-area');
    // Removido: dizimistasTableBody (não será exibida tabela aqui)
    const btnLogout = document.getElementById('btn-logout');

    function displayMessage(message, isError = false) {
        if (messageArea) {
            messageArea.textContent = message;
            if (isError) {
                messageArea.classList.remove('success');
                messageArea.classList.add('error');
            } else {
                messageArea.classList.remove('error');
                messageArea.classList.add('success');
            }
            messageArea.style.display = 'block';
            setTimeout(() => {
                messageArea.style.display = 'none';
                messageArea.textContent = '';
                messageArea.classList.remove('success', 'error');
            }, 5000);
        } else {
            console.log(isError ? "ERRO: " + message : message);
        }
    }

    // A função formatCpf NÃO é estritamente necessária aqui se não há tabela para exibir CPF formatado,
    // mas pode ser útil para validação futura ou se você decidir reintroduzir a tabela.
    // Mantenho por segurança, mas sem uso direto neste script AGORA.
    function formatCpf(cpf) {
        if (!cpf) return ''; // Retorna vazio se não tiver CPF
        cpf = cpf.replace(/\D/g, ''); 
        if (cpf.length === 11) {
            return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    }

    // REMOVIDA A FUNÇÃO carregarDizimistas() - Não haverá tabela de listagem nesta página
    // REMOVIDAS AS FUNÇÕES editarDizimista() e deletarDizimista() - Não haverá tabela de listagem nesta página

    if (dizimistaForm) {
        dizimistaForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nome_completo = document.getElementById('nome_completo').value;
            const cpf = document.getElementById('cpf').value;
            const data_nascimento = document.getElementById('data_nascimento').value;
            // **IMPORTANTE: Coletando campos de endereço SEPARADOS**
            const rua = document.getElementById('rua').value;
            const numero_casa = document.getElementById('numero_casa').value;
            const bairro = document.getElementById('bairro').value;
            const cep = document.getElementById('cep').value;
            const telefone = document.getElementById('telefone').value;

            // Validação de campos obrigatórios (ajustada para os campos separados)
            if (!nome_completo || !rua || !bairro || !cep || !telefone) { // CEP como obrigatório
                displayMessage('Nome completo, Rua, Bairro, CEP e Telefone são obrigatórios.', true);
                return;
            }

            const dizimistaData = {
                nome_completo,
                cpf: cpf || null,
                data_nascimento: data_nascimento || null,
                // **IMPORTANTE: Enviando campos de endereço SEPARADOS para o backend**
                rua: rua || null,           
                numero_casa: numero_casa || null, 
                bairro: bairro || null,       
                cep: cep || null,           
                telefone
            };

            const token = localStorage.getItem('jwtToken');
            if (!token) {
                displayMessage('Você não está autenticado. Por favor, faça login.', true);
                window.location.href = 'login.html';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/dizimistas`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(dizimistaData)
                });

                const data = await response.json();

                if (response.ok) {
                    displayMessage(data.message || 'Dizimista cadastrado com sucesso!', false);
                    dizimistaForm.reset(); // Limpa o formulário
                    // Não há necessidade de carregar dizimistas aqui, pois não há tabela
                } else {
                    displayMessage(data.message || 'Erro ao cadastrar dizimista.', true);
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                displayMessage('Ocorreu um erro ao conectar com o servidor.', true);
            }
        });
    } else {
        console.warn("Elemento 'dizimista-form' não encontrado.");
    }
    
    // Nenhuma chamada a carregarDizimistas() aqui.
    
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('jwtToken');
            window.location.href = 'login.html';
        });
    }
});