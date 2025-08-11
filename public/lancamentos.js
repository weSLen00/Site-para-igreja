// public/lancamentos.js (REVISADO PARA CADASTRO APENAS - SEM PRÉ-PREENCHIMENTO DE DATA)

const API_BASE_URL = 'http://localhost:3000/api';

let messageArea; // Global para displayMessage

function displayMessage(message, isError = false) {
    if (!messageArea) {
        messageArea = document.getElementById('message-area');
        if (!messageArea) {
            console.error("Elemento 'message-area' não encontrado no DOM. Não foi possível exibir a mensagem.");
            console.log(isError ? "ERRO: " + message : message);
            return;
        }
    }

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
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado. Iniciando script lancamentos.js');

    const lancamentoForm = document.getElementById('lancamento-form');
    messageArea = document.getElementById('message-area');

    if (!lancamentoForm) {
        console.error("ERRO: Elemento 'lancamento-form' não encontrado. O formulário de lançamentos pode não funcionar.");
        displayMessage("Erro: Formulário de lançamento não encontrado. Contate o suporte.", true);
        return;
    }
    if (!messageArea) {
        console.error("ERRO: Elemento 'message-area' não encontrado. Mensagens não serão exibidas corretamente.");
    }
    
    // REMOVA OU COMENTE TODO ESSE BLOCO PARA NÃO PRÉ-PREENCHER A DATA NA CARGA DA PÁGINA
    // const today = new Date();
    // const year = today.getFullYear();
    // const month = String(today.getMonth() + 1).padStart(2, '0');
    // const day = String(today.getDate()).padStart(2, '0');
    // const dataContribuicaoInput = document.getElementById('data_contribuicao');
    // if (dataContribuicaoInput) {
    //     dataContribuicaoInput.value = `${year}-${month}-${day}`;
    //     console.log("Data de contribuição preenchida automaticamente.");
    // } else {
    //     console.warn("Elemento 'data_contribuicao' não encontrado. A data não será preenchida automaticamente.");
    // }

    lancamentoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log('Evento de submit do formulário acionado.');

        const id_dizimista_el = document.getElementById('id_dizimista');
        const natureza_el = document.getElementById('natureza');
        const tipo_de_contribuicao_el = document.getElementById('tipo_de_contribuicao'); 
        const valor_el = document.getElementById('valor');
        const data_contribuicao_el = document.getElementById('data_contribuicao'); 
        const observacao_el = document.getElementById('observacao');

        const formElements = [
            { el: natureza_el, id: 'natureza' },
            { el: tipo_de_contribuicao_el, id: 'tipo_de_contribuicao' }, 
            { el: valor_el, id: 'valor' },
            { el: data_contribuicao_el, id: 'data_contribuicao' },
            { el: observacao_el, id: 'observacao' }
        ];

        for (const { el, id } of formElements) {
            if (!el) {
                console.error(`ERRO CRÍTICO: Elemento do formulário com ID '${id}' não encontrado.`);
                displayMessage(`Erro interno: Campo obrigatório '${id}' não encontrado no formulário.`, true);
                return;
            }
        }
        
        const id_dizimista = id_dizimista_el ? id_dizimista_el.value : null;
        const natureza = natureza_el.value;
        const tipo_de_contribuicao = tipo_de_contribuicao_el.value;
        const valor = valor_el.value;
        const data_contribuicao = data_contribuicao_el.value;
        const observacao = observacao_el.value;

        if (!natureza || !tipo_de_contribuicao || !valor || !data_contribuicao) {
            displayMessage('Por favor, preencha todos os campos obrigatórios: Natureza, Tipo/Categoria, Valor e Data.', true);
            return;
        }

        const lancamentoData = {
            id_dizimista: id_dizimista ? parseInt(id_dizimista) : null,
            natureza: natureza,
            tipo_de_contribuicao: tipo_de_contribuicao, 
            valor: parseFloat(valor),
            data_contribuicao: data_contribuicao,
            observacao: observacao
        };

        console.log('Dados do lançamento a serem enviados:', lancamentoData);

        const token = localStorage.getItem('jwtToken');
        if (!token) {
            displayMessage('Você não está autenticado. Por favor, faça login.', true);
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/lancamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(lancamentoData)
            });

            const data = await response.json();

            if (response.ok) {
                displayMessage(data.message || 'Lançamento salvo com sucesso!', false);
                lancamentoForm.reset();
                // REMOVA OU COMENTE ESTE BLOCO PARA NÃO PRÉ-PREENCHER A DATA APÓS O RESET
                // if (dataContribuicaoInput) {
                //     dataContribuicaoInput.value = `${year}-${month}-${day}`; 
                // }
            } else {
                displayMessage(data.message || 'Erro ao salvar lançamento.', true);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            displayMessage('Ocorreu um erro ao conectar com o servidor.', true);
        }
    });

    // REMOVIDO: Funções de editar/deletar e carregarLancamentos movidas para relatorios.js
    // window.editarLancamento = function(id) { ... };
    // window.deletarLancamento = async function(id) { ... };
    // carregarLancamentos(); 
});