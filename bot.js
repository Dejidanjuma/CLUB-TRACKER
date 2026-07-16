const { ethers } = require("ethers");
const TelegramBot = require("node-telegram-bot-api").TelegramBot;
const http = require("http");

const RPC = "https://rpc.ankr.com/electroneum";
const WETN = "0x138DAFbDA0CCB3d8E39C19edb0510Fc31b7C1c77";
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/club_buy.MP4";

const provider = new ethers.JsonRpcProvider(RPC, { chainId: 52014, name: "electroneum" });
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

process.on("unhandledRejection", (reason) => console.error("UNHANDLED:", reason));
process.on("uncaughtException", (err) => console.error("UNCAUGHT:", err));

const tokens = [
  { symbol: "CLUB", address: "0xC9FC4AB00911793D99b5c7Bd01f01203C21D4131", pool: "0x86566c3c78424e3c3c2aDb274FAB551B7262E0ca", version: "v3", wetnIsToken0: true, website: "https://planetetn.org/profile/4-etn-club-ninjars", websiteLabel: "PlanetETN: CLUB Website" },
  { symbol: "BOLT", address: "0x043fAa1b5C5FC9a7dc35171f290c29ECDE0cCff1", pool: "0x4D2b867FCa568B5DC6367646811FaA4ED3C0520F", version: "v2", wetnIsToken0: false },
  { symbol: "DYNO", address: "0xEe432C220273e4F949007B4c1946562826Efa055", pool: "0xf24c6096E36EB242DdFc3B672Ed9d1f62aB33366", version: "v2", wetnIsToken0: true },
  { symbol: "PANDY", address: "0xc20d02538368D8F7deBeAeB99D9a8b4d4D1DDC1C", pool: "0x0d138f0bf5C7Bb25A078F791E5802776656e82D3", version: "v2", wetnIsToken0: true },
  { symbol: "DCNT", address: "0xE74e4E7A064310466f3bdBd3F3Ce4e8c8F7CF1d5", pool: "0x6cDF9e7c8177BFCEc940E3f195ACf5a9C04ae3CD", version: "v3", wetnIsToken0: true },
  { symbol: "SPIKE", address: "0x9bC7ab566e50A915016aE165A9c58Dad4e4828a1", pool: "0xa5Fb801c30FDC9b0532583BF02Df15E36e7b1a16", version: "v2", wetnIsToken0: true },
  { symbol: "USDC", address: "0x3187deAd7A2Bd6770F5Fe81495D1B715926AAe6e", pool: "0x2cB2Af7aef7AB4cc3228F9c55EE8542Cb323Ad8A", version: "v3", wetnIsToken0: true },
  { symbol: "USDT", address: "0x48E722f1458b253c2FB0E573F939318D7Dbd54e7", pool: "0x0CC625331C9b22D94fEF29d462aB1c9B26dFF196", version: "v3", wetnIsToken0: true },
  { symbol: "CORE", address: "0x309B916b3A90cb3E071697Ea9680e9217A30066f", pool: "0xc3FE6f98765493aB62AD87C9B5022Ff2FAA2e98D", version: "v2", wetnIsToken0: true }
];

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
      await bot.sendAnimation(CHAT_ID, BUY_GIF_URL, { caption: message, parse_mode: "Markdown" });
    } else {
      await bot.sendMessage(CHAT_ID, message, opts);
    }
    console.log(`✅ Telegram sent ${symbol} ${isBuy ? "BUY" : "SELL"}`);
  } catch (err) {
    console.error("❌ Telegram error:", err.message);
  }
}

async function checkTokenV2(t, fromBlock, toBlock) {
  const pool = new ethers.Contract(t.pool, v2Abi, provider);
  const events = await pool.queryFilter("Swap", fromBlock, toBlock);
  const dec = tokenDecimals[t.symbol] || 18;

  for (const event of events) {
    const txHash = event.transactionHash;
    if (seenTx.has(txHash)) continue;
    seenTx.add(txHash);

    const a0In = event.args[1];
    const a1In = event.args[2];
    const a0Out = event.args[3];
    const a1Out = event.args[4];

    console.log(`🔍 ${t.symbol} Swap: a0In=${a0In} a1In=${a1In} a0Out=${a0Out} a1Out=${a1Out} Tx:${txHash.slice(0,10)}...`);

    let isBuy = false;
    let wetnAmount = 0;
    let tokenAmount = 0;

    if (t.wetnIsToken0) {
      isBuy = a0In > 0n;
      wetnAmount = Number(ethers.formatUnits(isBuy ? a0In : a0Out, 18));
      tokenAmount = Number(ethers.formatUnits(isBuy ? a1Out : a1In, dec));
    } else {
      isBuy = a1In > 0n && a0Out > 0n;
      wetnAmount = Number(ethers.formatUnits(isBuy ? a1In : a1Out, 18));
      tokenAmount = Number(ethers.formatUnits(isBuy ? a0Out : a0In, dec));
    }

    if (tokenAmount < 0.000001 || wetnAmount < 0.000001) continue;

    const wallet = await getTraderWallet(txHash);
    if (!
