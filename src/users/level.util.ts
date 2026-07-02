// level.util.ts
export const LEVEL_CONFIG = [
    { level: 1, minXp: 0 },
    { level: 2, minXp: 100 },
    { level: 3, minXp: 250 },
    { level: 4, minXp: 500 },
    { level: 5, minXp: 1000 },
    { level: 6, minXp: 2000 },
    // Istagancha davom ettiring...
];

export function calculateLevel(xp: number) {
    // XP ga qarab darajani aniqlaydi
    const level = [...LEVEL_CONFIG].reverse().find(l => xp >= l.minXp);
    return level ? level.level : 1;
}

export function getLevelProgress(xp: number) {
    const currentLevel = calculateLevel(xp);
    const currentThreshold = LEVEL_CONFIG.find(l => l.level === currentLevel)?.minXp || 0;
    const nextThreshold = LEVEL_CONFIG.find(l => l.level === currentLevel + 1)?.minXp || Infinity;

    const currentXp = xp - currentThreshold;
    const neededXp = nextThreshold === Infinity ? 0 : nextThreshold - currentThreshold;

    return {
        currentLevel,
        currentXp,
        neededXp,
        percent: neededXp === 0 ? 100 : Math.round((currentXp / neededXp) * 100),
    };
}