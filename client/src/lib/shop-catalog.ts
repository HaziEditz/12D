import type { CSSProperties } from "react";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface ShopFrame {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  color: string;
  glowColor: string;
  desc: string;
}

export interface ShopTitle {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  desc: string;
}

export interface ShopPack {
  id: string;
  name: string;
  price: number;
  rarity: Rarity;
  emoji: string;
  desc: string;
  guarantee: string;
  possibleItems: string[];
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    "text-slate-400 border-slate-500/40 bg-slate-500/8",
  uncommon:  "text-green-400 border-green-500/40 bg-green-500/8",
  rare:      "text-blue-400 border-blue-500/40 bg-blue-500/8",
  epic:      "text-purple-400 border-purple-500/40 bg-purple-500/8",
  legendary: "text-yellow-400 border-yellow-500/40 bg-yellow-500/8",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common:    "",
  uncommon:  "shadow-green-500/20",
  rare:      "shadow-blue-500/25",
  epic:      "shadow-purple-500/30",
  legendary: "shadow-yellow-500/35",
};

export const FRAMES: ShopFrame[] = [
  { id: "frame-silver",      name: "Silver Frame",   price: 500,   rarity: "common",    color: "#94a3b8", glowColor: "transparent", desc: "A clean silver border" },
  { id: "frame-neon-blue",   name: "Neon Blue",      price: 1000,  rarity: "uncommon",  color: "#60a5fa", glowColor: "#60a5fa50",   desc: "Electric blue glow" },
  { id: "frame-purple-glow", name: "Purple Glow",    price: 1200,  rarity: "uncommon",  color: "#c084fc", glowColor: "#c084fc50",   desc: "Mystic purple aura" },
  { id: "frame-gold",        name: "Gold Frame",     price: 1500,  rarity: "rare",      color: "#fbbf24", glowColor: "#fbbf2450",   desc: "Gleaming gold border" },
  { id: "frame-emerald",     name: "Emerald",        price: 2000,  rarity: "rare",      color: "#34d399", glowColor: "#34d39950",   desc: "Rich emerald glow" },
  { id: "frame-rose-gold",   name: "Rose Gold",      price: 2500,  rarity: "rare",      color: "#fda4af", glowColor: "#fda4af50",   desc: "Elegant rose gold" },
  { id: "frame-fire",        name: "Fire Ring",      price: 3500,  rarity: "epic",      color: "#f97316", glowColor: "#f9731660",   desc: "Blazing fire effect" },
  { id: "frame-diamond",     name: "Diamond",        price: 5000,  rarity: "epic",      color: "#a5f3fc", glowColor: "#a5f3fc60",   desc: "Crystal clear border" },
  { id: "frame-rainbow",     name: "Rainbow",        price: 10000, rarity: "legendary", color: "rainbow", glowColor: "#fbbf2440",   desc: "All the colours, all at once" },
  { id: "frame-void",        name: "Void",           price: 15000, rarity: "legendary", color: "#1e1b4b", glowColor: "#7c3aed60",   desc: "Darkness that glows" },
];

export const TITLES: ShopTitle[] = [
  { id: "title-bull",          name: "🐂 Bull Market",    price: 300,   rarity: "common",    desc: "Always bullish" },
  { id: "title-day-trader",    name: "📈 Day Trader",     price: 400,   rarity: "common",    desc: "In and out" },
  { id: "title-risk-taker",    name: "⚡ Risk Taker",     price: 350,   rarity: "common",    desc: "High risk, high reward" },
  { id: "title-bear-slayer",   name: "🐻 Bear Slayer",    price: 500,   rarity: "uncommon",  desc: "Profits in downturns" },
  { id: "title-chart-wizard",  name: "🧙 Chart Wizard",   price: 600,   rarity: "uncommon",  desc: "Reads charts like a book" },
  { id: "title-profit-hunter", name: "🎯 Profit Hunter",  price: 700,   rarity: "uncommon",  desc: "Always finding the edge" },
  { id: "title-diamond-hands", name: "💎 Diamond Hands",  price: 800,   rarity: "rare",      desc: "Never sells at a loss" },
  { id: "title-the-analyst",   name: "📊 The Analyst",    price: 1000,  rarity: "rare",      desc: "Backed by data" },
  { id: "title-market-guru",   name: "🔮 Market Guru",    price: 1500,  rarity: "rare",      desc: "Future sight" },
  { id: "title-hedge-fund",    name: "🏦 Hedge Fund",     price: 2000,  rarity: "epic",      desc: "Institutional grade" },
  { id: "title-wolf",          name: "🐺 Wolf of Wall St",price: 3000,  rarity: "epic",      desc: "Feared on the market" },
  { id: "title-whale",         name: "🐋 Whale",          price: 5000,  rarity: "legendary", desc: "Moves markets" },
  { id: "title-legend",        name: "👑 Legend",         price: 8000,  rarity: "legendary", desc: "Truly untouchable" },
];

export const PACKS: ShopPack[] = [
  {
    id: "pack-starter",
    name: "Starter Pack",
    price: 600,
    rarity: "common",
    emoji: "📦",
    desc: "A mix of common & uncommon cosmetics. Great for new traders.",
    guarantee: "1–2 common or uncommon items",
    possibleItems: ["frame-silver", "title-bull", "title-day-trader", "title-risk-taker"],
  },
  {
    id: "pack-pro",
    name: "Pro Pack",
    price: 2500,
    rarity: "rare",
    emoji: "💼",
    desc: "Guaranteed rare item plus a bonus. For serious traders.",
    guarantee: "1 rare item + 1 common/uncommon bonus",
    possibleItems: ["frame-gold", "frame-emerald", "frame-rose-gold", "title-diamond-hands", "title-the-analyst", "title-market-guru"],
  },
  {
    id: "pack-legend",
    name: "Legend Pack",
    price: 9000,
    rarity: "legendary",
    emoji: "💫",
    desc: "Guaranteed epic or legendary cosmetic. Only for the elite.",
    guarantee: "1 epic or legendary item guaranteed",
    possibleItems: ["frame-fire", "frame-diamond", "frame-rainbow", "frame-void", "title-wolf", "title-whale", "title-legend"],
  },
];

// Returns inline style for a frame ring on an avatar
export function getFrameStyle(frameId: string | null | undefined): CSSProperties {
  if (!frameId) return {};
  const frame = FRAMES.find(f => f.id === frameId);
  if (!frame) return {};
  if (frame.color === "rainbow") {
    return {
      outline: "2.5px solid transparent",
      outlineOffset: "2px",
      background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #f97316, #ec4899, #8b5cf6, #3b82f6, #10b981) border-box",
      borderRadius: "9999px",
      boxShadow: "0 0 12px 2px #fbbf2440",
    };
  }
  return {
    outline: `2.5px solid ${frame.color}`,
    outlineOffset: "2px",
    boxShadow: frame.glowColor !== "transparent" ? `0 0 10px 2px ${frame.glowColor}` : undefined,
    borderRadius: "9999px",
  };
}
