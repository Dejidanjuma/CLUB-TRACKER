const { ethers } = require("ethers");
const TelegramBot = require("node-telegram-bot-api").TelegramBot;
const http = require("http");

const RPC = "https://rpc.ankr.com/electroneum";
const WETN = "0x138DAFbDA0CCB3d8E39C19edb0510Fc31b7C1c77";
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/club_buy.mp4";

const provider = new ethers.JsonRpcProvider(RPC, { chainId: 52014, name: "electroneum" });
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

process.on("unhandledRejection", (reason) => console.error("UNHANDLED:", reason));
process.on("uncaughtException", (err) => console.error("UNCAUGHT:", err));

const tokens = [ /* your tokens array here - same as before */ ];

const v2Abi = ["event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"];
const v3Abi = ["event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"];
const erc20Abi = ["function decimals() view returns (uint8)"];

let etnPriceUsd = 0.0008;
let lastBlock = null;
const tokenDecimals = {};
const seenTx = new Set();

function fmt(num, decimals) {
  return num.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

async function loadDecimals() {
  for (const t of tokens) {
    try {
      const c = new ethers.Contract(t.address, erc20Abi, provider);
      tokenDecimals[t.symbol] = await c.decimals();
    } catch (e) { tokenDecimals[t.symbol] = 18; }
  }
}

async function updatePrice() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=electroneum&vs_currencies=usd");
    if (res.ok) {
      const data = await res.json();
      if (data.electroneum?.usd) etnPriceUsd = data.electroneum.usd;
    }
  } catch (e) {}
}

async function getTraderWallet(txHash) {
  try {
    const tx = await provider.getTransaction(txHash);
    return tx.from;
  } catch (e) { return null; }
}

function formatMessage(t, isBuy, wetnAmount, tokenAmount, txHash, wallet) {
  const usdValue = wetnAmount * etnPriceUsd;
  const usdPricePerToken = tokenAmount > 0 ? usdValue / tokenAmount : 0;
  const circles = (isBuy ? "🟢" : "🔴").repeat(10);
  const label = isBuy ? "BUY" : "SELL";
  const roleLabel = isBuy ? "Buyer" : "Seller";

  const txLink = "https://blockexplorer.electroneum.com/tx/" + txHash;
  const walletLink = "https://blockexplorer.electroneum.com/address/" + wallet;
  const walletShort = wallet.slice(0, 6) + "..." + wallet.slice(-4);

  const buyLink = `https://app.electroswap.io/swap?inputCurrency=${WETN}&outputCurrency=${t.address}`;
  const liveTxsLink = "https://blockexplorer.electroneum.com/address/" + t.pool;

  let msg = circles + "\n*" + t.symbol + " " + label + "* ($" + fmt(usdValue, 2) + ")\n\n" +
    "💰 *" + (isBuy ? "Paid" : "Received") + ":* " + fmt(wetnAmount, 4) + " WETN\n" +
    "🔢 *Amount:* " + fmt(tokenAmount, 6) + " " + t.symbol + "\n" +
    "💵 *" + t.symbol + " Price:* $" + fmt(usdPricePerToken, 6) + "\n" +
    "👤 *" + roleLabel + ":* [" + walletShort + "](" + walletLink + ")\n" +
    "🔗 [View Transaction](" + txLink + ")\n\n" +
    "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "💵 [Buy " + t.symbol + "](" + buyLink + ") | ⚡ [Live Txs](" + liveTxsLink + ")";

  if (t.website) msg += "\n🌎 [" + t.websiteLabel + "](" + t.website + ")";
  return msg;
}

async function sendTradeMessage(message, isBuy, symbol) {
  const opts = { parse_mode: "Markdown", disable_web_page_preview: true };
  try {
    if (isBuy && symbol === "CLUB") {
      console.log("Trying to send CLUB animation...");
      await bot.sendAnimation(CHAT_ID, BUY_GIF_URL, { caption: message, parse_mode: "Markdown" });
      console.log("✅ Sent CLUB BUY with animation");
    } else {
      await bot.sendMessage(CHAT_ID, message, opts);
      console.log(`✅ Sent ${symbol} ${isBuy ? "BUY" : "SELL"}`);
    }
  } catch (err) {
    console.error("Telegram send failed:", err.message);
    // Fallback to text
    try {
      await bot.sendMessage(CHAT_ID, message, opts);
      console.log(`✅ Sent ${symbol} ${isBuy ? "BUY" : "SELL"} (text fallback)`);
    } catch (err2) {
      console.error("Fallback also failed:", err2.message);
    }
  }
}

// ... (keep the rest of the code: checkTokenV2, checkTokenV3, checkAllSwaps, start() the same as the last version I gave you)

async function start() {
  console.log("Bot starting...");
  await loadDecimals();
  await updatePrice();
  setInterval(updatePrice, 120000);
  setInterval(checkAllSwaps, 4000);
  await checkAllSwaps();
}

start();

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.writeHead(200); res.end("Bot is running"); }).listen(PORT);
