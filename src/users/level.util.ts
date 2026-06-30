export function calculateLevel(xp: number) {
    return Math.floor(xp / 100) + 1;
}

export function getLevelProgress(xp: number) {
    const level = calculateLevel(xp);

    const currentLevelXp =
        (level - 1) * 100;

    const nextLevelXp =
        level * 100;

    const currentXp =
        xp - currentLevelXp;

    const neededXp =
        nextLevelXp - currentLevelXp;

    return {
        currentLevel: level,

        currentXp,

        neededXp,

        remainingXp:
            nextLevelXp - xp,

        percent: Math.round(
            (currentXp / neededXp) * 100,
        ),
    };
}