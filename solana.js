// solana.js
const { Connection, PublicKey } = require('@solana/web3.js');
const { TOKENS } = require('./config');

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=87f73015-922d-4549-8eea-3253f7635385', 'confirmed');

async function getBalances(address) {
  try {
    const publicKey = new PublicKey(address);
    const balanceLamports = await connection.getBalance(publicKey);
    const balanceSOL = balanceLamports / 1e9;

    let balances = `Balance of ${address}:\nSOL: ${balanceSOL} SOL\n`;

    for (const token of TOKENS) {
      if (token.name !== 'SOL') {
        const tokenBalance = await getTokenBalance(publicKey, token.mint);
        balances += `${token.name}: ${tokenBalance} ${token.name}\n`;
      }
    }

    return balances;
  } catch (error) {
    throw new Error('Invalid public key input');
  }
}

async function getTokenBalance(publicKey, mintAddress) {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: new PublicKey(mintAddress) });
  if (tokenAccounts.value.length === 0) {
    return 0;
  }
  return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
}

module.exports = { getBalances };