export const API_CONFIG = {
  stormTrade: {
    baseUrl: 'https://api.storm.trade/api/v1',
    rpcUrl: 'https://toncenter.com/api/v2/jsonRPC',
  },
  swapCoffee: {
    baseUrl: 'https://api.swap.coffee/api/v1',
  },
  ton: {
    rpcUrl: process.env.TON_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC',
  },
  dedust: {
    // DeDust public API - mainnet only
    poolsUrl: 'https://api.dedust.io/v2/pools',
  }
};

export const MEME_PAIRS = [
  {
    id: "dogs-ton",
    name: "DOGS / TON",
    apr: 242.3,
    risk: "High",
    category: "Meme",
    icon: "🐶",
    spotToken: "DOGS",
    baseToken: "TON"
  },
  {
    id: "not-ton",
    name: "NOT / TON",
    apr: 185.8,
    risk: "Medium",
    category: "GameFi",
    icon: "⬛",
    spotToken: "NOT",
    baseToken: "TON"
  },
  {
    id: "redo-ton",
    name: "REDO / TON",
    apr: 285.0,
    risk: "High",
    category: "Meme",
    icon: "🐸",
    spotToken: "REDO",
    baseToken: "TON"
  },
  {
    id: "hmstr-ton",
    name: "HMSTR / TON",
    apr: 320.5,
    risk: "High",
    category: "GameFi",
    icon: "🐹",
    spotToken: "HMSTR",
    baseToken: "TON"
  },
  {
    id: "cati-ton",
    name: "CATI / TON",
    apr: 156.2,
    risk: "Medium",
    category: "GameFi",
    icon: "😺",
    spotToken: "CATI",
    baseToken: "TON"
  },
  {
    id: "ston-ton",
    name: "STON / TON",
    apr: 89.4,
    risk: "Low",
    category: "DeFi",
    icon: "💎",
    spotToken: "STON",
    baseToken: "TON"
  },
  {
    id: "gram-ton",
    name: "GRAM / TON",
    apr: 112.1,
    risk: "Medium",
    category: "Meme",
    icon: "⚖️",
    spotToken: "GRAM",
    baseToken: "TON"
  },
  {
    id: "fish-ton",
    name: "FISH / TON",
    apr: 210.8,
    risk: "High",
    category: "Meme",
    icon: "🐟",
    spotToken: "FISH",
    baseToken: "TON"
  },
  {
    id: "bolt-ton",
    name: "BOLT / TON",
    apr: 195.0,
    risk: "High",
    category: "Meme",
    icon: "⚡",
    spotToken: "BOLT",
    baseToken: "TON"
  },
  {
    id: "punk-ton",
    name: "PUNK / TON",
    apr: 275.5,
    risk: "High",
    category: "NFT",
    icon: "🎸",
    spotToken: "PUNK",
    baseToken: "TON"
  }
];
