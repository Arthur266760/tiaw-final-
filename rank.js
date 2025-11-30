// ARQUIVO: bd.js
// DESCRIÇÃO: Banco de dados dos usuários e metas
const DATABASE = {
    users: [
        {
            id: 1,
            name: "Ana Paula Silva",
            avatar: "A",
            moneySaved: 15750.00,
            xp: 8750,
            level: 12,
            xpToNextLevel: 9000,
            achievements: ["Expert", "level >= 4", "🗓️ 30 dias"],
            weeklyGoalsCompleted: 48,
            savingStreak: 30,
            investments: 8500.00,
            completedGoals: []
        },
        {
            id: 2,
            name: "Carlos Eduardo Lima",
            avatar: "C",
            moneySaved: 12340.00,
            xp: 7200,
            level: 10,
            xpToNextLevel: 7500,
            achievements: ["level >= 1", "💪 Disciplinado"],
            weeklyGoalsCompleted: 38,
            savingStreak: 15,
            investments: 5200.00,
            completedGoals: []
        },
        {
            id: 3,
            name: "Beatriz Santos",
            avatar: "B",
            moneySaved: 11580.00,
            xp: 6890,
            level: 9,
            xpToNextLevel: 7000,
            achievements: ["level >= 8 ", "📝 Planejador"],
            weeklyGoalsCompleted: 34,
            savingStreak: 22,
            investments: 4100.00,
            completedGoals: []
        },
        {
            id: 4,
            name: "Diego Oliveira Costa",
            avatar: "D",
            moneySaved: 9240.00,
            xp: 5420,
            level: 8,
            xpToNextLevel: 6000,
            achievements: ["level >= 11"],
            weeklyGoalsCompleted: 27,
            savingStreak: 8,
            investments: 3000.00,
            completedGoals: []
        },
       
    ],
    weeklyGoals: [
        { id: 1, title: "Economize R$ 200 esta semana", xp: 150, icon: "💵" },
        { id: 2, title: "Faça 5 refeições em casa", xp: 100, icon: "🍽️" },
        { id: 3, title: "Registre despesas por 7 dias", xp: 200, icon: "✍️" },
        { id: 4, title: "Invista pelo menos R$ 100", xp: 250, icon: "📈" },
        { id: 5, title: "Evite compras por impulso", xp: 120, icon: "🚫" }
    ]
};