
import axios from 'axios';

const vaultAddress = 'EQDpJnZP89Jyxz3euDaXXFUhwCWtaOeRmiUJTi3jGYgF8fnj'; // Mainnet Vault
const url = `https://api5.storm.tg/lite/api/v0/vault/${vaultAddress}/markets`;

async function main() {
  try {
    const res = await axios.get(url);
    const data = res.data;
    console.log('Is Array?', Array.isArray(data));
    if (Array.isArray(data) && data.length > 0) {
      console.log('First item keys:', Object.keys(data[0]));
      // Find a meme coin if possible
      const meme = data.find((d: any) => ['DOGS', 'REDO', 'FISH'].includes(d.name));
      if (meme) {
          console.log('Meme name:', meme.name); 
          console.log('market_address:', meme.market_address);
          console.log('base_asset_wallet_address:', meme.base_asset_wallet_address);
          console.log('quote_asset_wallet_address:', meme.quote_asset_wallet_address);
          // Check if there are other address fields
          console.log('Full meme obj keys:', Object.keys(meme));
      } else {
        console.log('First item sample:', JSON.stringify(data[0], null, 2));
      }
    } else {
        console.log('Data:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
