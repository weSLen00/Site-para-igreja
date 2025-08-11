// public/login.js

const API_BASE_URL = 'http://localhost:3000/api'; // Certifique-se que esta URL base está correta e que seu backend está rodando nela

document.addEventListener('DOMContentLoaded', () => {
    // Certifique-se de que o ID do formulário no seu login.html é 'login-form'
    // E que o ID do parágrafo de mensagem é 'login-message'
    const formLogin = document.getElementById('login-form'); // Corrigido de 'form-login' para 'login-form'
    const loginMessage = document.getElementById('login-message');

    // Oculta o botão 'Sair' na página de login, já que o usuário não está logado
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.style.display = 'none';
    }

    if (formLogin) {
        formLogin.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o recarregamento padrão da página

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Limpa mensagens anteriores
            loginMessage.textContent = ''; 
            loginMessage.style.color = '';

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Mapeia os nomes dos campos do frontend (username, password)
                    // para os nomes esperados pelo backend (nome_usuario, senha)
                    body: JSON.stringify({ nome_usuario: username, senha: password }), 
                });

                // Tenta parsear a resposta como JSON, mesmo em caso de erro.
                // Isso é importante para pegar mensagens de erro do backend.
                let data = {};
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error('Erro ao parsear JSON da resposta:', jsonError);
                    // Se não conseguir parsear, a resposta pode ser HTML de erro 404/500
                    if (response.status === 404) {
                        loginMessage.textContent = 'Erro: A rota de login não foi encontrada no servidor. Verifique o caminho da API.';
                    } else {
                        loginMessage.textContent = `Erro inesperado do servidor (Status: ${response.status}).`;
                    }
                    loginMessage.style.color = 'red';
                    return; // Sai da função para não tentar processar 'data'
                }

                if (response.ok) { // Se a resposta HTTP for 2xx (Sucesso)
                    localStorage.setItem('jwtToken', data.token); // Salva o token JWT no localStorage
                    loginMessage.textContent = 'Login bem-sucedido! Redirecionando...';
                    loginMessage.style.color = 'green';
                    
                    // Redireciona para a página de dizimistas após o login
                    window.location.href = 'relatorios.html'; 
                } else { // Se a resposta HTTP não for 2xx (ex: 401 Unauthorized, 400 Bad Request)
                    loginMessage.textContent = data.message || 'Erro no login. Verifique suas credenciais.';
                    loginMessage.style.color = 'red';
                }
            } catch (error) { // Erros de rede (sem resposta do servidor)
                console.error('Erro na requisição de login (rede ou servidor inatingível):', error);
                loginMessage.textContent = 'Não foi possível conectar ao servidor. Verifique sua conexão ou se o servidor está online.';
                loginMessage.style.color = 'red';
            }
        });
    } else {
        console.error("Elemento 'login-form' não encontrado no DOM. Verifique seu login.html.");
    }
});