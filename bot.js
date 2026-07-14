const { ethers } = require("ethers");
const TelegramBot = require("node-telegram-bot-api").TelegramBot;
const http = require("http");

const RPC = "https://rpc.ankr.com/electroneum";
const POOL = "0x86566c3c78424e3c3c2aDb274FAB551B7262E0ca";
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const poolAbi = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"
];

const provider = new ethers.JsonRpcProvider(RPC, { chainId: 52014, name: "electroneum" });
const pool = new ethers.Contract(POOL, poolAbi, provider);
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

let lastBlock = null;
let etnPriceUsd = 0;

async function updatePrice() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=electroneum&vs_currencies=usd");
    const data = await res.json();
    etnPriceUsd = data.electroneum.usd;
    console.log("ETN price updated:", etnPriceUsd);
  } catch (err) {
    console.error("Price fetch failed:", err.message);
  }
}

async function checkSwaps() {
  try {
    const currentBlock = await provider.getBlockNumber();
    if (lastBlock === null) {
      lastBlock = currentBlock;
      console.log("Starting from block", currentBlock);
      return;
    }
    if (currentBlock <= lastBlock) return;

    const events = await pool.queryFilter("Swap", lastBlock + 1, currentBlock);

    for (const event of events) {
      const { amount0, amount1 } = event.args;
      const wetnAmount = Number(ethers.formatUnits(amount0 < 0n ? -amount0 : amount0, 18));
      const clubAmount = Number(ethers.formatUnits(amount1 < 0n ? -amount1 : amount1, 18));
      const price = wetnAmount / clubAmount;
      const usdValue = wetnAmount * etnPriceUsd;

      const isBuy = amount1 < 0n;
      const label = isBuy ? "CLUB BUY" : "CLUB SELL";
      const emojiBar = (isBuy ? "🟢" : "🔴").repeat(10);
      const txLink = "https://blockexplorer.electroneum.com/tx/" + event.transactionHash;

      const message = emojiBar + "\n*" + label + "* ($" + usdValue.toFixed(2) + ")\n\n" +
        "💰 " + (isBuy ? "Paid" : "Received") + ": " + wetnAmount.toFixed(4) + " WETN\n" +
        "🔢 Amount: " + clubAmount.toFixed(6) + " CLUB\n" +
        "💵 CLUB Price: " + price.toFixed(6) + " WETN\n" +
        "🔗 [View Transaction](" + txLink + ")";

      await bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" });
      console.log("Posted:", label, event.transactionHash);
    }

    lastBlock = currentBlock;
  } catch (err) {
    console.error("Error checking swaps:", err.message);
  }
}

console.log("Watching CLUB/WETN pool (polling every 10s)...");
updatePrice();
setInterval(updatePrice, 60000);
checkSwaps();
setInterval(checkSwaps, 10000);

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is running");
}).listen(PORT, () => console.log("Health check server on port", PORT));
