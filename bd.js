// bd.js
// Simulação de um banco de dados/API externa usando localStorage.

const STORAGE_KEY = 'financeQuestDB';

/**
 * Funções auxiliares para simular operações do Banco de Dados
 * Os dados são armazenados como um array de usuários no localStorage.
 */

// Simula a obtenção de todos os dados (equivalente a uma collection query)
export function getAllUsersData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Simula a obtenção de dados de um único usuário
export function getUserData(userId) {
    const allUsers = getAllUsersData();
    return allUsers.find(user => user.id === userId);
}

// Simula a escrita de dados para um usuário específico (criação ou atualização)
export function saveUserData(userData) {
    let allUsers = getAllUsersData();
    const existingIndex = allUsers.findIndex(u => u.id === userData.id);

    if (existingIndex !== -1) {
        // Atualiza o usuário existente
        allUsers[existingIndex] = { ...allUsers[existingIndex], ...userData };
    } else {
        // Adiciona um novo usuário
        allUsers.push(userData);
    }
    
    // Simula o salvamento
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
    return allUsers; // Retorna o array completo para o renderizador
}

// Simula a exclusão de um usuário (não é usado na aplicação, mas útil)
export function deleteUser(userId) {
    let allUsers = getAllUsersData();
    allUsers = allUsers.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
    return allUsers;
}

// Gera um ID de usuário persistente simulado para a sessão
export function getCurrentMockUserId() {
    let userId = localStorage.getItem('mockUserId');
    if (!userId) {
        // Usa um UUID simples (mock) para simular o ID do Firebase
        userId = 'user-' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('mockUserId', userId);
    }
    return userId;
}

// Metas Padrão (exportadas para serem usadas na inicialização do usuário)
export const DEFAULT_WEEKLY_GOALS = [
    { id: 'goal-1', title: "Economize R$ 200 esta semana", xp: 150, icon: "💵", isCustom: false },
    { id: 'goal-2', title: "Faça 5 refeições em casa", xp: 100, icon: "🍽️", isCustom: false },
    { id: 'goal-3', title: "Registre despesas por 7 dias", xp: 200, icon: "✏️", isCustom: false },
    { id: 'goal-4', title: "Invista pelo menos R$ 100", xp: 250, icon: "📈", isCustom: false },
    { id: 'goal-5', title: "Evite compras por impulso", xp: 120, icon: "🚫", isCustom: false }
];