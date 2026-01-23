
export const IS_TESTNET = process.env.IS_TESTNET === 'true' || process.env.NEXT_PUBLIC_IS_TESTNET === 'true';

export const NETWORK_CONFIG = {
  mainnet: {
    stormApi: 'https://api.storm.tg/api/v1',
    stonRouter: 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt', // V1 Router
    tonApi: process.env.TON_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC',
    tokens: {
        TON: 'TON',
        USDT: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixqV-P3p-31076',
        tsTON: 'EQC9KB1Z5v1t..._PLACEHOLDER_...' 
    }
  },
  testnet: {
    stormApi: process.env.STORM_API_URL || 'https://api-testnet.storm.trade/api/v1', // Fallback, requires user config
    stonRouter: process.env.STONFI_ROUTER_TESTNET || 'kQ...', // User must provide
    tonApi: 'https://testnet.toncenter.com/api/v2/jsonRPC',
     tokens: {
        TON: 'TON',
        USDT: 'kQ...', // Testnet USDT
        tsTON: 'kQ...'  // Testnet tsTON
    }
  }
};

export const CURRENT_NETWORK = IS_TESTNET ? NETWORK_CONFIG.testnet : NETWORK_CONFIG.mainnet;
