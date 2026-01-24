
import { Address, beginCell, Cell, SendMode, toNano, Sender, internal } from "@ton/core";
import { WalletContractV5R1 } from "@ton/ton/dist/wallets/v5r1/WalletContractV5R1";
import { OutActionWalletV5 } from "@ton/ton/dist/wallets/v5beta/WalletV5OutActions";
import { storeOutListExtendedV5R1 } from "@ton/ton/dist/wallets/v5r1/WalletV5R1Actions";
import { Buffer } from "buffer";

/**
 * Builds the payload for adding an extension to a Wallet V5R1.
 * The User signs this and sends to Self.
 * 
 * We manually pack the actions because SDK's createAddExtension demands a signer.
 * When sending to Self, V5 executes the actions in the body.
 */
export async function buildAddExtensionBody(
  userAddress: Address, 
  extensionAddress: Address
): Promise<Cell> {
    const actions: OutActionWalletV5[] = [{
        type: 'addExtension',
        address: extensionAddress
    }];

    // V5R1: Internal messages from "Self" execute actions packed in body.
    // Use storeOutListExtendedV5R1 to pack them.
    return beginCell()
        .store(storeOutListExtendedV5R1(actions))
        .endCell();
}

/**
 * Helper to wrap standard messages into a W5 Keeper Request
 */
export async function wrapWithKeeperRequest(
  userAddress: Address,
  messages: { to: Address, value: bigint, body?: Cell, mode?: number }[],
  removeExtensionAddr?: Address
): Promise<Cell> {
    const actions: OutActionWalletV5[] = messages.map(msg => ({
        type: 'sendMsg',
        mode: msg.mode !== undefined ? msg.mode : (SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS),
        outMsg: internal({
            to: msg.to,
            value: msg.value,
            body: msg.body || new Cell()
        })
    }));

    if (removeExtensionAddr) {
        actions.push({
            type: 'removeExtension',
            address: removeExtensionAddr
        });
    }

    return buildKeeperRequest(userAddress, actions);
}

/**
 * Builds the request message that the Keeper (Extension) sends to the User Wallet.
 * This prompts the User Wallet to execute the 'actions' (e.g. swap).
 */
export async function buildKeeperRequest(
  userAddress: Address, 
  actions: OutActionWalletV5[] 
): Promise<Cell> {
    const dummy = WalletContractV5R1.create({
        workchain: 0,
        publicKey: Buffer.alloc(32)
    });

    return dummy.createRequest({
        seqno: 0, 
        authType: 'extension',
        timeout: 0,
        actions: actions
    });
}


/**
 * Calculates the future address of a new Isolated W5 Vault.
 * The Vault is owned by the User, but has the Keeper pre-installed as an extension.
 */
export async function calculateVaultAddress(
    userPublicKey: Buffer,
    keeperAddress: Address
): Promise<{ address: Address, stateInit: Cell }> {
    const { Dictionary, beginCell } = await import("@ton/core");
    
    // 1. Create standard W5 owned by User to get code and default data
    const wallet = WalletContractV5R1.create({
        workchain: 0,
        publicKey: userPublicKey,
    });

    // 2. Parse the default data to reconstruct it with extensions
    // Default Data Layout: isSigAllowed (1) | seqno (32) | walletId (32) | publicKey (256) | extensions (Dict)
    const dataSlice = wallet.init.data.beginParse();
    const isSigAllowed = dataSlice.loadBit();
    const seqno = dataSlice.loadUint(32);
    const walletId = dataSlice.loadUint(32);
    const pubKey = dataSlice.loadBuffer(32);
    // dataSlice.loadBit() // Skip empty dict bit (0) which is what normal create() produces
    
    // 3. Create Extensions Dictionary
    // Key: Address Hash (256), Value: Int(1) (implied checks usually just check existence)
    const extensions = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.BigInt(1));
    
    // Add Keeper Address. The value 1n commonly denotes "enabled".
    // Important: W5 spec usually maps hash -> wc (int8). 
    // However, @ton/ton implementation uses BigInt(1) for value serialization in getExtensionsArray.
    // We will stick to -1n (True in 1-bit signed).
    const keeperHash = BigInt("0x" + keeperAddress.hash.toString('hex'));
    extensions.set(keeperHash, -1n);

    // 4. Reconstruct Data Cell
    const fixedData = beginCell()
        .storeBit(isSigAllowed)
        .storeUint(seqno, 32)
        .storeUint(walletId, 32)
        .storeBuffer(pubKey, 32)
        .storeDict(extensions) // Store our non-empty dictionary
        .endCell();

    // 5. Calculate Address
    const stateInit = beginCell()
        .storeBit(0) // split_depth
        .storeBit(0) // special
        .storeMaybeRef(wallet.init.code)
        .storeMaybeRef(fixedData)
        .storeBit(0) // library
        .endCell();

    const { contractAddress } = await import("@ton/core");
    const address = contractAddress(0, { code: wallet.init.code, data: fixedData });

    return {
        address,
        stateInit
    };
}

/**
 * Checks if a contract is deployed and active on-chain.
 */
export async function checkContractDeployed(address: string): Promise<boolean> {
    try {
        const { getHttpEndpoint } = await import('@orbs-network/ton-access');
        const { TonClient } = await import('@ton/ton');
        
        const endpoint = await getHttpEndpoint();
        const client = new TonClient({ endpoint });
        
        const state = await client.getContractState(Address.parse(address));
        return state.state === 'active';
    } catch (e) {
        console.warn('Failed to check contract state:', e);
        return false;
    }
}

