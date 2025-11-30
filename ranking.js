// ranking.js - Lógica da Página de Ranking
import { 
    getAllUsersData, 
    getUserData, 
    saveUserData,
    getCurrentMockUserId,
    DEFAULT_WEEKLY_GOALS
} from './rank.js';
 

// ========== VARIÁVEIS GLOBAIS ==========
let currentUserId = null;
let currentUserData = null;
let allUsersData = [];
let filteredUsers = [];
let selectedUsers = [];
let currentFilter = 'all';

// ========== FUNÇÕES AUXILIARES ==========
function formatMoney(value) {
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getRankClass(index) {
    const classes = ['rank-1', 'rank-2', 'rank-3', 'rank-other'];
    return classes[index] || 'rank-other';
}

function calculateProgress(user) {
    return Math.min((user.xp / user.xpToNextLevel) * 100, 100) || 0;
}

function calculateGoalProgress(user) {
    if (!user.goalAmount || user.goalAmount === 0) return 0;
    return Math.min((user.moneySaved / user.goalAmount) * 100, 100) || 0;
}

// ========== CLASSIFICAÇÃO DE NÍVEIS ==========
function getLevelCategory(level) {
    if (level >= 1 && level <= 3) return 'iniciante';
    if (level >= 4 && level <= 7) return 'intermediario';
    if (level >= 8 && level <= 10) return 'avancado';
    return 'expert';
}

function getLevelCategoryName(category) {
    const names = {
        'iniciante': 'Iniciante',
        'intermediario': 'Intermediário',
        'avancado': 'Avançado',
        'expert': 'Expert'
    };
    return names[category] || category;
}

// ========== FILTRAR POR NÍVEL ==========
window.filterByLevel = function() {
    currentFilter = document.getElementById('levelFilter').value;
    
    if (currentFilter === 'all') {
        filteredUsers = allUsersData.filter(u => u.participateRanking);
    } else {
        filteredUsers = allUsersData.filter(u => 
            u.participateRanking && getLevelCategory(u.level) === currentFilter
        );
    }
    
    // Limpar seleção ao trocar filtro
    selectedUsers = [];
    
    renderRanking();
    renderSelectedUsers();
}

// ========== RENDERIZAR RANKING ==========
function renderRanking() {
    const rankingList = document.getElementById('rankingList');
    
    if (filteredUsers.length === 0) {
        rankingList.innerHTML = '<p class="text-muted">Nenhum usuário encontrado neste nível.</p>';
        return;
    }
    
    // Ordenar por XP
    const sortedUsers = [...filteredUsers].sort((a, b) => b.xp - a.xp);
    
    rankingList.innerHTML = sortedUsers.map((user, index) => {
        const isCurrentUser = user.id === currentUserId;
        const isSelected = selectedUsers.some(u => u.id === user.id);
        const progress = calculateProgress(user);
        const rankClass = getRankClass(index);
        const levelCategory = getLevelCategory(user.level);
        const levelCategoryName = getLevelCategoryName(levelCategory);
        
        return `
            <div class="card user-card ${isCurrentUser ? 'current-user' : ''} ${isSelected ? 'selected' : ''}" 
                 data-user-id="${user.id}" 
                 data-user-level="${user.level}"
                 data-level-category="${levelCategory}"
                 onclick="selectUser('${user.id}')">
                <div class="card-body d-flex align-items-center p-3">
                    <div class="rank-badge ${rankClass} me-3">${index + 1}</div>
                    <div class="avatar me-3">${user.avatar}</div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            ${user.name} 
                            ${isCurrentUser ? '<span class="badge bg-warning text-dark">VOCÊ</span>' : ''}
                            <span class="badge bg-info ms-2">${levelCategoryName}</span>
                        </h6>
                        <div class="xp-bar">
                            <div class="xp-progress" style="width: ${progress}%">
                                Nível ${user.level} - ${user.xp}/${user.xpToNextLevel} XP
                            </div>
                        </div>
                        <small class="text-muted">
                            💰 ${formatMoney(user.moneySaved)} | 
                            🎯 Meta: ${calculateGoalProgress(user).toFixed(0)}%
                        </small>
                    </div>
                </div>
                <div class="level-badge-corner ${levelCategory}">L${user.level}</div>
            </div>
        `;
    }).join('');
}

// ========== SELECIONAR USUÁRIO ==========
window.selectUser = function(userId) {
    const user = filteredUsers.find(u => u.id === userId);
    if (!user) return;
    
    const index = selectedUsers.findIndex(u => u.id === userId);
    
    if (index !== -1) {
        // Desselecionar
        selectedUsers.splice(index, 1);
    } else {
        // Verificar se já tem 2 selecionados
        if (selectedUsers.length >= 2) {
            selectedUsers.shift(); // Remove o primeiro
        }
        
        // Verificar se é do mesmo nível
        if (selectedUsers.length > 0) {
            const firstUserCategory = getLevelCategory(selectedUsers[0].level);
            const currentUserCategory = getLevelCategory(user.level);
            
            if (firstUserCategory !== currentUserCategory) {
                alert(`⚠️ Você só pode comparar usuários do mesmo nível!\n\nPrimeiro selecionado: ${getLevelCategoryName(firstUserCategory)}\nTentando selecionar: ${getLevelCategoryName(currentUserCategory)}`);
                return;
            }
        }
        
        selectedUsers.push(user);
    }
    
    renderRanking();
    renderSelectedUsers();
}

// ========== RENDERIZAR USUÁRIOS SELECIONADOS ==========
function renderSelectedUsers() {
    const countEl = document.getElementById('selectedCount');
    const listEl = document.getElementById('selected-users');
    const compareBtn = document.getElementById('compare-btn');
    
    countEl.textContent = selectedUsers.length;
    
    if (selectedUsers.length === 0) {
        listEl.innerHTML = '<p class="text-muted small">Clique nos usuários</p>';
        compareBtn.disabled = true;
    } else if (selectedUsers.length === 1) {
        const user = selectedUsers[0];
        const category = getLevelCategoryName(getLevelCategory(user.level));
        listEl.innerHTML = `
            <div class="alert alert-info p-2 mb-2">
                <strong>${user.name}</strong><br>
                <small>Nível ${user.level} (${category})</small>
            </div>
            <p class="text-muted small">Selecione mais um usuário ${category}</p>
        `;
        compareBtn.disabled = true;
    } else {
        const category = getLevelCategoryName(getLevelCategory(selectedUsers[0].level));
        listEl.innerHTML = selectedUsers.map(u => `
            <div class="alert alert-info p-2 mb-2">
                <strong>${u.name}</strong><br>
                <small>Nível ${u.level} (${category})</small>
            </div>
        `).join('');
        compareBtn.disabled = false;
    }
}

// ========== MOSTRAR COMPARAÇÃO ==========
window.showComparison = function() {
    if (selectedUsers.length !== 2) return;
    
    const u1 = selectedUsers[0];
    const u2 = selectedUsers[1];
    const comparisonEl = document.getElementById('comparison');
    const category = getLevelCategoryName(getLevelCategory(u1.level));
    
    const maxMoney = Math.max(u1.moneySaved, u2.moneySaved);
    const maxXP = Math.max(u1.xp, u2.xp);
    
    const comparisonHTML = `
        <div class="card shadow">
            <div class="card-body p-4">
                <h3 class="text-center mb-4">⚔️ Comparação Detalhada</h3>
                <p class="text-center text-muted mb-4">Nível ${category}</p>
                
                <!-- Cabeçalhos -->
                <div class="row text-center mb-4">
                    <div class="col-5">
                        <div class="avatar mx-auto mb-2" style="width: 80px; height: 80px; font-size: 32px;">
                            ${u1.avatar}
                        </div>
                        <h5>${u1.name}</h5>
                        <p class="text-muted">Nível ${u1.level}</p>
                    </div>
                    <div class="col-2 d-flex align-items-center justify-content-center">
                        <h1>VS</h1>
                    </div>
                    <div class="col-5">
                        <div class="avatar mx-auto mb-2" style="width: 80px; height: 80px; font-size: 32px;">
                            ${u2.avatar}
                        </div>
                        <h5>${u2.name}</h5>
                        <p class="text-muted">Nível ${u2.level}</p>
                    </div>
                </div>
                
                <!-- Comparação de Dinheiro -->
                <div class="stat-box">
                    <h6>💰 Dinheiro Economizado</h6>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${(u1.moneySaved/maxMoney)*100}%">
                            ${formatMoney(u1.moneySaved)}
                        </div>
                    </div>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${(u2.moneySaved/maxMoney)*100}%">
                            ${formatMoney(u2.moneySaved)}
                        </div>
                    </div>
                </div>
                
                <!-- Comparação de XP -->
                <div class="stat-box">
                    <h6>⭐ Experiência (XP)</h6>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${(u1.xp/maxXP)*100}%">
                            ${u1.xp} XP
                        </div>
                    </div>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${(u2.xp/maxXP)*100}%">
                            ${u2.xp} XP
                        </div>
                    </div>
                </div>
                
                <!-- Comparação de Progresso da Meta -->
                <div class="stat-box">
                    <h6>🎯 Progresso da Meta</h6>
                    <div class="row text-center">
                        <div class="col-6">
                            <div class="circular-progress">
                                <h3>${calculateGoalProgress(u1).toFixed(1)}%</h3>
                                <small>${u1.name.split(' ')[0]}</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="circular-progress">
                                <h3>${calculateGoalProgress(u2).toFixed(1)}%</h3>
                                <small>${u2.name.split(' ')[0]}</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Estatísticas Adicionais -->
                <div class="row text-center mt-4">
                    <div class="col-6">
                        <div class="stat-box">
                            <small class="text-muted">🎯 Metas Concluídas</small>
                            <h5>${u1.completedGoals.length}</h5>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="stat-box">
                            <small class="text-muted">🎯 Metas Concluídas</small>
                            <h5>${u2.completedGoals.length}</h5>
                        </div>
                    </div>
                </div>
                
                <!-- Vencedor -->
                <div class="text-center mt-4 p-3 rounded" style="background: linear-gradient(135deg, #28a745, #20c997); color: white;">
                    <h4>🏆 Melhor Investidor</h4>
                    <h3>${u1.moneySaved > u2.moneySaved ? u1.name : u2.name}</h3>
                    <p>Diferença: ${formatMoney(Math.abs(u1.moneySaved - u2.moneySaved))}</p>
                </div>
            </div>
        </div>
    `;
    
    comparisonEl.innerHTML = comparisonHTML;
    comparisonEl.style.display = 'block';
    comparisonEl.scrollIntoView({ behavior: 'smooth' });
}

// ========== RENDERIZAR METAS SEMANAIS ==========
function renderGoals() {
    const goalsEl = document.getElementById('weekly-goals');
    
    if (!currentUserData) {
        goalsEl.innerHTML = '<p class="text-light">Faça login para ver suas metas</p>';
        return;
    }
    
    const allGoals = [...DEFAULT_WEEKLY_GOALS, ...(currentUserData.customGoals || [])];
    let completedCount = 0;
    let xpTotal = 0;
    
    goalsEl.innerHTML = allGoals.map(goal => {
        const isCompleted = currentUserData.completedGoals.includes(goal.id);
        if (isCompleted) {
            completedCount++;
            xpTotal += goal.xp;
        }
        
        return `
            <div class="goal-card d-flex justify-content-between align-items-center ${isCompleted ? 'completed' : ''}">
                <div class="d-flex align-items-center">
                    <span class="fs-4 me-3">${goal.icon || '🎯'}</span>
                    <div>
                        <strong>${goal.title}</strong>
                        <div class="small text-muted">+${goal.xp} XP</div>
                    </div>
                </div>
                <div>
                    ${isCompleted ? '<span class="badge bg-success">✅ Concluído</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('progress').textContent = `${completedCount}/${allGoals.length}`;
    document.getElementById('xp-gained').textContent = `+${xpTotal} XP`;
}

// ========== RENDERIZAR ESTATÍSTICAS ==========
 function renderGlobalStats() {
   const statsEl = document.getElementById('stats');
    
     const totalMoney = allUsersData.reduce((sum, u) => sum + (u.moneySaved || 0), 0);
     const totalXP = allUsersData.reduce((sum, u) => sum + (u.xp || 0), 0);
     const avgLevel = allUsersData.length > 0 ? (totalXP / allUsersData.length / 1000).toFixed(1) : 0;
    
    statsEl.innerHTML = `
        <div class="meta-card">
            <div class="d-flex justify-content-between">
                 <strong>Total Economizado:</strong>
                 <span>${formatMoney(totalMoney)}</span>
             </div>
         </div>
        <div class="meta-card">
           <div class="d-flex justify-content-between">
             <strong>Participantes:</strong>
                 <span>${allUsersData.length}</span>
             </div>
         </div>
         <div class="meta-card">
             <div class="d-flex justify-content-between">
                 <strong>Nível Médio:</strong>
                 <span>L${avgLevel}</span>
             </div>
         </div>
    `;
 }

// // ========== TIMER SEMANAL ==========
// function startTimer() {
//     const oneWeek = 7 * 24 * 60 * 60 * 1000;
//     const endTime = Date.now() + oneWeek;
    
//     function updateTimer() {
//         const now = Date.now();
//         const distance = endTime - now;
        
//         if (distance < 0) {
//             document.getElementById('timer').textContent = "Semana Encerrada!";
//             return;
//         }
        
//         const days = Math.floor(distance / (1000 * 60 * 60 * 24));
//         const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//         const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
//         document.getElementById('timer').textContent = `${days}d ${hours}h ${minutes}m`;
//         setTimeout(updateTimer, 60000);
//     }
//     updateTimer();
// }

// ========== INICIALIZAÇÃO ==========
window.onload = function() {
    currentUserId = getCurrentMockUserId();
    allUsersData = getAllUsersData();
    currentUserData = getUserData(currentUserId);
    
    // Filtrar por padrão (todos os participantes)
    filteredUsers = allUsersData.filter(u => u.participateRanking);
    
    renderRanking();
    renderSelectedUsers();
    renderGoals();
    renderGlobalStats();
    startTimer();
};