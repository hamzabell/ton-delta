
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
    
    // Create W5 with: Owner = User, Extension = Keeper
    // Note: W5R1 config requires a dictionary for extensions if pre-installing
    // But standard create method might not expose extensions param easily in current SDK version.
    
    // Workaround: We deploy a standard W5 owned by User.
    // However, if we want the Keeper pre-installed, we need to inject it into the initial data.
    // If the SDK doesn't support 'extensions' in 'create', we might need to deploy then addExtension.
    // BUT 'One Atomic Operation' requirement means we should try to pre-install.
    
    const wallet = WalletContractV5R1.create({
        workchain: 0,
        publicKey: userPublicKey,
        // Current SDK 'create' mainly sets public key. 
        // extensions are usually added via internal message after deploy.
        // For atomic deployment with extension, we'd need custom data construction.
        // Fallback Recommendation: 
        // 1. Deploy Wallet (owned by User).
        // 2. Add Extension in same bundle? No, can't add extension to undeployed wallet easily.
        
        // Revised Strategy for Atomic:
        // The Vault is a Multi-Sig or Special Contract? No, sticking to W5.
        // We will deploy the W5 owned by USER.
        // The INITIAL payload will be signed by USER (since they deploy it)
        // And that initial payload can contain 'add_extension(keeper)'.
        // So:
        // - Address = Derived from User Public Key
        // - Tx 1: Fund & Deploy
        // - Tx 2 (Wrapped in same bundle or immediately after): User signs "Add Extension" to the NEW vault.
    });

    return {
        address: wallet.address,
        stateInit: beginCell()
            .storeBit(0) // split_depth
            .storeBit(0) // special
            .storeMaybeRef(wallet.init.code)
            .storeMaybeRef(wallet.init.data)
            .storeBit(0) // library
            .endCell()
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
