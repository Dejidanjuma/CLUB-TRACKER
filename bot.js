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

const tokens = [ /* same token list as before - I shortened for space but keep your full list */ 
  { symbol: "CLUB", address: "0xC9FC4AB00911793D99b5c7Bd01f01203C21D4131", pool: "0x86566c3c78424e3c3c2aDb274FAB551B7262E0ca", version: "v3", wetnIsToken0: true, website: "https://planetetn.org/profile/4-etn-club-ninjars", websiteLabel: "PlanetETN: CLUB Website" },
  { symbol: "BOLT", address: "0x043fAa1b5C5FC9a7dc35171f290c29ECDE0cCff1", pool: "0x4D2b867FCa568B5DC6367646811FaA4ED3C0520F", version: "v2", wetnIsToken0: false },
  { symbol: "DYNO", address: "0xEe432C220273e4F949007B4c1946562826Efa055", pool: "0xf24c6096E36EB242DdFc3B672Ed9d1f62aB33366", version: "v2", wetnIsToken0: true },
  // ... add the rest of your tokens here (PANDY, DCNT, etc.) exactly as before
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

async function loadDecimals() { /* same as before */ 
  for (const t of tokens) {
    try {
      const c = new ethers.Contract(t.address, erc20Abi, provider);
      tokenDecimals[t.symbol] = await c.decimals();
    } catch (e) { tokenDecimals[t.symbol] = 18; }
  }
}

async function updatePrice() { /* same */ 
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=electroneum&vs_currencies=usd");
    if (res.ok) {
      const data = await res.json();
      if (data.electroneum?.usd) etnPriceUsd = data.electroneum.usd;
    }
  } catch (e) {}
}

async function getTraderWallet(txHash) { /* same */ 
  try {
    const tx = await provider.getTransaction(txHash);
    return tx.from;
  } catch (e) { return null; }
}

function formatMessage(t, isBuy, wetnAmount, tokenAmount, txHash, wallet) { /* same as previous version */ 
  // ... (copy from the last full code I gave you)
}

async function sendTradeMessage(message, isBuy, symbol) { /* same */ 
  const opts = { parse_mode: "Markdown", disable_web_page_preview: true };
  try {
    if (isBuy && symbol === "CLUB") {
      await bot.sendAnimation(CHAT_ID, BUY_GIF_URL, { caption: message, parse_mode: "Markdown" });
    } else {
      await bot.sendMessage(CHAT_ID, message, opts);
    }
  } catch (err) {
    try { await bot.sendMessage(CHAT_ID, message, opts); } catch (e) {}
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

    const a0In = event.args[1], a1In = event.args[2], a0Out = event.args[3], a1Out = event.args[4];

    let isBuy = false, wetnAmount = 0, tokenAmount = 0;

    if (t.wetnIsToken0) {
      isBuy = a0In > 0n;
      wetnAmount = Number(ethers.formatUnits(isBuy ? a0In : a0Out, 18));
      tokenAmount = Number(ethers.formatUnits(isBuy ? a1Out : a1In, dec));
    } else {
      if (a1In > 0n && a0Out > 0n) isBuy = true;
      else if (a0In > 0n && a1Out > 0n) isBuy = false;

      wetnAmount = Number(ethers.formatUnits(isBuy ? a1In : a1Out, 18));
      tokenAmount = Number(ethers.formatUnits(isBuy ? a0Out : a0In, dec));
    }

    if (tokenAmount < 0.000001 || wetnAmount < 0.000001) continue;

    const wallet = await getTraderWallet(txHash);
    if (!wallet) continue;

    const message = formatMessage(t, isBuy, wetnAmount, tokenAmount, txHash, wallet);
    await sendTradeMessage(message, isBuy, t.symbol);
    console.log("✅ POSTED", t.symbol, isBuy ? "BUY" : "SELL");
  }
}

// checkTokenV3 and checkAllSwaps + start() same as last version

// (To save space, use the checkTokenV3, checkAllSwaps, start(), and formatMessage from the previous full code I gave you. If you need me to paste the absolute full thing again, say "full again")
