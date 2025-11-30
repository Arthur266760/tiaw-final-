// funcionalidade.js
import { 
    getAllUsersData, 
    getUserData, 
    saveUserData, 
    getCurrentMockUserId,
    DEFAULT_WEEKLY_GOALS
} from './bd.js';

// Variáveis de Estado do Aplicativo
let currentUserId = null;
let currentUserData = null;
let allUsersData = []; 
let goalDoughnutChart = null; 

// Variáveis de Controle de UI
window.selectedUsers = [];
window.editingInvestmentId = null;

// =======================================================
// Funções Auxiliares
// =======================================================


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

function checkLevelUp(currentXp, currentLevel) {
    let newLevel = currentLevel;
    let xpRequired = newLevel * 1000;
    
    while (currentXp >= xpRequired) {
        newLevel++;
        xpRequired = newLevel * 1000;
        console.log(`🎉 PARABÉNS! Você subiu para o Nível ${newLevel}!`);
    }
    return newLevel;
}

// =======================================================
// Funções de Renderização (UI)
// =======================================================

// Função para renderizar o gráfico Chart.js
function renderGoalChart(saved, goal) {
    const actualSaved = Math.min(saved, goal); 
    const remaining = Math.max(0, goal - saved); 
    // Garante que o gráfico não mostre falta se a meta foi batida
    const chartData = [actualSaved, remaining]; 

    const ctx = document.getElementById('goalDoughnutChart')?.getContext('2d');

    if (!ctx) return;

    if (goalDoughnutChart) {
        goalDoughnutChart.data.datasets[0].data = chartData;
        
        // Cor do progresso (Verde sólido se meta batida)
        if (saved >= goal) {
            goalDoughnutChart.data.datasets[0].backgroundColor[0] = '#20c997'; 
        } else {
             goalDoughnutChart.data.datasets[0].backgroundColor[0] = '#28a745'; 
        }

        goalDoughnutChart.update();
    } else {
        goalDoughnutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Economizado', 'Falta'],
                datasets: [{
                    data: chartData,
                    backgroundColor: [
                        '#28a745', // Cor para Economizado (Verde)
                        '#adb5bd'  // Cor para o que falta (Cinza Claro)
                    ],
                    hoverOffset: 4,
                    borderWidth: 0 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%', 
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += formatMoney(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Função de Renderização Principal
function renderAll(user, allUsers) {
    if (!user) return; 

    // Atualizar progresso pessoal
    document.getElementById('currentMoney').textContent = formatMoney(user.moneySaved);
    document.getElementById('goalMoney').textContent = formatMoney(user.goalAmount);
    const remaining = Math.max(0, user.goalAmount - user.moneySaved);
    document.getElementById('remainingMoney').textContent = formatMoney(remaining);
    document.getElementById('currentUserLevel').textContent = `Nível ${user.level}`;
    
    const progress = calculateGoalProgress(user);
    document.getElementById('progressFill').style.height = `${progress}%`;
    document.getElementById('progressFill').textContent = `${progress.toFixed(1)}%`;
    
    // Renderizar Gráfico
    renderGoalChart(user.moneySaved, user.goalAmount);

    // Renderizar Investimentos
    renderInvestments(user.investments);

    // Renderizar Metas
    renderGoals(user.completedGoals, user.customGoals);

    // Renderizar Ranking
    renderLeaderboard(user.id, allUsers);

    // Renderizar Conquistas
    renderAchievements(user.achievements);

    // Renderizar Estatísticas Globais
    renderGlobalStats(allUsers);
}


function renderInvestments(investments) {
    const listEl = document.getElementById('investmentsList');
    if (investments.length === 0) {
        listEl.innerHTML = '<p class="text-muted">Nenhum investimento registrado ainda.</p>';
        return;
    }

    const sortedInvestments = [...investments].sort((a, b) => new Date(b.date) - new Date(a.date));

    listEl.innerHTML = sortedInvestments.map(inv => {
        // Usamos encodeURIComponent e decodeURIComponent para passar objetos complexos via onClick
        const invString = encodeURIComponent(JSON.stringify(inv));
        
        return `
            <div class="investment-card d-flex justify-content-between align-items-center" onclick="window.openInvestmentModal(JSON.parse(decodeURIComponent('${invString}')))">
                <div>
                    <strong>${formatMoney(inv.amount)}</strong>
                    <div class="small text-muted">${inv.description || 'Sem descrição'}</div>
                </div>
                <div class="text-end">
                    <small class="text-muted">${inv.date}</small>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="event.stopPropagation(); window.deleteInvestment('${inv.id}')">
                        <small>Excluir</small>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}


function renderGoals(completedGoals, customGoals) {
    const allGoals = [...DEFAULT_WEEKLY_GOALS, ...(customGoals || [])];
    const goalsEl = document.getElementById('weekly-goals');
    let completedCount = 0;
    let xpTotal = 0;

    goalsEl.innerHTML = allGoals.map(goal => {
        const isCompleted = completedGoals.includes(goal.id);
        if (isCompleted) {
            completedCount++;
            xpTotal += goal.xp;
        }
        
        const deleteBtn = goal.isCustom ? 
            `<button class="btn btn-sm btn-outline-danger ms-2" onclick="window.deleteCustomGoal('${goal.id}')"><small>Del</small></button>` : '';

        return `
            <div class="goal-card d-flex justify-content-between align-items-center ${isCompleted ? 'completed' : ''}">
                <div class="d-flex align-items-center">
                    <span class="fs-4 me-3">${goal.icon || '🎯'}</span>
                    <div>
                        <strong>${goal.title}</strong>
                        <div class="small text-muted">+${goal.xp} XP</div>
                    </div>
                </div>
                <div class="text-end">
                    ${!isCompleted ? 
                        `<button class="btn btn-sm btn-success btn-custom" onclick="window.completeGoal('${goal.id}', ${goal.xp})">Concluir</button>` : 
                        '<span>✅ Concluído</span>'
                    }
                    ${deleteBtn}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('progress').textContent = `${completedCount}/${allGoals.length}`;
    document.getElementById('xp-gained').textContent = `+${xpTotal} XP`;
}


function renderLeaderboard(currentId, users) {
    const leaderboardEl = document.getElementById('leaderboard');
    
    const rankedUsers = users
        .filter(u => u.participateRanking)
        .sort((a, b) => b.xp - a.xp);

    leaderboardEl.innerHTML = rankedUsers.map((user, index) => {
        const isCurrentUser = user.id === currentId;
        const isSelected = window.selectedUsers.some(u => u.id === user.id);
        const progress = calculateProgress(user);
        const rankClass = getRankClass(index);
        
        return `
            <div class="card user-card ${isCurrentUser ? 'current-user' : ''} ${isSelected ? 'selected' : ''}" data-user-id="${user.id}" data-user-level="${user.level}" onclick="window.toggleUserSelection('${user.id}')">
                <div class="card-body d-flex align-items-center p-3">
                    <div class="rank-badge ${rankClass} me-3">${index + 1}</div>
                    <div class="avatar me-3">${user.avatar}</div>
                    <div class="flex-grow-1">
                        <h6>${user.name} ${isCurrentUser ? '(Você)' : ''}</h6>
                        <div class="xp-bar">
                            <div class="xp-progress" style="width: ${progress}%">
                                Nível ${user.level} (${user.xp} XP)
                            </div>
                        </div>
                        <small class="text-muted">Meta: ${calculateGoalProgress(user).toFixed(0)}%</small>
                    </div>
                </div>
                <div class="level-badge">L${user.level}</div>
            </div>
        `;
    }).join('') || '<p class="text-muted">Nenhum outro usuário no ranking público.</p>';
    
    renderSelectedUsers();
}

function renderSelectedUsers() {
    const countEl = document.getElementById('selectedCount');
    const listEl = document.getElementById('selected-users');
    const compareBtn = document.getElementById('compare-btn');

    countEl.textContent = window.selectedUsers.length;
    
    if (window.selectedUsers.length === 2 && window.selectedUsers[0].level === window.selectedUsers[1].level) {
        listEl.innerHTML = window.selectedUsers.map(u => `<div class="meta-card small">${u.name} (L${u.level})</div>`).join('');
        compareBtn.disabled = false;
    } else {
        listEl.innerHTML = '<p class="text-muted small">Selecione 2 usuários do mesmo nível</p>';
        compareBtn.disabled = true;
    }
}

function renderAchievements(achievements) {
    const achievementsEl = document.getElementById('achievements');
    if (achievements.length === 0) {
         achievementsEl.innerHTML = '<p class="text-muted">Nenhuma conquista ainda. Complete metas!</p>';
         return;
    }
    achievementsEl.innerHTML = achievements.map(a => `
        <span class="badge bg-success me-2 mb-2 p-2">${a}</span>
    `).join('');
}

function renderGlobalStats(users) {
    const statsEl = document.getElementById('stats');
    
    const totalMoney = users.reduce((sum, u) => sum + (u.moneySaved || 0), 0);
    const totalXp = users.reduce((sum, u) => sum + (u.xp || 0), 0);
    const avgLevel = users.length > 0 ? (totalXp / users.length / 1000).toFixed(1) : 0;

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
                <span>${users.length}</span>
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

// =======================================================
// Funções de Interação (Event Handlers)
// =======================================================

// Lógica para carregar os dados
async function loadAndRender() {
    currentUserId = getCurrentMockUserId();
    document.getElementById('currentUserIdDisplay').textContent = currentUserId;

    allUsersData = getAllUsersData();
    currentUserData = getUserData(currentUserId);
    
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    if (currentUserData) {
        renderAll(currentUserData, allUsersData);
    } else {
        document.getElementById('welcomeModal').classList.add('active');
    }
}

// 1. Iniciar Jornada (Primeiro cadastro)
window.startJourney = function() {
    const name = document.getElementById('userName').value.trim();
    const goal = parseFloat(document.getElementById('userGoal').value);
    const initial = parseFloat(document.getElementById('initialInvestment').value) || 0;
    const acceptRanking = document.getElementById('acceptRanking').checked;

    if (!name || !goal || goal <= 0) {
        console.error('⚠️ Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    const newUserInitialData = {
        id: currentUserId,
        name: name,
        avatar: name.charAt(0).toUpperCase(),
        moneySaved: initial,
        goalAmount: goal,
        xp: initial > 0 ? 100 : 0,
        level: 1,
        xpToNextLevel: 1000,
        achievements: ["🌱 Começando"],
        weeklyGoalsCompleted: 0,
        savingStreak: 0,
        investments: initial > 0 ? [{
            id: 'inv-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            amount: initial,
            description: "Investimento inicial"
        }] : [],
        completedGoals: [],
        customGoals: [],
        participateRanking: acceptRanking,
        lastUpdate: new Date().toISOString()
    };

    currentUserData = newUserInitialData;
    const updatedUsers = saveUserData(newUserInitialData); // Salva e retorna todos os usuários
    allUsersData = updatedUsers;

    document.getElementById('welcomeModal').classList.remove('active');
    console.log("Novo usuário salvo com sucesso!");
    renderAll(currentUserData, allUsersData);
}

// 2. Modais de Investimento
window.openInvestmentModal = function(investment = null) {
    window.editingInvestmentId = investment ? investment.id : null;
    
    if (investment) {
        document.getElementById('investmentDate').value = investment.date;
        document.getElementById('investmentAmount').value = investment.amount;
        document.getElementById('investmentDesc').value = investment.description || '';
    } else {
        document.getElementById('investmentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('investmentAmount').value = '';
        document.getElementById('investmentDesc').value = '';
    }
    
    document.getElementById('investmentModal').classList.add('active');
}

window.closeInvestmentModal = function() {
    document.getElementById('investmentModal').classList.remove('active');
    window.editingInvestmentId = null;
}

// 3. Salvar Investimento
window.saveInvestment = function() {
    const date = document.getElementById('investmentDate').value;
    const amount = parseFloat(document.getElementById('investmentAmount').value);
    const description = document.getElementById('investmentDesc').value.trim();

    if (!date || !amount || amount <= 0) {
        console.error('⚠️ Por favor, preencha os campos obrigatórios!');
        return;
    }
    
    let xpGained = 0;
    let currentInvestments = [...currentUserData.investments];
    let newMoneySaved = currentUserData.moneySaved;
    let newXp = currentUserData.xp;

    if (window.editingInvestmentId) {
        // Lógica de Edição
        const investmentIndex = currentInvestments.findIndex(i => i.id === window.editingInvestmentId);
        if (investmentIndex !== -1) {
            const oldAmount = currentInvestments[investmentIndex].amount;
            newMoneySaved += (amount - oldAmount);
            
            currentInvestments[investmentIndex] = {
                id: window.editingInvestmentId,
                date: date,
                amount: amount,
                description: description
            };
        }
    } else {
        // Lógica de Novo Investimento
        const newInvestment = {
            id: 'inv-' + Date.now(),
            date: date,
            amount: amount,
            description: description || `Investimento de ${formatMoney(amount)}`
        };
        currentInvestments.push(newInvestment);
        newMoneySaved += amount;
        
        // Ganhar XP por investir
        xpGained = Math.floor(amount / 10);
        newXp += xpGained;
    }
    
    // Atualizar dados do usuário localmente
    currentUserData.moneySaved = newMoneySaved;
    currentUserData.xp = newXp;
    currentUserData.investments = currentInvestments;
    currentUserData.level = checkLevelUp(newXp, currentUserData.level);
    currentUserData.lastUpdate = new Date().toISOString();

    // Salvar e re-renderizar
    const updatedUsers = saveUserData(currentUserData);
    allUsersData = updatedUsers;

    console.log(`Investimento salvo. XP Ganhos: ${xpGained}`);
    renderAll(currentUserData, allUsersData);
    window.closeInvestmentModal();
}

// 4. Deletar Investimento
window.deleteInvestment = function(investmentId) {
    if (!confirm('🗑️ Tem certeza que deseja excluir este investimento?')) return;

    const investment = currentUserData.investments.find(i => i.id === investmentId);
    if (!investment) return;

    currentUserData.moneySaved -= investment.amount;
    currentUserData.investments = currentUserData.investments.filter(i => i.id !== investmentId);
    currentUserData.lastUpdate = new Date().toISOString();

    // Salvar e re-renderizar
    const updatedUsers = saveUserData(currentUserData);
    allUsersData = updatedUsers;

    console.log("Investimento excluído com sucesso.");
    renderAll(currentUserData, allUsersData);
}

// 5. Concluir Meta
window.completeGoal = function(goalId, xp) {
    if (currentUserData.completedGoals.includes(goalId)) return;

    currentUserData.completedGoals.push(goalId);
    currentUserData.xp += xp;
    currentUserData.level = checkLevelUp(currentUserData.xp, currentUserData.level);
    currentUserData.lastUpdate = new Date().toISOString();
    
    // Salvar e re-renderizar
    const updatedUsers = saveUserData(currentUserData);
    allUsersData = updatedUsers;

    console.log(`Meta concluída! +${xp} XP.`);
    renderAll(currentUserData, allUsersData);
}

// 6. Criar Meta Customizada
window.openCustomGoalModal = function() {
    document.getElementById('customGoalTitle').value = '';
    document.getElementById('customGoalXP').value = '200';
    document.getElementById('customGoalIcon').value = '📚';
    document.getElementById('customGoalModal').classList.add('active');
}

window.closeCustomGoalModal = function() {
    document.getElementById('customGoalModal').classList.remove('active');
}

window.saveCustomGoal = function() {
    const title = document.getElementById('customGoalTitle').value.trim();
    const xp = parseInt(document.getElementById('customGoalXP').value);
    const icon = document.getElementById('customGoalIcon').value.trim() || '🎯';

    if (!title || xp <= 0) {
        console.error('⚠️ Preencha o título e XP válidos.');
        return;
    }

    const newGoal = {
        id: 'cgoal-' + Date.now(),
        title: title,
        xp: xp,
        icon: icon,
        isCustom: true
    };
    
    currentUserData.customGoals = [...(currentUserData.customGoals || []), newGoal];
    currentUserData.lastUpdate = new Date().toISOString();

    const updatedUsers = saveUserData(currentUserData);
    allUsersData = updatedUsers;

    console.log("Meta personalizada criada com sucesso!");
    window.closeCustomGoalModal();
    renderAll(currentUserData, allUsersData);
}
        
// 7. Deletar Meta Customizada
window.deleteCustomGoal = function(goalId) {
     if (!confirm('🗑️ Tem certeza que deseja excluir esta meta personalizada?')) return;
     
     currentUserData.customGoals = currentUserData.customGoals.filter(g => g.id !== goalId);
     currentUserData.lastUpdate = new Date().toISOString();

     const updatedUsers = saveUserData(currentUserData);
     allUsersData = updatedUsers;

     console.log("Meta personalizada excluída com sucesso.");
     renderAll(currentUserData, allUsersData);
}

// 8. Seleção de Usuário para Comparação
window.toggleUserSelection = function(userId) {
    const user = allUsersData.find(u => u.id === userId);
    if (!user) return;

    const index = window.selectedUsers.findIndex(u => u.id === userId);

    if (index !== -1) {
        // Desselecionar
        window.selectedUsers.splice(index, 1);
    } else {
        // Tentar Selecionar
        if (window.selectedUsers.length >= 2) {
            window.selectedUsers.shift();
        }
        
        if (window.selectedUsers.length > 0 && user.level !== window.selectedUsers[0].level) {
             console.log("⚠️ Você só pode comparar usuários do mesmo nível!");
             return;
        }
        
        window.selectedUsers.push(user);
    }

    renderSelectedUsers();
    renderLeaderboard(currentUserData.id, allUsersData); 
}

// 9. Mostrar Comparação
window.showComparison = function() {
    if (window.selectedUsers.length !== 2) return;

    const u1 = window.selectedUsers[0];
    const u2 = window.selectedUsers[1];
    const comparisonEl = document.getElementById('comparison');

    const compareData = [
        { name: 'Nível', u1: u1.level, u2: u2.level, format: v => `L${v}` },
        { name: 'XP Total', u1: u1.xp, u2: u2.xp, format: v => `${v}` },
        { name: 'Economizado', u1: u1.moneySaved, u2: u2.moneySaved, format: formatMoney },
        { name: '% da Meta', u1: calculateGoalProgress(u1).toFixed(1), u2: calculateGoalProgress(u2).toFixed(1), format: v => `${v}%` },
        { name: 'Metas Concluídas', u1: u1.completedGoals.length, u2: u2.completedGoals.length, format: v => `${v}` }
    ];

    const comparisonHTML = `
        <div class="card shadow p-4">
            <h4 class="mb-4 text-center">⚔️ Comparação: ${u1.name.split(' ')[0]} vs ${u2.name.split(' ')[0]} (Nível ${u1.level})</h4>
            <div class="row text-center mb-3">
                <div class="col-4"><strong>${u1.name.split(' ')[0]}</strong></div>
                <div class="col-4"><strong>Métrica</strong></div>
                <div class="col-4"><strong>${u2.name.split(' ')[0]}</strong></div>
            </div>
            ${compareData.map(item => `
                <div class="row align-items-center py-2 border-bottom">
                    <div class="col-4 text-center fw-bold">${item.format(item.u1)}</div>
                    <div class="col-4 text-center small text-muted">${item.name}</div>
                    <div class="col-4 text-center fw-bold">${item.format(item.u2)}</div>
                </div>
            `).join('')}
        </div>
    `;

    comparisonEl.innerHTML = comparisonHTML;
    comparisonEl.style.display = 'block';
}

// 10. Timer Semanal (Simulação)
function startTimer() {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const endTime = Date.now() + oneWeek;

    function updateTimer() {
        const now = Date.now();
        const distance = endTime - now;

        if (distance < 0) {
            document.getElementById('timer').textContent = "Semana Encerrada!";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        document.getElementById('timer').textContent = `${days}d ${hours}h ${minutes}m`;
        setTimeout(updateTimer, 60000); 
    }
    updateTimer();
}

// =======================================================
// Início da Aplicação
// ======================================================= qualquwe coisa é só apagar
window.onload = function() {
    loadAndRender();
    startTimer();
};
document.getElementById("btnRanking").addEventListener("click", () => {
    
});
document.getElementById("btnRanking").addEventListener("click", function () {
    window.location.href = "ranking.html"; // página dedicada do ranking
});



// Exportar funções para o escopo global (para uso em onclick no HTML)
window.openInvestmentModal = openInvestmentModal;
window.closeInvestmentModal = closeInvestmentModal;
window.saveInvestment = saveInvestment;
window.deleteInvestment = deleteInvestment;
window.completeGoal = completeGoal;
window.openCustomGoalModal = openCustomGoalModal;
window.closeCustomGoalModal = closeCustomGoalModal;
window.saveCustomGoal = saveCustomGoal;
window.deleteCustomGoal = deleteCustomGoal;
window.toggleUserSelection = toggleUserSelection;
window.showComparison = showComparison;