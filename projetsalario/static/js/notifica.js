function notificar(tipo, mensagem) {
    const container = document.createElement('div');
    container.className = `notificacao ${tipo}`;
    container.innerHTML = `<span class="icon">${iconePorTipo(tipo)}</span> ${mensagem}`;

    document.body.appendChild(container);

    setTimeout(() => {
        container.classList.add('visivel');
    }, 10);

    setTimeout(() => {
        container.classList.remove('visivel');
        setTimeout(() => container.remove(), 300);
    }, 3000);
}

function iconePorTipo(tipo) {
    switch (tipo) {
        case 'success': return '✅';
        case 'danger': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return '🔔';
    }
}

// Ao carregar a página, busca todas as mensagens flash (renderizadas em atributos data-) e chama notificar
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-flash]').forEach(function (el) {
        const tipo = el.dataset.category;  
        const msg = el.dataset.message;
        notificar(tipo, msg);
        el.remove();  
    });
});

