const { ethers } = require("ethers");

const RPC_URL = "https://rpc.ankr.com/electroneum";
const CHAIN_ID = 52014;
const WALLET = "0x210D9A9b9173E0691ac89D32B4EB9600464FeDEB";
const TOKENS = [
  { symbol: "USDT", address: "0x48E722f1458b253c2FB0E573F939318D7Dbd54e7", decimals: 6 },
  { symbol: "USDC", address: "0x3187deAd7A2Bd6770F5Fe81495D1B715926AAe6e", decimals: 6 },
];
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const recipientTopic = ethers.zeroPadValue(WALLET, 32).toLowerCase();
const FROM_BLOCK = Number(process.env.FROM_BLOCK ?? "16700000");
const TO_BLOCK = Number(process.env.TO_BLOCK ?? "16777498");
const CHUNK_SIZE = 1000;

function assertRange() {
  if (!Number.isSafeInteger(FROM_BLOCK) || !Number.isSafeInteger(TO_BLOCK) ||
      FROM_BLOCK < 0 || TO_BLOCK < FROM_BLOCK) {
    throw new Error("Invalid FROM_BLOCK / TO_BLOCK range");
  }
}

async function withRetry(fn, label) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try { return await fn(); }
    catch (error) {
      lastError = error;
      if (attempt < 5) {
        const delay = Math.min(1000 * (2 ** (attempt - 1)), 10000);
        console.error(`Retry ${attempt}/5 for ${label}: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function main() {
  assertRange();
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true });
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) throw new Error("RPC chain ID mismatch");

  const found = [];
  const receiptCache = new Map();
  let queriedRanges = 0;

  for (let start = FROM_BLOCK; start <= TO_BLOCK; start += CHUNK_SIZE) {
    const end = Math.min(TO_BLOCK, start + CHUNK_SIZE - 1);
    for (const token of TOKENS) {
      const logs = await withRetry(() => provider.getLogs({
        address: token.address,
        fromBlock: start,
        toBlock: end,
        topics: [TRANSFER_TOPIC, null, recipientTopic],
      }), `${token.symbol} logs ${start}-${end}`);
      for (const log of logs) {
        if (log.topics[2]?.toLowerCase() !== recipientTopic) continue;
        const sender = "0x" + log.topics[1].slice(26);
        const parsed = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], log.data);
        const amountRaw = parsed[0];
        if (amountRaw === 0n) continue;
        let receipt = receiptCache.get(log.transactionHash);
        if (!receipt) {
          receipt = await withRetry(() => provider.getTransactionReceipt(log.transactionHash),
            `receipt ${log.transactionHash}`);
          receiptCache.set(log.transactionHash, receipt);
        }
        if (!receipt || Number(receipt.status) !== 1) continue;
        found.push({
          token: token.symbol,
          amount: ethers.formatUnits(amountRaw, token.decimals),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          logIndex: log.index,
          from: ethers.getAddress(sender),
          transferType: sender.toLowerCase() === ethers.ZeroAddress.toLowerCase() ? "mint" : "transfer",
          to: WALLET,
          explorer: `https://blockexplorer.electroneum.com/tx/${log.transactionHash}`,
        });
      }
    }
    queriedRanges++;
    console.error(`Scanned blocks ${start}-${end}; confirmed deposits so far: ${found.length}`);
  }

  found.sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
  const totals = Object.fromEntries(TOKENS.map(token => [
    token.symbol,
    found.filter(item => item.token === token.symbol)
      .reduce((sum, item) => sum + Number(item.amount), 0),
  ]));
  console.log(JSON.stringify({
    mode: "READ_ONLY_HISTORICAL_REPLAY",
    sideEffects: { supabaseWrites: false, telegramMessages: false, liveCheckpointChanged: false },
    chainId: CHAIN_ID,
    wallet: WALLET,
    fromBlock: FROM_BLOCK,
    toBlock: TO_BLOCK,
    queriedRanges,
    confirmedCreditCount: found.length,
    mintCreditCount: found.filter(item => item.transferType === "mint").length,
    ordinaryTransferCount: found.filter(item => item.transferType === "transfer").length,
    totals,
    transfers: found,
  }, null, 2));
  await provider.destroy();
}

main().catch(error => {
  console.error("Historical replay failed:", error);
  process.exitCode = 1;
});
