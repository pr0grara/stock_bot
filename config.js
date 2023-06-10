const PROD = process.env.PRODUCTION === "true";
const PRODUCT_IDS = ['LTC-USD', 'DOGE-USD', 'BTC-USD',
    'ETH-USD', 'ADA-USD',
    'XTZ-USD', 'COMP-USD', 'ORCA-USD',
    'MANA-USD', 'DASH-USD', 'PERP-USD',
    'DOT-USD', 'KNC-USD', 'AVAX-USD',
    'SHIB-USD', 'XLM-USD', 'AAVE-USD',
    'ETC-USD', 'ZEC-USD', 'SYN-USD'];

module.exports = { PROD, PRODUCT_IDS };