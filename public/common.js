// public/common.js

document.addEventListener('DOMContentLoaded', () => {
    // Lógica para sublinhar a página ativa na navegação
    const currentPath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav ul li a');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Lógica para o botão de Sair (Logout)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('jwtToken'); // Remove o token
            window.location.href = 'login.html'; // Redireciona para a página de login
        });
    }

    // --- LÓGICA DE AUTENTICAÇÃO PARA PÁGINAS PROTEGIDAS ---
    // Defina quais páginas exigem autenticação
    const protectedPages = ['relatorios.html'];
    
    // Obtenha o nome do arquivo da página atual
    const currentPage = window.location.pathname.split('/').pop();

    // Verifique se a página atual está na lista de páginas protegidas
    if (protectedPages.includes(currentPage)) {
        const token = localStorage.getItem('jwtToken');

        if (!token) {
            // Se não há token, redireciona para a página de login
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = 'login.html';
        } 
        // Se houver um token, a página carregará, e o backend deve validá-lo.
        // Se o token for inválido, o backend deve retornar um erro 401.
    }
});

