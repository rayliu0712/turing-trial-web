/**
 * 玩家專屬識別色彩設定
 * 用於在黑白為主的 shadcn/ui 極簡風格中突顯每位玩家
 */

export interface PlayerColorTheme {
  id: string;
  name: string;
  badge: string;      // 標籤樣式 (背景、文字、邊框)
  avatar: string;     // 頭像背景色
  text: string;       // 文字主色
  border: string;     // 邊框主色
  dot: string;        // 狀態圓點色
}

export const PLAYER_COLOR_PALETTES: PlayerColorTheme[] = [
  {
    id: 'emerald',
    name: '翡翠綠',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatar: 'bg-emerald-600 text-white',
    text: 'text-emerald-700',
    border: 'border-emerald-500',
    dot: 'bg-emerald-500',
  },
  {
    id: 'blue',
    name: '寶石藍',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    avatar: 'bg-blue-600 text-white',
    text: 'text-blue-700',
    border: 'border-blue-500',
    dot: 'bg-blue-500',
  },
  {
    id: 'amber',
    name: '琥珀橘',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    avatar: 'bg-amber-600 text-white',
    text: 'text-amber-700',
    border: 'border-amber-500',
    dot: 'bg-amber-500',
  },
  {
    id: 'rose',
    name: '玫瑰紅',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    avatar: 'bg-rose-600 text-white',
    text: 'text-rose-700',
    border: 'border-rose-500',
    dot: 'bg-rose-500',
  },
  {
    id: 'violet',
    name: '薰衣紫',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    avatar: 'bg-violet-600 text-white',
    text: 'text-violet-700',
    border: 'border-violet-500',
    dot: 'bg-violet-500',
  },
  {
    id: 'cyan',
    name: '青天藍',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    avatar: 'bg-cyan-600 text-white',
    text: 'text-cyan-700',
    border: 'border-cyan-500',
    dot: 'bg-cyan-500',
  },
  {
    id: 'fuchsia',
    name: '洋紅粉',
    badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    avatar: 'bg-fuchsia-600 text-white',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-500',
    dot: 'bg-fuchsia-500',
  },
  {
    id: 'teal',
    name: '松石綠',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    avatar: 'bg-teal-600 text-white',
    text: 'text-teal-700',
    border: 'border-teal-500',
    dot: 'bg-teal-500',
  },
];

export function getPlayerColor(index: number): PlayerColorTheme {
  return PLAYER_COLOR_PALETTES[index % PLAYER_COLOR_PALETTES.length];
}

