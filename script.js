// script.js - Script principal do aplicativo
// Elementos DOM
const dashboardView = document.getElementById('dashboard-view');
const qrCodesView = document.getElementById('qrcodes-view');
const analyticsView = document.getElementById('analytics-view');
const createView = document.getElementById('create-view');
const detailsView = document.getElementById('details-view');
const createQrBtn = document.getElementById('create-qr-btn');
const createQrBtn2 = document.getElementById('create-qr-btn-2');
const backToDashboard = document.getElementById('back-to-dashboard');
const backFromDetails = document.getElementById('back-from-details');
const generateQrBtn = document.getElementById('generate-qr-btn');
const qrCodesList = document.getElementById('qr-codes-list');
const allQrCodesList = document.getElementById('all-qr-codes-list');
const editQrBtn = document.getElementById('edit-qr-btn');
const deleteQrBtn = document.getElementById('delete-qr-btn');
const editModal = document.getElementById('edit-modal');
const deleteModal = document.getElementById('delete-modal');
const sizeModal = document.getElementById('size-modal');
const closeModalBtn = document.querySelector('.close');
const closeDeleteBtn = document.querySelector('.close-delete');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const navItems = document.querySelectorAll('nav li');

// Elementos do Auth
const authContainer = document.getElementById('auth-container');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const gotoRegisterBtn = document.getElementById('goto-register');
const gotoLoginBtn = document.getElementById('goto-login');

// Estado atual
let currentQRId = null;
let lastActiveView = 'dashboard-view';
// Armazenar referências para destruir os gráficos
let performanceChart = null;
let detailsChart = null;
let analyticsChart = null;
let topQrChart = null;
// Variáveis globais para download
let qrDownloadFilename = '';
let qrDownloadId = '';

// Funções de autenticação
async function checkAuth() {
    try {
        const user = await Auth.getCurrentUser();
        if (user) {
            // Usuário já autenticado, esconder tela de login
            authContainer.classList.add('hidden');
            renderDashboard();
        } else {
            // Usuário não autenticado, mostrar tela de login
            authContainer.classList.remove('hidden');
            loginView.style.display = 'block';
            registerView.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        alert('Ocorreu um erro ao verificar sua autenticação.');
    }
}

// Event listeners de autenticação
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    try {
        await Auth.login(email, password);
        authContainer.classList.add('hidden');
        renderDashboard();
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login. Verifique suas credenciais e tente novamente.');
    }
});

registerBtn.addEventListener('click', async () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    
    if (!email || !password || !confirmPassword) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('As senhas não correspondem.');
        return;
    }
    
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    try {
        await Auth.register(email, password);
        alert('Registro bem-sucedido! Verifique seu e-mail para confirmar sua conta.');
        loginView.style.display = 'block';
        registerView.style.display = 'none';
    } catch (error) {
        console.error('Erro ao registrar:', error);
        alert('Erro ao criar conta. Este e-mail já pode estar em uso.');
    }
});

gotoRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginView.style.display = 'none';
    registerView.style.display = 'block';
});

gotoLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerView.style.display = 'none';
    loginView.style.display = 'block';
});

// Funções de navegação
function showView(viewId) {
    // Ocultar todas as views
    dashboardView.classList.remove('active');
    qrCodesView.classList.remove('active');
    analyticsView.classList.remove('active');
    createView.classList.remove('active');
    detailsView.classList.remove('active');
    
    // Mostrar a view solicitada
    document.getElementById(viewId).classList.add('active');
    
    // Atualizar menu ativo
    navItems.forEach(item => {
        if (item.dataset.view === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Atualizar lastActiveView se for uma das views principais
    if (viewId !== 'create-view' && viewId !== 'details-view') {
        lastActiveView = viewId;
    }
}

// Navegação entre views
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const viewId = item.dataset.view;
        showView(viewId);
        if (viewId === 'qrcodes-view') {
            renderQRCodesView();
        } else if (viewId === 'analytics-view') {
            renderAnalyticsView();
        } else {
            renderDashboard();
        }
    });
});

createQrBtn.addEventListener('click', () => {
    showView('create-view');
});

createQrBtn2.addEventListener('click', () => {
    showView('create-view');
});

backToDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    showView(lastActiveView);
    if (lastActiveView === 'qrcodes-view') {
        renderQRCodesView();
    } else if (lastActiveView === 'analytics-view') {
        renderAnalyticsView();
    } else {
        renderDashboard();
    }
});

backFromDetails.addEventListener('click', (e) => {
    e.preventDefault();
    showView(lastActiveView);
    if (lastActiveView === 'qrcodes-view') {
        renderQRCodesView();
    } else if (lastActiveView === 'analytics-view') {
        renderAnalyticsView();
    } else {
        renderDashboard();
    }
});

// Gerar código QR
generateQrBtn.addEventListener('click', async () => {
    const name = document.getElementById('qr-name').value;
    const url = document.getElementById('qr-url').value;
    
    if (!name || !url) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('URL inválida. Certifique-se de incluir http:// ou https://');
        return;
    }
    
    const newQR = {
        id: Date.now().toString(),
        name: name,
        url: url,
        created_at: new Date().toISOString(),
        scans: 0
    };
    
    try {
        // Adicionar ao banco de dados
        await QRCodeDB.addQRCode(newQR);
        
        // Mostrar o preview
        const qrPreview = document.getElementById('qr-preview');
        qrPreview.style.display = 'block';
        
        const qrContainer = document.getElementById('qr-container');
        qrContainer.innerHTML = '';
        
        // Gerar QR com URL para a página de redirecionamento
        const baseUrl = window.location.pathname.includes('github.io') 
            ? `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}`
            : `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}`;
        const redirectUrl = `${baseUrl}/redirect.html?id=${newQR.id}`;
        
        try {
            QRCode.toDataURL(redirectUrl, { width: 200 }, (error, url) => {
                if (error) {
                    console.error('Erro ao gerar QR Code:', error);
                    return;
                }
                const qrImg = document.createElement('img');
                qrImg.src = url;
                qrImg.style.width = '200px';
                qrImg.style.height = '200px';
                qrContainer.appendChild(qrImg);
            });
        } catch (qrError) {
            console.error('Erro na geração do QR Code:', qrError);
            qrContainer.innerHTML = '<p>Erro ao gerar QR Code</p>';
        }
        
        document.getElementById('qr-url-display').textContent = url;
        
        // Limpar o formulário
        document.getElementById('qr-name').value = '';
        document.getElementById('qr-url').value = '';
        
        setTimeout(() => {
            alert('QR Code criado com sucesso!');
            showView(lastActiveView);
            if (lastActiveView === 'qrcodes-view') {
                renderQRCodesView();
            } else if (lastActiveView === 'analytics-view') {
                renderAnalyticsView();
            } else {
                renderDashboard();
            }
        }, 1500);
    } catch (error) {
        console.error('Erro ao salvar QR Code:', error);
        alert('Ocorreu um erro ao salvar o QR Code.');
    }
});

// Exibir modal de seleção de tamanho
function showSizeModal(qrId, filename) {
    console.log("Mostrando modal de tamanho para ID:", qrId);
    qrDownloadId = qrId;
    qrDownloadFilename = filename;
    
    // Garantir que o modal esteja visível
    sizeModal.style.display = 'block';
    
    // Resetar seleção
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.remove('selected');
        
        // Adicionar event listener diretamente aqui para garantir que funcione
        btn.onclick = function() {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            const size = parseInt(this.getAttribute('data-size'));
            downloadQRCode(qrDownloadId, qrDownloadFilename, size);
        };
    });
    
    // Selecionar o botão de 300px como padrão
    const defaultBtn = document.querySelector('.size-btn[data-size="300"]');
    if (defaultBtn) {
        defaultBtn.classList.add('selected');
    }
}

// Função para baixar QR Code
function downloadQRCode(qrId, filename, size) {
    console.log("Download QR Code:", qrId, filename, size);
    
    // Se não especificou tamanho, mostrar modal de seleção
    if (!size) {
        showSizeModal(qrId, filename);
        return;
    }
    
    // Determinar URL de redirecionamento
    const baseUrl = window.location.pathname.includes('github.io') 
        ? `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}`
        : `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}`;
    const redirectUrl = `${baseUrl}/redirect.html?id=${qrId}`;
    
    console.log("Gerando QR Code com URL:", redirectUrl, "tamanho:", size);
    
    // Gerar QR code no tamanho solicitado
    QRCode.toDataURL(redirectUrl, { 
        width: size,
        margin: 1,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    }, (error, newDataUrl) => {
        if (error) {
            console.error('Erro ao gerar QR Code:', error);
            alert('Ocorreu um erro ao gerar o QR Code no tamanho solicitado.');
            return;
        }
        
        console.log("QR Code gerado com sucesso, iniciando download...");
        
        // Criar link para download
        const link = document.createElement('a');
        link.href = newDataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Fechar modal
        sizeModal.style.display = 'none';
    });
}

// Renderizar QR Codes em um container
async function renderQRCodesToContainer(container, limit = null) {
    container.innerHTML = '';
    
    try {
        // Obter QR Codes
        let qrCodes = await QRCodeDB.getAllQRCodes();
        
        // Ordenar por data de criação (mais recentes primeiro)
        qrCodes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Aplicar limite se especificado
        if (limit && qrCodes.length > limit) {
            qrCodes = qrCodes.slice(0, limit);
        }
        
        if (qrCodes.length === 0) {
            container.innerHTML = '<p>Nenhum QR Code criado ainda. Clique em "Criar Novo QR Code" para começar.</p>';
            return;
        }
        
        // Renderizar cada QR Code
        qrCodes.forEach(qr => {
            const card = document.createElement('div');
            card.className = 'qr-code-card';
            card.dataset.id = qr.id;
            
            // Criar estrutura do card
            card.innerHTML = `
                <div class="qr-image-container">
                    <div class="qr-image" id="qr-${qr.id}"></div>
                    <button class="download-qr-btn" title="Baixar QR Code" data-id="${qr.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>
                    </button>
                </div>
                <div class="qr-name">${qr.name}</div>
                <div class="qr-url">${qr.url}</div>
                <div class="qr-stats">${qr.scans} scans</div>
            `;
            
            container.appendChild(card);
            
            // Gerar o QR code com URL de redirecionamento
            const baseUrl = window.location.pathname.includes('github.io') 
                ? `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}`
                : `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}`;
            const redirectUrl = `${baseUrl}/redirect.html?id=${qr.id}`;
            
            const qrContainer = document.getElementById(`qr-${qr.id}`);
            
            // Usar toDataURL em vez de toCanvas
            try {
                QRCode.toDataURL(redirectUrl, { width: 120 }, (error, url) => {
                    if (error) {
                        console.error('Erro ao gerar QR Code:', error);
                        return;
                    }
                    const qrImg = document.createElement('img');
                    qrImg.src = url;
                    qrImg.dataset.filename = `qrcode-${qr.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
                    qrImg.style.width = '120px';
                    qrImg.style.height = '120px';
                    qrContainer.appendChild(qrImg);
                });
            } catch (qrError) {
                console.error('Erro na geração do QR Code:', qrError);
                qrContainer.innerHTML = '<p>Erro ao gerar QR Code</p>';
            }
            
            // Adicionar evento de clique para baixar o QR Code
            const downloadBtn = card.querySelector('.download-qr-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Impedir que o evento de clique do card seja acionado
                const filename = `qrcode-${qr.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
                downloadQRCode(qr.id, filename);
            });
            
            // Adicionar evento de clique para ver detalhes
            card.addEventListener('click', (e) => {
                // Se o clique não foi no botão de download
                if (!e.target.closest('.download-qr-btn')) {
                    showQRDetails(qr.id);
                }
            });
        });
        
    } catch (error) {
        console.error('Erro ao renderizar QR Codes:', error);
        container.innerHTML = '<p>Ocorreu um erro ao carregar os QR Codes.</p>';
    }
}

// Renderizar dashboard
async function renderDashboard() {
    try {
        // Obter dados do banco
        const totalScans = await ScanLogDB.getTotalScans();
        const qrCodes = await QRCodeDB.getAllQRCodes();
        
        // Atualizar métricas
        document.getElementById('total-scans').textContent = totalScans;
        document.getElementById('active-qrcodes').textContent = qrCodes.length;
        
        // Renderizar lista de QR codes (apenas os 6 mais recentes)
        await renderQRCodesToContainer(qrCodesList, 6);
        
        // Renderizar gráfico de desempenho
        renderPerformanceChart();
    } catch (error) {
        console.error('Erro ao renderizar dashboard:', error);
        alert('Ocorreu um erro ao carregar os dados.');
    }
}

// Renderizar view de QR Codes
async function renderQRCodesView() {
    try {
        // Renderizar todos os QR codes
        await renderQRCodesToContainer(allQrCodesList);
    } catch (error) {
        console.error('Erro ao renderizar QR Codes view:', error);
        alert('Ocorreu um erro ao carregar os dados.');
    }
}

// Renderizar view de Analytics
async function renderAnalyticsView() {
    try {
        // Obter dados do banco
        const totalScans = await ScanLogDB.getTotalScans();
        const qrCodes = await QRCodeDB.getAllQRCodes();
        const avgScans = qrCodes.length > 0 ? (totalScans / qrCodes.length).toFixed(1) : '0';
        
        // Atualizar métricas
        document.getElementById('analytics-total-scans').textContent = totalScans;
        document.getElementById('analytics-active-qrcodes').textContent = qrCodes.length;
        document.getElementById('analytics-avg-scans').textContent = avgScans;
        
        // Renderizar gráficos de analytics
        renderAnalyticsChart();
        renderTopQRChart();
    } catch (error) {
        console.error('Erro ao renderizar analytics view:', error);
        alert('Ocorreu um erro ao carregar os dados.');
    }
}

// Mostrar detalhes de um QR code
async function showQRDetails(qrId) {
    try {
        currentQRId = qrId;
        const qr = await QRCodeDB.getQRCode(qrId);
        
        if (!qr) {
            alert('QR Code não encontrado');
            return;
        }
        
        // Preencher detalhes
        document.getElementById('details-title').textContent = qr.name;
        document.getElementById('details-created').textContent = `Criado em: ${formatDate(qr.created_at)}`;
        document.getElementById('details-url').textContent = `URL: ${qr.url}`;
        document.getElementById('details-scans').textContent = `Total de scans: ${qr.scans}`;
        
        // Gerar QR code com URL de redirecionamento
        const qrContainer = document.getElementById('details-qr-container');
        qrContainer.innerHTML = '';
        
        const baseUrl = window.location.pathname.includes('github.io') 
            ? `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}`
            : `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}`;
        const redirectUrl = `${baseUrl}/redirect.html?id=${qr.id}`;
        
        // Usar toDataURL em vez de toCanvas
        try {
            QRCode.toDataURL(redirectUrl, { width: 200 }, (error, url) => {
                if (error) {
                    console.error('Erro ao gerar QR Code:', error);
                    return;
                }
                const qrImg = document.createElement('img');
                qrImg.src = url;
                qrImg.style.width = '200px';
                qrImg.style.height = '200px';
                qrContainer.appendChild(qrImg);
                
                // Adicionar botão de download
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-qr-btn-details';
                downloadBtn.textContent = 'Baixar QR Code';
                downloadBtn.addEventListener('click', () => {
                    const filename = `qrcode-${qr.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
                    downloadQRCode(qr.id, filename);
                });
                qrContainer.appendChild(downloadBtn);
            });
        } catch (qrError) {
            console.error('Erro na geração do QR Code:', qrError);
            qrContainer.innerHTML = '<p>Erro ao gerar QR Code</p>';
        }
        
        // Renderizar gráfico de detalhes
        renderDetailsChart(qrId);
        
        showView('details-view');
    } catch (error) {
        console.error('Erro ao mostrar detalhes:', error);
        alert('Ocorreu um erro ao carregar os detalhes do QR Code.');
    }
}

// Funções de edição
editQrBtn.addEventListener('click', async () => {
    try {
        const qr = await QRCodeDB.getQRCode(currentQRId);
        
        if (!qr) {
            alert('QR Code não encontrado');
            return;
        }
        
        document.getElementById('edit-name').value = qr.name;
        document.getElementById('edit-url').value = qr.url;
        
        editModal.style.display = 'block';
    } catch (error) {
        console.error('Erro ao abrir modal de edição:', error);
        alert('Ocorreu um erro ao carregar os dados para edição.');
    }
});

closeModalBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.style.display = 'none';
    }
    if (e.target === deleteModal) {
        deleteModal.style.display = 'none';
    }
    if (e.target === sizeModal) {
        sizeModal.style.display = 'none';
    }
});

saveEditBtn.addEventListener('click', async () => {
    const newName = document.getElementById('edit-name').value;
    const newUrl = document.getElementById('edit-url').value;
    
    if (!newName || !newUrl) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        alert('URL inválida. Certifique-se de incluir http:// ou https://');
        return;
    }
    
    try {
        // Atualizar o QR code no banco de dados
        await QRCodeDB.updateQRCode(currentQRId, {
            name: newName,
            url: newUrl
        });
        
        // Atualizar a view de detalhes
        showQRDetails(currentQRId);
        
        editModal.style.display = 'none';
        alert('QR Code atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar QR Code:', error);
        alert('Ocorreu um erro ao atualizar o QR Code.');
    }
});

// Funções de exclusão
deleteQrBtn.addEventListener('click', () => {
    deleteModal.style.display = 'block';
});

closeDeleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
});

confirmDeleteBtn.addEventListener('click', async () => {
    try {
        await QRCodeDB.deleteQRCode(currentQRId);
        
        deleteModal.style.display = 'none';
        alert('QR Code excluído com sucesso!');
        showView(lastActiveView);
        if (lastActiveView === 'qrcodes-view') {
            renderQRCodesView();
        } else if (lastActiveView === 'analytics-view') {
            renderAnalyticsView();
        } else {
            renderDashboard();
        }
    } catch (error) {
        console.error('Erro ao excluir QR Code:', error);
        alert('Ocorreu um erro ao excluir o QR Code.');
    }
});

// Funções de renderização de gráficos
async function renderPerformanceChart() {
    try {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        // Destruir o gráfico anterior se existir
        if (performanceChart) {
            performanceChart.destroy();
        }
        
        // Obter dados de estatísticas mensais
        const monthlyData = await ScanLogDB.getMonthlyStats();
        
        // Dados para o gráfico
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        // Criar gráfico
        performanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Scans Mensais',
                    data: monthlyData,
                    backgroundColor: 'rgba(119, 73, 248, 0.7)',
                    borderColor: 'rgba(119, 73, 248, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao renderizar gráfico de desempenho:', error);
    }
}

async function renderDetailsChart(qrId) {
    try {
        const ctx = document.getElementById('details-chart').getContext('2d');
        
        // Destruir o gráfico anterior se existir
        if (detailsChart) {
            detailsChart.destroy();
        }
        
        // Obter estatísticas diárias para o QR code
        const dailyStats = await ScanLogDB.getDailyStats(qrId);
        
        // Converter para arrays para o Chart.js
        const labels = Object.keys(dailyStats);
        const values = Object.values(dailyStats);
        
        // Criar gráfico
        detailsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Scans Diários',
                    data: values,
                    backgroundColor: 'rgba(119, 73, 248, 0.1)',
                    borderColor: 'rgba(119, 73, 248, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao renderizar gráfico de detalhes:', error);
    }
}

async function renderAnalyticsChart() {
    try {
        const ctx = document.getElementById('analytics-chart').getContext('2d');
        
        // Destruir o gráfico anterior se existir
        if (analyticsChart) {
            analyticsChart.destroy();
        }
        
        // Obter dados de estatísticas mensais
        const monthlyData = await ScanLogDB.getMonthlyStats();
        
        // Dados para o gráfico
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        // Criar gráfico
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Scans Mensais',
                    data: monthlyData,
                    backgroundColor: 'rgba(119, 73, 248, 0.1)',
                    borderColor: 'rgba(119, 73, 248, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao renderizar gráfico de analytics:', error);
    }
}

async function renderTopQRChart() {
    try {
        const ctx = document.getElementById('top-qr-chart').getContext('2d');
        
        // Destruir o gráfico anterior se existir
        if (topQrChart) {
            topQrChart.destroy();
        }
        
        // Obter QR codes
        let qrCodes = await QRCodeDB.getAllQRCodes();
        
        // Ordenar por número de scans (decrescente)
        qrCodes.sort((a, b) => b.scans - a.scans);
        
        // Pegar os top 5
        const topQRs = qrCodes.slice(0, 5);
        
        const labels = topQRs.map(qr => qr.name);
        const data = topQRs.map(qr => qr.scans);
        
        // Criar gráfico
        topQrChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Scans por QR Code',
                    data: data,
                    backgroundColor: 'rgba(119, 73, 248, 0.7)',
                    borderColor: 'rgba(119, 73, 248, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao renderizar gráfico de top QR Codes:', error);
    }
}

// Funções auxiliares
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Inicializar aplicativo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    checkAuth();
    
    // Configurar o modal de tamanho
    const closeSizeBtn = document.querySelector('.close-size');
    if (closeSizeBtn) {
        closeSizeBtn.addEventListener('click', () => {
            document.getElementById('size-modal').style.display = 'none';
        });
    }
});
