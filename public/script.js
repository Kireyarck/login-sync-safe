// Configuração do Supabase
const SUPABASE_URL = 'https://pilcqovqgtkwibfepgjv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbGNxb3ZxZ3Rrd2liZmVwZ2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzkwNzksImV4cCI6MjA3MTMxNTA3OX0.lsuvHE6PymPMB_5hU7gKWrclRm5MjTnOivQOYIepsKQ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado global
let credentials = [];
let currentCredential = null;
let searchTerm = '';

// Elementos DOM
const elements = {
    searchInput: document.getElementById('searchInput'),
    addButton: document.getElementById('addButton'),
    credentialsGrid: document.getElementById('credentialsGrid'),
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('emptyState'),
    stats: document.getElementById('stats'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    credentialForm: document.getElementById('credentialForm'),
    cancelButton: document.getElementById('cancelButton'),
    generatePassword: document.getElementById('generatePassword'),
    toast: document.getElementById('toast')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    fetchCredentials();
});

function initializeEventListeners() {
    elements.searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderCredentials();
    });

    elements.addButton.addEventListener('click', () => {
        currentCredential = null;
        elements.modalTitle.textContent = 'Nova Credencial';
        resetForm();
        showModal();
    });

    elements.closeModal.addEventListener('click', hideModal);
    elements.cancelButton.addEventListener('click', hideModal);

    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            hideModal();
        }
    });

    elements.credentialForm.addEventListener('submit', handleFormSubmit);
    elements.generatePassword.addEventListener('click', generatePassword);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal();
        }
    });
}

async function fetchCredentials() {
    showLoading(true);
    
    try {
        const { data, error } = await supabase
            .from('credentials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        credentials = data || [];
        renderCredentials();
        updateStats();
    } catch (error) {
        console.error('Erro ao buscar credenciais:', error);
        showToast('Erro ao carregar credenciais', 'error');
    } finally {
        showLoading(false);
    }
}

function renderCredentials() {
    const filteredCredentials = credentials.filter(credential => {
        if (!searchTerm) return true;
        return (
            credential.platform.toLowerCase().includes(searchTerm) ||
            credential.username.toLowerCase().includes(searchTerm) ||
            (credential.domain && credential.domain.toLowerCase().includes(searchTerm))
        );
    });

    if (filteredCredentials.length === 0) {
        elements.credentialsGrid.style.display = 'none';
        elements.emptyState.style.display = 'block';
    } else {
        elements.credentialsGrid.style.display = 'grid';
        elements.emptyState.style.display = 'none';
        
        elements.credentialsGrid.innerHTML = filteredCredentials
            .map(credential => createCredentialCard(credential))
            .join('');
        
        // Adicionar event listeners para os cards
        filteredCredentials.forEach(credential => {
            const card = document.querySelector(`[data-credential-id="${credential.id}"]`);
            if (card) {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('.credential-actions')) {
                        editCredential(credential);
                    }
                });
            }
        });
    }
}

function createCredentialCard(credential) {
    const platformIcon = getPlatformIcon(credential.platform);
    
    return `
        <div class="credential-card" data-credential-id="${credential.id}">
            <div class="credential-header">
                <div class="platform-icon">
                    <i class="${platformIcon}"></i>
                </div>
                <div class="platform-name">${credential.platform}</div>
            </div>
            <div class="credential-info">
                ${credential.domain ? `
                    <div class="info-row">
                        <span class="info-label">Domínio:</span>
                        <span class="info-value">${credential.domain}</span>
                    </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">Usuário:</span>
                    <span class="info-value">${credential.username}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Senha:</span>
                    <span class="info-value password-value">••••••••</span>
                </div>
            </div>
            <div class="credential-actions">
                <button class="btn btn-secondary btn-icon" onclick="event.stopPropagation(); copyToClipboard('${credential.username}', 'Usuário copiado!')" title="Copiar usuário">
                    <i class="fas fa-user"></i>
                </button>
                <button class="btn btn-secondary btn-icon" onclick="event.stopPropagation(); copyToClipboard('${credential.password}', 'Senha copiada!')" title="Copiar senha">
                    <i class="fas fa-key"></i>
                </button>
                <button class="btn btn-secondary btn-icon" onclick="event.stopPropagation(); togglePassword('${credential.id}')" title="Mostrar/Ocultar senha">
                    <i class="fas fa-eye" id="eye-${credential.id}"></i>
                </button>
            </div>
        </div>
    `;
}

function getPlatformIcon(platform) {
    const icons = {
        'google': 'fab fa-google',
        'facebook': 'fab fa-facebook',
        'twitter': 'fab fa-twitter',
        'instagram': 'fab fa-instagram',
        'linkedin': 'fab fa-linkedin',
        'github': 'fab fa-github',
        'microsoft': 'fab fa-microsoft',
        'apple': 'fab fa-apple',
        'amazon': 'fab fa-amazon',
        'netflix': 'fab fa-n',
        'spotify': 'fab fa-spotify',
        'youtube': 'fab fa-youtube',
        'whatsapp': 'fab fa-whatsapp',
        'telegram': 'fab fa-telegram',
        'discord': 'fab fa-discord'
    };
    
    const lowerPlatform = platform.toLowerCase();
    return icons[lowerPlatform] || 'fas fa-globe';
}

function togglePassword(credentialId) {
    const credential = credentials.find(c => c.id === credentialId);
    const card = document.querySelector(`[data-credential-id="${credentialId}"]`);
    const passwordElement = card.querySelector('.password-value');
    const eyeIcon = document.getElementById(`eye-${credentialId}`);
    
    if (passwordElement.textContent === '••••••••') {
        passwordElement.textContent = credential.password;
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordElement.textContent = '••••••••';
        eyeIcon.className = 'fas fa-eye';
    }
}

async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(message, 'success');
    } catch (error) {
        console.error('Erro ao copiar:', error);
        showToast('Erro ao copiar', 'error');
    }
}

function editCredential(credential) {
    currentCredential = credential;
    elements.modalTitle.textContent = 'Editar Credencial';
    
    document.getElementById('platform').value = credential.platform;
    document.getElementById('domain').value = credential.domain || '';
    document.getElementById('username').value = credential.username;
    document.getElementById('password').value = credential.password;
    
    showModal();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        platform: document.getElementById('platform').value.trim(),
        domain: document.getElementById('domain').value.trim() || null,
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
    };
    
    if (!formData.platform || !formData.username || !formData.password) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    try {
        let result;
        
        if (currentCredential) {
            // Atualizar credencial existente
            result = await supabase
                .from('credentials')
                .update(formData)
                .eq('id', currentCredential.id);
        } else {
            // Criar nova credencial
            result = await supabase
                .from('credentials')
                .insert([formData]);
        }
        
        if (result.error) throw result.error;
        
        showToast(
            currentCredential ? 'Credencial atualizada!' : 'Credencial salva!',
            'success'
        );
        
        hideModal();
        fetchCredentials();
    } catch (error) {
        console.error('Erro ao salvar credencial:', error);
        showToast('Erro ao salvar credencial', 'error');
    }
}

function generatePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    document.getElementById('password').value = password;
    showToast('Senha gerada!', 'success');
}

function updateStats() {
    const totalCredentials = credentials.length;
    const uniquePlatforms = new Set(credentials.map(c => c.platform.toLowerCase())).size;
    const withDomains = credentials.filter(c => c.domain).length;
    
    elements.stats.innerHTML = `
        <div class="stat-item">
            <div class="stat-number">${totalCredentials}</div>
            <div class="stat-label">Total de Credenciais</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${uniquePlatforms}</div>
            <div class="stat-label">Plataformas Únicas</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${withDomains}</div>
            <div class="stat-label">Com Domínio</div>
        </div>
    `;
}

function showModal() {
    elements.modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    elements.modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetForm();
}

function resetForm() {
    elements.credentialForm.reset();
    currentCredential = null;
}

function showLoading(show) {
    elements.loading.style.display = show ? 'block' : 'none';
    elements.credentialsGrid.style.display = show ? 'none' : 'grid';
}

function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}