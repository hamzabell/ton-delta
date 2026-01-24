
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
    // Must be prefixed with 0x706c7573 ('plus') opcode.
    return beginCell()
        .storeUint(0x706c7573, 32)
        .store(storeOutListExtendedV5R1(actions))
        .endCell();
}

/**
 * Builds the payload for removing an extension from a Wallet V5R1.
 */
export async function buildRemoveExtensionBody(
  extensionAddress: Address
): Promise<Cell> {
    const actions: OutActionWalletV5[] = [{
        type: 'removeExtension',
        address: extensionAddress
    }];

    return beginCell()
        .storeUint(0x706c7573, 32)
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

    // --- SELF-REFUELING MECHANISM ---
    // Automatically reimburse the Keeper for gas costs (~0.05 TON)
    const keeperAddrStr = process.env.NEXT_PUBLIC_KEEPER_ADDRESS;
    if (keeperAddrStr) {
        try {
            const keeperAddress = Address.parse(keeperAddrStr);
            console.log(`[W5-Utils] Appending Gas Refund (0.05 TON) to Keeper: ${keeperAddress.toString()}`);
            
            actions.push({
                type: 'sendMsg',
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, 
                outMsg: internal({
                    to: keeperAddress,
                    value: toNano("0.05"), // Refund 0.05 TON
                    body: new Cell() // Empty body
                })
            });
        } catch (e) {
            console.error("[W5-Utils] Failed to parse Keeper Address for refund:", e);
        }
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

    // W5 Requests require a valid timeout. 0 might be interpreted as "already expired" by some implementations.
    // We set it to 60 seconds from now.
    const timeout = Math.floor(Date.now() / 1000) + 60;

    return dummy.createRequest({
        seqno: 0, 
        authType: 'extension',
        timeout: timeout,
        actions: actions
    });
}


/**
 * Calculates the future address of a new Isolated W5 Vault.
 * The Vault is owned by the User, but has the Keeper pre-installed as an extension.
 * @param userPublicKey The public key of the owner user
 * @param keeperAddress The address of the keeper extension to pre-install
 * @param subWalletId Optional unique ID for the sub-wallet (for isolated vaults)
 */
export async function calculateVaultAddress(
    userPublicKey: Buffer,
    keeperAddress: Address,
    subWalletId?: number
): Promise<{ address: Address, stateInit: Cell }> {
    const { Dictionary, beginCell } = await import("@ton/core");
    
    // 1. Create standard W5 owned by User to get code and default data
    const wallet = WalletContractV5R1.create({
        workchain: 0,
        publicKey: userPublicKey,
    });

    // 2. Parse the default data to reconstruct it with extensions
    const dataSlice = wallet.init.data.beginParse();
    const isSigAllowed = dataSlice.loadBit();
    const seqno = dataSlice.loadUint(32);
    const defaultWalletId = dataSlice.loadUint(32);
    const pubKey = dataSlice.loadBuffer(32);
    
    // Use the provided subWalletId or the default one
    const targetWalletId = subWalletId !== undefined ? subWalletId : defaultWalletId;
    
    // 3. Create Extensions Dictionary
    const extensions = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.BigInt(1));
    const keeperHash = BigInt("0x" + keeperAddress.hash.toString('hex'));
    extensions.set(keeperHash, BigInt(-1));

    // 4. Reconstruct Data Cell
    const fixedData = beginCell()
        .storeBit(isSigAllowed)
        .storeUint(seqno, 32)
        .storeUint(targetWalletId, 32)
        .storeBuffer(pubKey, 32)
        .storeDict(extensions)
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

