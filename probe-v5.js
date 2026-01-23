
const { WalletContractV5 } = require('@ton/ton');
console.log('WalletContractV5 methods:', Object.getOwnPropertyNames(WalletContractV5.prototype));
if (WalletContractV5.createAddExtensionBody) console.log('Found createAddExtensionBody');
