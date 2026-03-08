export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpToNext: number;
  progress: number;
}

export function getLevelInfo(xp: number | null | undefined): LevelInfo {
  const currentXp = xp ?? 0;
  const level = Math.min(Math.floor(currentXp / 100) + 1, 100);
  
  let title = "Beginner";
  if (level >= 76) title = "Legend";
  else if (level >= 51) title = "Master";
  else if (level >= 31) title = "Expert";
  else if (level >= 16) title = "Trader";
  else if (level >= 6) title = "Apprentice";

  const xpInCurrentLevel = currentXp % 100;
  const xpToNext = 100 - xpInCurrentLevel;
  const progress = xpInCurrentLevel; // Since each level is 100 XP

  return {
    level,
    title,
    currentXp,
    xpToNext,
    progress,
  };
}
