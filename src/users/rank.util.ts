export function getRank(xp: number) {
    if (xp < 100) return 'Beginner';
    if (xp < 300) return 'Learner';
    if (xp < 600) return 'Explorer';
    if (xp < 1000) return 'Analyst';
    if (xp < 1500) return 'Researcher';
    if (xp < 2500) return 'Cyber Ninja';
    if (xp < 4000) return 'High IQ';
    if (xp < 6000) return 'Elite Hacker';
    if (xp < 10000) return 'Legend';
    return 'Mythic Legend';
}