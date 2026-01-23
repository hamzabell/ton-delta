
const { mnemonicNew, mnemonicToPrivateKey } = require("ton-crypto");
const { WalletContractV4 } = require("@ton/ton");

async function main() {
    // Generate new mnemonic
    const mnemonics = await mnemonicNew();
    const key = await mnemonicToPrivateKey(mnemonics);

    // Create wallet instance to get address
    const wallet = WalletContractV4.create({ 
        workchain: 0, 
        publicKey: key.publicKey 
    });

    console.log("MNEMONIC::" + mnemonics.join(" "));
    console.log("ADDRESS::" + wallet.address.toString({ testOnly: false }));
}

main();
