const { ethers } = require("ethers");
const TelegramBot = require("node-telegram-bot-api").TelegramBot;
const http = require("http");

const RPC = "https://rpc.ankr.com/electroneum";
const WETN = "0x138DAFbDA0CCB3d8E39C19edb0510Fc31b7C1c77";
const ROUTER_ADDRESS = "0x2c12c8f15637b7a182dec202816148a5e767dcec";
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const CLUB_GROUP_CHAT_ID = process.env.CLUB_GROUP_CHAT_ID || "-1002386155004";
const LIVE_TRADES_TOPIC_ID = 55341;
const BLOCKSCOUT_BASE = "https://blockexplorer.electroneum.com/api/v2";
const LIVE_TRADES_EXCLUDED_SYMBOLS = new Set(["CORE"]);

const WETN_USDT_POOL = "0x0CC625331C9b22D94fEF29d462aB1c9B26dFF196";

const BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/club_buy.mp4";
const CLUB_SELL_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/club_sell.mp4";
const BOLT_BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/bolt_buy.mp4";
const BOLT_SELL_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/bolt_sell.mp4";
const DYNO_BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/dyno_buy.mp4";
const DYNO_SELL_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/dyno_sell.mp4";
const CORE_BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/core_buy.mp4";
const CORE_SELL_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/core_sell.mp4";
const USDT_BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/usdt_buy.mp4";
const USDT_SELL_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/usdt_sell.mp4";
const USDC_BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/usdc_buy.mp4";
const USDC_SELL_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/usdc_sell.mp4";
const FUGAZI_BUY_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/fugazi_buy.mp4";
const FUGAZI_SELL_GIF_URL = "https://raw.githubusercontent.com/Dejidanjuma/CLUB-TRACKER/main/fugazi_sell.mp4";

const provider = new ethers.JsonRpcProvider(RPC, { chainId: 52014, name: "electroneum" });
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

process.on("unhandledRejection", (reason) => console.error("UNHANDLED:", reason));
process.on("uncaughtException", (err) => console.error("UNCAUGHT:", err));

const ADDR = {
  CLUB: "0xC9FC4AB00911793D99b5c7Bd01f01203C21D4131",
  BOLT: "0x043fAa1b5C5FC9a7dc35171f290c29ECDE0cCff1",
  DYNO: "0xEe432C220273e4F949007B4c1946562826Efa055",
  PANDY: "0xc20d02538368D8F7deBeAeB99D9a8b4d4D1DDC1C",
  DCNT: "0xE74e4E7A064310466f3bdBd3F3Ce4e8c8F7CF1d5",
  SPIKE: "0x9bC7ab566e50A915016aE165A9c58Dad4e4828a1",
  USDC: "0x3187deAd7A2Bd6770F5Fe81495D1B715926AAe6e",
  USDT: "0x48E722f1458b253c2FB0E573F939318D7Dbd54e7",
  CORE: "0x309B916b3A90cb3E071697Ea9680e9217A30066f",
  FUGAZI: "0x075533AB8EeC6A6999F07C8bc2f1900eB8312e25"
};

const CLUB_WEBSITE = "https://planetetn.org/profile/4-etn-club-ninjars";
const STABLES = ["USDC", "USDT"];

const wetnPools = [
  { symbol: "CLUB", token: ADDR.CLUB, pool: "0x86566c3c78424e3c3c2aDb274FAB551B7262E0ca", version: "v3", wetnIsToken0: true, website: CLUB_WEBSITE, websiteLabel: "PlanetETN: CLUB Website" },
  { symbol: "BOLT", token: ADDR.BOLT, pool: "0x4D2b867FCa568B5DC6367646811FaA4ED3C0520F", version: "v2", wetnIsToken0: false },
  { symbol: "BOLT", token: ADDR.BOLT, pool: "0x91b65E1bd9bc6a2A54c409282a38F34825aC0F37", version: "v3", wetnIsToken0: false },
  { symbol: "BOLT", token: ADDR.BOLT, pool: "0x2Df6c494B5e96b781b5cB410C4889D4f079bad30", version: "v3", wetnIsToken0: false },
  { symbol: "BOLT", token: ADDR.BOLT, pool: "0x92da16fEA0E492d21F400283b54e67A525797E3b", version: "v3", wetnIsToken0: false },
  { symbol: "DYNO", token: ADDR.DYNO, pool: "0xf24c6096E36EB242DdFc3B672Ed9d1f62aB33366", version: "v2", wetnIsToken0: true },
  { symbol: "DYNO", token: ADDR.DYNO, pool: "0x806559d60869359CD4Eb4FfD94Ad8F9b668D919C", version: "v3", wetnIsToken0: true },
  { symbol: "DYNO", token: ADDR.DYNO, pool: "0xB5Aa83926Eb5F25A76da8687f82Fbf1884c56bF8", version: "v3", wetnIsToken0: true },
  { symbol: "PANDY", token: ADDR.PANDY, pool: "0x0d138f0bf5C7Bb25A078F791E5802776656e82D3", version: "v2", wetnIsToken0: true },
  { symbol: "DCNT", token: ADDR.DCNT, pool: "0x6cDF9e7c8177BFCEc940E3f195ACf5a9C04ae3CD", version: "v3", wetnIsToken0: true },
  { symbol: "SPIKE", token: ADDR.SPIKE, pool: "0xa5Fb801c30FDC9b0532583BF02Df15E36e7b1a16", version: "v2", wetnIsToken0: true },
  { symbol: "USDC", token: ADDR.USDC, pool: "0x2cB2Af7aef7AB4cc3228F9c55EE8542Cb323Ad8A", version: "v3", wetnIsToken0: true },
  { symbol: "USDT", token: ADDR.USDT, pool: "0x0CC625331C9b22D94fEF29d462aB1c9B26dFF196", version: "v3", wetnIsToken0: true },
  { symbol: "USDT", token: ADDR.USDT, pool: "0xD6b16F3915d7A93D4235F8a2142Ef9f4bF865a76", version: "v3", wetnIsToken0: true },
  { symbol: "CORE", token: ADDR.CORE, pool: "0xc3FE6f98765493aB62AD87C9B5022Ff2FAA2e98D", version: "v2", wetnIsToken0: true },
  { symbol: "CORE", token: ADDR.CORE, pool: "0xF0539385BD7057c81925382d1e74108Fc5c31bbC", version: "v3", wetnIsToken0: true },
  { symbol: "FUGAZI", token: ADDR.FUGAZI, pool: "0x5F868b7E7345c0D6D4daD376521e6Ac4ac0CC836", version: "v2", wetnIsToken0: false }
];

const crossPools = [
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "CLUB", tokenB: ADDR.CLUB, pool: "0xEB7bEC5284Cf0287bD9A53f5E22A551b6282519F", version: "v3", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "CLUB", tokenB: ADDR.CLUB, pool: "0x8506EaCd7b219EF41d08DDd41256193Da84A3aC6", version: "v3", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "CLUB", tokenB: ADDR.CLUB, pool: "0xc1d2C56E7437A31aeb942C20d2A4fd692a26bf82", version: "v3", aIsToken0: true },
  { symbolA: "CLUB", tokenA: ADDR.CLUB, symbolB: "DYNO", tokenB: ADDR.DYNO, pool: "0x20C914F760F90D239Dfdfc1e0630aa76B7904bbb", version: "v3", aIsToken0: true },
  { symbolA: "CLUB", tokenA: ADDR.CLUB, symbolB: "DYNO", tokenB: ADDR.DYNO, pool: "0x2132e7c909C4c3338Eda5F0e165A3A43AaDC3FBe", version: "v3", aIsToken0: true },
  { symbolA: "USDT", tokenA: ADDR.USDT, symbolB: "CLUB", tokenB: ADDR.CLUB, pool: "0x2289145dA957E22f95232ACdF42b2ced9B4D0c7b", version: "v3", aIsToken0: true },
  { symbolA: "CORE", tokenA: ADDR.CORE, symbolB: "CLUB", tokenB: ADDR.CLUB, pool: "0x06fcb331A504b5Ee2076e85130be572698234D73", version: "v3", aIsToken0: true },
  { symbolA: "CORE", tokenA: ADDR.CORE, symbolB: "CLUB", tokenB: ADDR.CLUB, pool: "0x8DEB65Ab306aa1704f17f9CEC4B99058A489B29e", version: "v3", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "DYNO", tokenB: ADDR.DYNO, pool: "0x143149006296Ae8AE089BEdA593Ee8e25274969B", version: "v2", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "DYNO", tokenB: ADDR.DYNO, pool: "0x32ECfC060373e3379A86538A5017b4D89A5A75c1", version: "v3", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "DYNO", tokenB: ADDR.DYNO, pool: "0xEDD3B0eA9C82C81656Ec32D7Ea7b514A6b02021d", version: "v3", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "PANDY", tokenB: ADDR.PANDY, pool: "0xdAc79CD60ffb72Bcc701f9E1Da166Ca46A552A01", version: "v2", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "SPIKE", tokenB: ADDR.SPIKE, pool: "0xf229DFf491FcEb9D4BD6A4d0caa93C8f916abA8a", version: "v2", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "USDT", tokenB: ADDR.USDT, pool: "0x208db43EaBc6e0EC74D2895AaC7Bc8fFC1Ee71F8", version: "v3", aIsToken0: true },
  { symbolA: "BOLT", tokenA: ADDR.BOLT, symbolB: "USDT", tokenB: ADDR.USDT, pool: "0xd4828292B0929da49a1B550636DBB87BFD402378", version: "v3", aIsToken0: true },
  { symbolA: "PANDY", tokenA: ADDR.PANDY, symbolB: "DYNO", tokenB: ADDR.DYNO, pool: "0xf46462190321DaA812b9d75e5D5eAc817c63BC64", version: "v2", aIsToken0: true },
  { symbolA: "USDC", tokenA: ADDR.USDC, symbolB: "USDT", tokenB: ADDR.USDT, pool: "0xfc5F394415d5F2225d8D39D3595c6B754fb99725", version: "v3", aIsToken0: true },
  { symbolA: "USDC", tokenA: ADDR.USDC, symbolB: "USDT", tokenB: ADDR.USDT, pool: "0x2B4BaecE8fDf1EB35d182C94D505f7F9d0b9fda9", version: "v3", aIsToken0: true }
];

const v2Abi = ["event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"];
const v3Abi = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];
const erc20Abi = [
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

let etnPriceUsd = 0.00071;
let lastBlock = null;
const tokenDecimals = {};
const seenKeys = new Set();
const reclassifiedTxs = new Set();

const supplyCache = new Map();
const holdersCache = new Map();
const SUPPLY_TTL = 3 * 60 * 1000;
const HOLDERS_TTL = 8 * 60 * 1000;

const ADDR_TO_SYMBOL = {};
for (const [sym, addr] of Object.entries(ADDR)) {
  ADDR_TO_SYMBOL[addr.toLowerCase()] = sym;
}

function formatTokenAmount(num) {
  if (num == null || isNaN(num)) return "0";
  let s = num.toLocaleString("en-US", { maximumFractionDigits: 8, useGrouping: true });
  if (s.includes(".")) s = s.replace(/\.?0+$/, "");
  return s;
}

function formatWetnAmount(num) {
  if (num == null || isNaN(num)) return "0";
  let s = num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3, useGrouping: true });
  if (s.includes(".")) s = s.replace(/\.?0+$/, "");
  return s;
}

function formatTokenPrice(price) {
  if (price == null || isNaN(price) || price <= 0) return "$0";
  let decimals;
  if (price >= 1) decimals = 4;
  else if (price >= 0.01) decimals = 6;
  else if (price >= 0.0001) decimals = 8;
  else decimals = 10;
  let s = price.toFixed(decimals);
  s = s.replace(/\.?0+$/, "");
  return "$" + s;
}

function formatMarketCap(mc) {
  if (mc == null || isNaN(mc) || mc <= 0) return null;
  if (mc >= 1_000_000) return "$" + (mc / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (mc >= 1_000) return "$" + Math.round(mc).toLocaleString("en-US");
  return "$" + mc.toFixed(2).replace(/\.?0+$/, "");
}

function formatPosition(pct) {
  if (pct == null || isNaN(pct)) return null;
  const abs = Math.abs(pct).toFixed(2);
  if (pct >= 0) return "📈 *Position:* +" + abs + "%";
  return "📉 *Position:* -" + abs + "%";
}

async function getTotalSupply(tokenAddress, decimals) {
  const key = tokenAddress.toLowerCase();
  const cached = supplyCache.get(key);
  if (cached && Date.now() - cached.ts < SUPPLY_TTL) return cached.value;
  try {
    const c = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const raw = await c.totalSupply();
    const value = Number(ethers.formatUnits(raw, decimals));
    supplyCache.set(key, { value, ts: Date.now() });
    return value;
  } catch (e) {
    console.error(`totalSupply failed for ${tokenAddress.slice(0, 8)}:`, e.message);
    return null;
  }
}

async function getWalletBalanceAtBlock(tokenAddress, wallet, decimals, blockNumber) {
  try {
    const c = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const blockTag = Math.max(0, Number(blockNumber) - 1);
    const raw = await c.balanceOf(wallet, { blockTag });
    return Number(ethers.formatUnits(raw, decimals));
  } catch (e) {
    console.error(`balanceOf@block failed for ${wallet.slice(0, 8)}:`, e.message);
    return null;
  }
}

async function getHolders(tokenAddress) {
  const key = tokenAddress.toLowerCase();
  const cached = holdersCache.get(key);
  if (cached && Date.now() - cached.ts < HOLDERS_TTL) return cached.value;
  try {
    const url = `${BLOCKSCOUT_BASE}/tokens/${tokenAddress}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const holders = data.holders != null ? Number(data.holders) : null;
    if (holders != null) {
      holdersCache.set(key, { value: holders, ts: Date.now() });
    }
    return holders;
  } catch (e) {
    console.error(`Blockscout holders failed for ${tokenAddress.slice(0, 8)}:`, e.message);
    return null;
  }
}

async function getEnrichment(tokenAddress, symbol, wallet, decimals, tokenUsdPrice, tokenAmount, isBuy, blockNumber) {
  const [totalSupply, balanceBefore, holders] = await Promise.all([
    getTotalSupply(tokenAddress, decimals),
    getWalletBalanceAtBlock(tokenAddress, wallet, decimals, blockNumber),
    getHolders(tokenAddress)
  ]);

  let marketCap = null;
  let positionPct = null;

  if (totalSupply != null && totalSupply > 0 && tokenUsdPrice > 0) {
    marketCap = totalSupply * tokenUsdPrice;
  }

  if (balanceBefore != null && tokenAmount > 0 && balanceBefore > 0.000001) {
    const relative = tokenAmount / balanceBefore;
    if (relative < 100) {
      if (isBuy) {
        positionPct = relative * 100;
      } else {
        const sold = Math.min(tokenAmount, balanceBefore);
        positionPct = -(sold / balanceBefore) * 100;
        if (positionPct < -100) positionPct = -100;
      }
    }
  }

  return {
    totalSupply,
    walletBal: balanceBefore,
    holders,
    marketCap,
    positionPct,
    tokenUsdPrice
  };
}

async function loadDecimals() {
  for (const symbol of Object.keys(ADDR)) {
    try {
      const c = new ethers.Contract(ADDR[symbol], erc20Abi, provider);
      tokenDecimals[symbol] = await c.decimals();
    } catch (e) {
      tokenDecimals[symbol] = 18;
    }
  }
  console.log("Decimals loaded:", tokenDecimals);
}

async function getEtNPriceFromPool() {
  try {
    const pool = new ethers.Contract(WETN_USDT_POOL, v3Abi, provider);
    const [slot0, token0Addr, token1Addr] = await Promise.all([
      pool.slot0(),
      pool.token0(),
      pool.token1()
    ]);

    const t0 = token0Addr.toLowerCase();
    const t1 = token1Addr.toLowerCase();
    const wetn = WETN.toLowerCase();
    const usdt = ADDR.USDT.toLowerCase();

    const isWetnUsdt =
      (t0 === wetn && t1 === usdt) ||
      (t0 === usdt && t1 === wetn);

    if (!isWetnUsdt) return null;

    const sqrtPriceX96 = slot0[0];
    if (typeof sqrtPriceX96 !== "bigint" || sqrtPriceX96 <= 0n) return null;

    const Q96 = 2n ** 96n;
    const ratioScaled = (sqrtPriceX96 * 10n ** 18n) / Q96;
    const sqrtP = Number(ratioScaled) / 1e18;
    const rawPrice = sqrtP * sqrtP;

    if (!isFinite(rawPrice) || rawPrice <= 0) return null;

    let priceUsdtPerWetn;
    if (t0 === wetn && t1 === usdt) {
      priceUsdtPerWetn = rawPrice * 1e12;
    } else {
      priceUsdtPerWetn = (1 / rawPrice) * 1e12;
    }

    if (!isFinite(priceUsdtPerWetn) || priceUsdtPerWetn <= 0 || priceUsdtPerWetn > 1) {
      return null;
    }

    return priceUsdtPerWetn;
  } catch (e) {
    console.error("On-chain ETN price failed:", e.message);
    return null;
  }
}

async function getExternalEtnPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=electroneum&vs_currencies=usd",
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      const p = data?.electroneum?.usd;
      if (p && p > 0 && isFinite(p)) {
        return { price: p, source: "CoinGecko" };
      }
    } else {
      console.error("CoinGecko HTTP status:", res.status);
    }
  } catch (e) {
    console.error("CoinGecko failed:", e.message);
  }

  try {
    const res = await fetch(
      "https://api.coinpaprika.com/v1/tickers/etn-electroneum",
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      const p = data?.quotes?.USD?.price;
      if (p && p > 0 && isFinite(p)) {
        return { price: p, source: "CoinPaprika" };
      }
    } else {
      console.error("CoinPaprika HTTP status:", res.status);
    }
  } catch (e) {
    console.error("CoinPaprika failed:", e.message);
  }

  return null;
}

async function updatePrice() {
  const external = await getExternalEtnPrice();

  if (external && external.price > 0) {
    etnPriceUsd = external.price;
    console.log(`ETN price: $${etnPriceUsd} | Source: ${external.source}`);
    return;
  }

  console.log(`⚠️ CoinGecko and CoinPaprika unavailable`);
  console.log(`ETN price: $${etnPriceUsd} | Source: Previous valid price`);
}

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const receiptCache = new Map();

async function getReceipt(txHash) {
  if (receiptCache.has(txHash)) return receiptCache.get(txHash);
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        receiptCache.set(txHash, receipt);
        if (receiptCache.size > 500) receiptCache.clear();
        return receipt;
      }
    } catch (e) {
      console.log(`⚠️ getReceipt attempt ${attempt}/${maxAttempts} failed for ${txHash.slice(0,10)}: ${e.message}`);
    }
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 500 * attempt));
  }
  console.log(`❌ Could not fetch receipt for ${txHash.slice(0,10)} after ${maxAttempts} attempts`);
  return null;
}

async function getTraderWallet(txHash) {
  const receipt = await getReceipt(txHash);
  return receipt ? receipt.from : null;
}

function walletTopicOf(wallet) {
  return "0x000000000000000000000000" + wallet.slice(2).toLowerCase();
}

function transferInvolvesWallet(receipt, tokenAddress, wallet, direction) {
  const walletTopic = walletTopicOf(wallet);
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) continue;
    if (log.topics[0] !== TRANSFER_TOPIC) continue;
    if (direction === "from" && log.topics[1].toLowerCase() === walletTopic) return true;
    if (direction === "to" && log.topics[2].toLowerCase() === walletTopic) return true;
  }
  return false;
}

function getBetterTokenAmount(receipt, tokenAddress, wallet, direction, decimals, fallbackAmount) {
  if (!receipt) return fallbackAmount;
  const walletTopic = walletTopicOf(wallet);
  let total = 0n;
  let found = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) continue;
    if (log.topics[0] !== TRANSFER_TOPIC) continue;
    const isFrom = log.topics[1].toLowerCase() === walletTopic;
    const isTo = log.topics[2].toLowerCase() === walletTopic;
    if ((direction === "from" && isFrom) || (direction === "to" && isTo)) {
      total += BigInt(log.data);
      found = true;
    }
  }
  if (found && total > 0n) return Number(ethers.formatUnits(total, decimals));
  return fallbackAmount;
}

const WETN_DEPOSIT_TOPIC = ethers.id("Deposit(address,uint256)");
const WETN_WITHDRAWAL_TOPIC = ethers.id("Withdrawal(address,uint256)");

function getNetWetnAmount(receipt, isBuy, fallbackAmount) {
  if (!receipt) return fallbackAmount;
  let deposited = 0n;
  let withdrawn = 0n;
  let sawDeposit = false;
  let sawWithdrawal = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== WETN.toLowerCase()) continue;
    if (log.topics[0] === WETN_DEPOSIT_TOPIC) {
      deposited += BigInt(log.data);
      sawDeposit = true;
    } else if (log.topics[0] === WETN_WITHDRAWAL_TOPIC) {
      withdrawn += BigInt(log.data);
      sawWithdrawal = true;
    }
  }
  if (isBuy) {
    if (!sawDeposit) return fallbackAmount;
    const net = deposited - withdrawn;
    if (net <= 0n) return fallbackAmount;
    return Number(ethers.formatUnits(net, 18));
  } else {
    if (!sawWithdrawal) return fallbackAmount;
    return Number(ethers.formatUnits(withdrawn, 18));
  }
}

async function isGenuineLeg(txHash, wallet, tokenAddress, direction) {
  const receipt = await getReceipt(txHash);
  if (!receipt) return false;
  return transferInvolvesWallet(receipt, tokenAddress, wallet, direction);
}

function getTraderTokenFlows(receipt, wallet) {
  if (!receipt) return [];
  const walletTopic = walletTopicOf(wallet);
  const flows = new Map();

  for (const log of receipt.logs) {
    if (log.topics[0] !== TRANSFER_TOPIC) continue;
    const tokenAddr = log.address.toLowerCase();
    if (tokenAddr === WETN.toLowerCase()) continue;

    const isFrom = log.topics[1] && log.topics[1].toLowerCase() === walletTopic;
    const isTo   = log.topics[2] && log.topics[2].toLowerCase() === walletTopic;
    if (!isFrom && !isTo) continue;

    const value = BigInt(log.data);
    const current = flows.get(tokenAddr) || 0n;
    if (isTo)   flows.set(tokenAddr, current + value);
    if (isFrom) flows.set(tokenAddr, current - value);
  }

  const result = [];
  for (const [addr, net] of flows) {
    if (net === 0n) continue;
    const symbol = ADDR_TO_SYMBOL[addr];
    if (!symbol) continue;
    const dec = tokenDecimals[symbol] || 18;
    const amount = Number(ethers.formatUnits(net < 0n ? -net : net, dec));
    if (amount < 0.000001) continue;
    result.push({
      symbol,
      address: addr,
      amount,
      direction: net > 0n ? "in" : "out"
    });
  }
  return result;
}

function walletLinkParts(wallet) {
  const link = "https://blockexplorer.electroneum.com/address/" + wallet;
  const short = wallet.slice(0, 6) + "..." + wallet.slice(-4);
  return { link, short };
}

function formatWetnMessage(symbol, isBuy, wetnAmount, tokenAmount, txHash, wallet, poolAddress, website, websiteLabel, enrichment) {
  const usdValue = wetnAmount * etnPriceUsd;
  const tokenUsdPrice = enrichment?.tokenUsdPrice ?? (tokenAmount > 0 ? usdValue / tokenAmount : 0);
  const circles = buildCircles(isBuy, usdValue);
  const label = isBuy ? "BUY" : "SELL";
  const roleLabel = isBuy ? "Buyer" : "Seller";
  const txLink = "https://blockexplorer.electroneum.com/tx/" + txHash;
  const { link: walletLink, short: walletShort } = walletLinkParts(wallet);
  const buyLink = `https://app.electroswap.io/swap?inputCurrency=${WETN}&outputCurrency=${ADDR[symbol]}`;
  const liveTxsLink = "https://blockexplorer.electroneum.com/address/" + poolAddress;

  let msg = circles + "\n*" + symbol + " " + label + "* ($" + usdValue.toFixed(2) + ")\n\n";

  if (isBuy) {
    msg += "💰 *Paid:* " + formatWetnAmount(wetnAmount) + " WETN\n";
    msg += "🔢 *Got:* " + formatTokenAmount(tokenAmount) + " " + symbol + "\n";
  } else {
    msg += "💰 *Received:* " + formatWetnAmount(wetnAmount) + " WETN\n";
    msg += "🔢 *Amount:* " + formatTokenAmount(tokenAmount) + " " + symbol + "\n";
  }

  msg += "💵 *" + symbol + " Price:* " + formatTokenPrice(tokenUsdPrice) + "\n";
  msg += "👤 *" + roleLabel + ":* [" + walletShort + "](" + walletLink + ")\n";
  msg += "🔗 [View Transaction](" + txLink + ")\n";

  if (enrichment) {
    const posLine = formatPosition(enrichment.positionPct);
    if (posLine) msg += "\n" + posLine;

    if (enrichment.marketCap != null) {
      msg += "\n💎 *Market Cap:* " + formatMarketCap(enrichment.marketCap);
    }
    if (enrichment.holders != null) {
      msg += "\n👥 *" + symbol + " Holders:* " + enrichment.holders.toLocaleString("en-US");
    }
  }

  msg += "\n💵 *ETN Price:* " + formatTokenPrice(etnPriceUsd);
  msg += "\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
  msg += "💵 [Buy " + symbol + "](" + buyLink + ") | ⚡ [Live Txs](" + liveTxsLink + ")";
  if (website) msg += "\n🌎 [" + websiteLabel + "](" + website + ")";

  return msg;
}

function formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, txHash, wallet, poolAddress) {
  const txLink = "https://blockexplorer.electroneum.com/tx/" + txHash;
  const { link: walletLink, short: walletShort } = walletLinkParts(wallet);
  const liveTxsLink = "https://blockexplorer.electroneum.com/address/" + poolAddress;
  const tradeLink = `https://app.electroswap.io/swap?inputCurrency=${ADDR[symbolIn]}&outputCurrency=${ADDR[symbolOut]}`;
  let usdLine = "";
  if (STABLES.includes(symbolIn)) usdLine = "💵 *Value:* $" + amountIn.toFixed(2) + "\n";
  else if (STABLES.includes(symbolOut)) usdLine = "💵 *Value:* $" + amountOut.toFixed(2) + "\n";
  const circles = "🔵".repeat(10);
  return circles + "\n*" + symbolIn + " → " + symbolOut + " SWAP*\n\n" +
    "💰 *Paid:* " + formatTokenAmount(amountIn) + " " + symbolIn + "\n" +
    "🔢 *Received:* " + formatTokenAmount(amountOut) + " " + symbolOut + "\n" +
    usdLine +
    "👤 *Trader:* [" + walletShort + "](" + walletLink + ")\n" +
    "🔗 [View Transaction](" + txLink + ")\n\n" +
    "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "🔄 [Trade " + symbolIn + "→" + symbolOut + "](" + tradeLink + ") | ⚡ [Live Txs](" + liveTxsLink + ")";
}

async function sendMessageWithOptionalGif(message, gifUrl, usdValue = 0, symbol = null) {
  const opts = { parse_mode: "Markdown", disable_web_page_preview: true };

  try {
    if (gifUrl) {
      await bot.sendAnimation(CHAT_ID, gifUrl, {
        caption: message,
        parse_mode: "Markdown"
      });
    } else {
      await bot.sendMessage(CHAT_ID, message, opts);
    }
  } catch (err) {
    console.error("Send failed to main group:", err.message);
    try {
      await bot.sendMessage(CHAT_ID, message, opts);
    } catch (e) {}
  }

  const isTokenToToken = symbol === null;
  const qualifiesForLive =
    isTokenToToken ||
    (usdValue >= 5 && symbol && !LIVE_TRADES_EXCLUDED_SYMBOLS.has(symbol));

  if (qualifiesForLive) {
    const topicOpts = {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
      message_thread_id: LIVE_TRADES_TOPIC_ID
    };

    try {
      if (gifUrl) {
        await bot.sendAnimation(CLUB_GROUP_CHAT_ID, gifUrl, {
          caption: message,
          parse_mode: "Markdown",
          message_thread_id: LIVE_TRADES_TOPIC_ID
        });
      } else {
        await bot.sendMessage(CLUB_GROUP_CHAT_ID, message, topicOpts);
      }
    } catch (err) {
      console.error("Send failed to LIVE TRADES topic:", err.message);
      try {
        await bot.sendMessage(CLUB_GROUP_CHAT_ID, message, topicOpts);
      } catch (e) {}
    }
  }
}

const BUY_GIFS = {
  CLUB: BUY_GIF_URL,
  BOLT: BOLT_BUY_GIF_URL,
  DYNO: DYNO_BUY_GIF_URL,
  CORE: CORE_BUY_GIF_URL,
  USDT: USDT_BUY_GIF_URL,
  USDC: USDC_BUY_GIF_URL,
  FUGAZI: FUGAZI_BUY_GIF_URL
};
const SELL_GIFS = {
  CLUB: CLUB_SELL_GIF_URL,
  BOLT: BOLT_SELL_GIF_URL,
  DYNO: DYNO_SELL_GIF_URL,
  CORE: CORE_SELL_GIF_URL,
  USDT: USDT_SELL_GIF_URL,
  USDC: USDC_SELL_GIF_URL,
  FUGAZI: FUGAZI_SELL_GIF_URL
};
const GIF_PRIORITY = ["CLUB", "BOLT", "DYNO", "CORE", "USDT", "USDC", "FUGAZI"];

function pickWetnGif(symbol, isBuy) {
  return isBuy ? (BUY_GIFS[symbol] || null) : (SELL_GIFS[symbol] || null);
}

function pickCrossGif(symbolIn, symbolOut) {
  for (const s of GIF_PRIORITY) {
    if (symbolOut === s) return BUY_GIFS[s];
  }
  for (const s of GIF_PRIORITY) {
    if (symbolIn === s) return SELL_GIFS[s];
  }
  return null;
}

function makeKey(txHash, logIndex) {
  return txHash + "-" + logIndex;
}

const CIRCLE_MIN = 1;
const CIRCLE_MAX = 50;
const CIRCLE_BASE = 0.08;
const CIRCLE_SCALE = 12.5;

function getCircleCount(usdValue) {
  if (usdValue <= 0) return CIRCLE_MIN;
  const count = Math.round(CIRCLE_SCALE * Math.log10(usdValue / CIRCLE_BASE));
  return Math.min(CIRCLE_MAX, Math.max(CIRCLE_MIN, count));
}

function buildCircles(isBuy, usdValue) {
  const emoji = isBuy ? "🟢" : "🔴";
  const count = getCircleCount(usdValue);
  let result = "";
  for (let i = 0; i < count; i++) {
    result += emoji;
    if ((i + 1) % 10 === 0 && i + 1 < count) result += "\n";
  }
  return result;
}

async function checkWetnPoolV2(p, fromBlock, toBlock) {
  const pool = new ethers.Contract(p.pool, v2Abi, provider);
  const events = await pool.queryFilter("Swap", fromBlock, toBlock);
  const dec = tokenDecimals[p.symbol] || 18;

  for (const event of events) {
    const key = makeKey(event.transactionHash, event.logIndex);
    if (seenKeys.has(key)) continue;

    const a0In = event.args[1], a1In = event.args[2], a0Out = event.args[3], a1Out = event.args[4];
    let isBuy, wetnAmount, tokenAmountFromSwap;

    if (p.wetnIsToken0) {
      isBuy = a0In > 0n;
      wetnAmount = Number(ethers.formatUnits(isBuy ? a0In : a0Out, 18));
      tokenAmountFromSwap = Number(ethers.formatUnits(isBuy ? a1Out : a1In, dec));
    } else {
      isBuy = a1In > 0n && a0Out > 0n;
      wetnAmount = Number(ethers.formatUnits(isBuy ? a1In : a1Out, 18));
      tokenAmountFromSwap = Number(ethers.formatUnits(isBuy ? a0Out : a0In, dec));
    }

    if (tokenAmountFromSwap < 0.000001 || wetnAmount < 0.000001) continue;

    const wallet = await getTraderWallet(event.transactionHash);
    if (!wallet) continue;

    const direction = isBuy ? "to" : "from";
    const genuine = await isGenuineLeg(event.transactionHash, wallet, p.token, direction);
    if (!genuine) {
      console.log(`⏭️ Skipped ${p.symbol} ${isBuy ? "BUY" : "SELL"} (intermediate hop) [v2]`);
      continue;
    }

    const receipt = await getReceipt(event.transactionHash);

    const flows = getTraderTokenFlows(receipt, wallet);
    const outs = flows.filter(f => f.direction === "out");
    const ins  = flows.filter(f => f.direction === "in");

    if (outs.length === 1 && ins.length === 1) {
      if (reclassifiedTxs.has(event.transactionHash)) {
        seenKeys.add(key);
        continue;
      }

      const outFlow = outs[0];
      const inFlow  = ins[0];
      const symbolIn  = outFlow.symbol;
      const amountIn  = outFlow.amount;
      const symbolOut = inFlow.symbol;
      const amountOut = inFlow.amount;

      reclassifiedTxs.add(event.transactionHash);
      seenKeys.add(key);

      const message = formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, event.transactionHash, wallet, p.pool);
      const gifUrl = pickCrossGif(symbolIn, symbolOut);
      await sendMessageWithOptionalGif(message, gifUrl, 0);
      console.log(`✅ Sent multi-hop ${symbolIn}→${symbolOut} (reclassified from ${p.symbol} WETN leg) [v2]`);
      continue;
    }

    const tokenAmount = getBetterTokenAmount(receipt, p.token, wallet, direction, dec, tokenAmountFromSwap);
    wetnAmount = getNetWetnAmount(receipt, isBuy, wetnAmount);
    const usdValue = wetnAmount * etnPriceUsd;
    const tokenUsdPrice = tokenAmount > 0 ? usdValue / tokenAmount : 0;

    let enrichment = null;
    try {
      enrichment = await getEnrichment(
        p.token, p.symbol, wallet, dec, tokenUsdPrice,
        tokenAmount, isBuy, receipt.blockNumber
      );
    } catch (e) {
      console.error("Enrichment failed (non-fatal):", e.message);
    }

    seenKeys.add(key);

    const message = formatWetnMessage(p.symbol, isBuy, wetnAmount, tokenAmount, event.transactionHash, wallet, p.pool, p.website, p.websiteLabel, enrichment);
    const gifUrl = pickWetnGif(p.symbol, isBuy);
    await sendMessageWithOptionalGif(message, gifUrl, usdValue, p.symbol);
    console.log(`✅ Sent ${p.symbol} ${isBuy ? "BUY" : "SELL"} $${usdValue.toFixed(2)} | Amount: ${formatTokenAmount(tokenAmount)} [v2]`);
  }
}

async function checkWetnPoolV3(p, fromBlock, toBlock) {
  const pool = new ethers.Contract(p.pool, v3Abi, provider);
  const events = await pool.queryFilter("Swap", fromBlock, toBlock);
  const dec = tokenDecimals[p.symbol] || 18;

  for (const event of events) {
    const key = makeKey(event.transactionHash, event.logIndex);
    if (seenKeys.has(key)) continue;

    const amount0 = event.args[2];
    const amount1 = event.args[3];
    const wetnRaw = p.wetnIsToken0 ? amount0 : amount1;
    const tokenRaw = p.wetnIsToken0 ? amount1 : amount0;

    const isBuy = tokenRaw < 0n;
    let wetnAmount = Number(ethers.formatUnits(wetnRaw < 0n ? -wetnRaw : wetnRaw, 18));
    const tokenAmountFromSwap = Number(ethers.formatUnits(tokenRaw < 0n ? -tokenRaw : tokenRaw, dec));

    if (tokenAmountFromSwap < 0.000001 || wetnAmount < 0.000001) continue;

    const wallet = await getTraderWallet(event.transactionHash);
    if (!wallet) continue;

    const direction = isBuy ? "to" : "from";
    const genuine = await isGenuineLeg(event.transactionHash, wallet, p.token, direction);
    if (!genuine) {
      console.log(`⏭️ Skipped ${p.symbol} ${isBuy ? "BUY" : "SELL"} (intermediate hop) [v3]`);
      continue;
    }

    const receipt = await getReceipt(event.transactionHash);

    const flows = getTraderTokenFlows(receipt, wallet);
    const outs = flows.filter(f => f.direction === "out");
    const ins  = flows.filter(f => f.direction === "in");

    if (outs.length === 1 && ins.length === 1) {
      if (reclassifiedTxs.has(event.transactionHash)) {
        seenKeys.add(key);
        continue;
      }

      const outFlow = outs[0];
      const inFlow  = ins[0];
      const symbolIn  = outFlow.symbol;
      const amountIn  = outFlow.amount;
      const symbolOut = inFlow.symbol;
      const amountOut = inFlow.amount;

      reclassifiedTxs.add(event.transactionHash);
      seenKeys.add(key);

      const message = formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, event.transactionHash, wallet, p.pool);
      const gifUrl = pickCrossGif(symbolIn, symbolOut);
      await sendMessageWithOptionalGif(message, gifUrl, 0);
      console.log(`✅ Sent multi-hop ${symbolIn}→${symbolOut} (reclassified from ${p.symbol} WETN leg) [v3]`);
      continue;
    }

    const tokenAmount = getBetterTokenAmount(receipt, p.token, wallet, direction, dec, tokenAmountFromSwap);
    wetnAmount = getNetWetnAmount(receipt, isBuy, wetnAmount);
    const usdValue = wetnAmount * etnPriceUsd;
    const tokenUsdPrice = tokenAmount > 0 ? usdValue / tokenAmount : 0;

    let enrichment = null;
    try {
      enrichment = await getEnrichment(
        p.token, p.symbol, wallet, dec, tokenUsdPrice,
        tokenAmount, isBuy, receipt.blockNumber
      );
    } catch (e) {
      console.error("Enrichment failed (non-fatal):", e.message);
    }

    seenKeys.add(key);

    const message = formatWetnMessage(p.symbol, isBuy, wetnAmount, tokenAmount, event.transactionHash, wallet, p.pool, p.website, p.websiteLabel, enrichment);
    const gifUrl = pickWetnGif(p.symbol, isBuy);
    await sendMessageWithOptionalGif(message, gifUrl, usdValue, p.symbol);
    console.log(`✅ Sent ${p.symbol} ${isBuy ? "BUY" : "SELL"} $${usdValue.toFixed(2)} | Amount: ${formatTokenAmount(tokenAmount)} [v3]`);
  }
}

async function checkCrossPoolV2(p, fromBlock, toBlock) {
  const pool = new ethers.Contract(p.pool, v2Abi, provider);
  const events = await pool.queryFilter("Swap", fromBlock, toBlock);
  const decA = tokenDecimals[p.symbolA] || 18;
  const decB = tokenDecimals[p.symbolB] || 18;

  for (const event of events) {
    const key = makeKey(event.transactionHash, event.logIndex);
    if (seenKeys.has(key)) continue;

    if (reclassifiedTxs.has(event.transactionHash)) {
      seenKeys.add(key);
      continue;
    }

    const a0In = event.args[1], a1In = event.args[2], a0Out = event.args[3], a1Out = event.args[4];
    let symbolIn, symbolOut, amountIn, amountOut;
    if (p.aIsToken0) {
      if (a0In > 0n) {
        symbolIn = p.symbolA; symbolOut = p.symbolB;
        amountIn = Number(ethers.formatUnits(a0In, decA));
        amountOut = Number(ethers.formatUnits(a1Out, decB));
      } else {
        symbolIn = p.symbolB; symbolOut = p.symbolA;
        amountIn = Number(ethers.formatUnits(a1In, decB));
        amountOut = Number(ethers.formatUnits(a0Out, decA));
      }
    } else {
      if (a1In > 0n) {
        symbolIn = p.symbolA; symbolOut = p.symbolB;
        amountIn = Number(ethers.formatUnits(a1In, decA));
        amountOut = Number(ethers.formatUnits(a0Out, decB));
      } else {
        symbolIn = p.symbolB; symbolOut = p.symbolA;
        amountIn = Number(ethers.formatUnits(a0In, decB));
        amountOut = Number(ethers.formatUnits(a1Out, decA));
      }
    }

    if (amountIn < 0.000001 || amountOut < 0.000001) continue;

    const wallet = await getTraderWallet(event.transactionHash);
    if (!wallet) continue;

    const genuineIn = await isGenuineLeg(event.transactionHash, wallet, ADDR[symbolIn], "from");
    if (!genuineIn) continue;

    let usdValue = 0;
    if (STABLES.includes(symbolIn)) usdValue = amountIn;
    else if (STABLES.includes(symbolOut)) usdValue = amountOut;

    seenKeys.add(key);

    const message = formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, event.transactionHash, wallet, p.pool);
    const gifUrl = pickCrossGif(symbolIn, symbolOut);
    await sendMessageWithOptionalGif(message, gifUrl, usdValue);
    console.log(`✅ Sent cross ${symbolIn}→${symbolOut}`);
  }
}

async function checkCrossPoolV3(p, fromBlock, toBlock) {
  const pool = new ethers.Contract(p.pool, v3Abi, provider);
  const events = await pool.queryFilter("Swap", fromBlock, toBlock);
  const decA = tokenDecimals[p.symbolA] || 18;
  const decB = tokenDecimals[p.symbolB] || 18;

  for (const event of events) {
    const key = makeKey(event.transactionHash, event.logIndex);
    if (seenKeys.has(key)) continue;

    if (reclassifiedTxs.has(event.transactionHash)) {
      seenKeys.add(key);
      continue;
    }

    const amount0 = event.args[2];
    const amount1 = event.args[3];
    const aRaw = p.aIsToken0 ? amount0 : amount1;
    const bRaw = p.aIsToken0 ? amount1 : amount0;

    let symbolIn, symbolOut, amountIn, amountOut;
    if (aRaw > 0n) {
      symbolIn = p.symbolA; symbolOut = p.symbolB;
      amountIn = Number(ethers.formatUnits(aRaw, decA));
      amountOut = Number(ethers.formatUnits(bRaw < 0n ? -bRaw : bRaw, decB));
    } else {
      symbolIn = p.symbolB; symbolOut = p.symbolA;
      amountIn = Number(ethers.formatUnits(bRaw, decB));
      amountOut = Number(ethers.formatUnits(aRaw < 0n ? -aRaw : aRaw, decA));
    }

    if (amountIn < 0.000001 || amountOut < 0.000001) continue;

    const wallet = await getTraderWallet(event.transactionHash);
    if (!wallet) continue;

    const genuineIn = await isGenuineLeg(event.transactionHash, wallet, ADDR[symbolIn], "from");
    if (!genuineIn) continue;

    let usdValue = 0;
    if (STABLES.includes(symbolIn)) usdValue = amountIn;
    else if (STABLES.includes(symbolOut)) usdValue = amountOut;

    seenKeys.add(key);

    const message = formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, event.transactionHash, wallet, p.pool);
    const gifUrl = pickCrossGif(symbolIn, symbolOut);
    await sendMessageWithOptionalGif(message, gifUrl, usdValue);
    console.log(`✅ Sent cross ${symbolIn}→${symbolOut}`);
  }
}

async function checkAllSwaps() {
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = lastBlock ? lastBlock + 1 : currentBlock - 200;
    if (fromBlock > currentBlock) return;
    console.log(`Checking blocks ${fromBlock} to ${currentBlock}`);

    for (const p of wetnPools) {
      try {
        if (p.version === "v2") await checkWetnPoolV2(p, fromBlock, currentBlock);
        else await checkWetnPoolV3(p, fromBlock, currentBlock);
      } catch (e) {
        console.error(`Error ${p.symbol}:`, e.message);
      }
    }

    for (const p of crossPools) {
      try {
        if (p.version === "v2") await checkCrossPoolV2(p, fromBlock, currentBlock);
        else await checkCrossPoolV3(p, fromBlock, currentBlock);
      } catch (e) {
        console.error(`Error cross ${p.symbolA}/${p.symbolB}:`, e.message);
      }
    }

    lastBlock = currentBlock;
    if (seenKeys.size > 5000) seenKeys.clear();
    if (reclassifiedTxs.size > 2000) reclassifiedTxs.clear();
  } catch (e) {
    console.error("Check error:", e.message);
  }
}

async function start() {
  console.log("Bot starting...");
  console.log(`Watching ${wetnPools.length} WETN pools + ${crossPools.length} cross pools`);
  console.log(`Main group: ${CHAT_ID}`);
  console.log(`CLUB group: ${CLUB_GROUP_CHAT_ID} → LIVE TRADES topic (${LIVE_TRADES_TOPIC_ID})`);
  console.log(`  - WETN trades: ≥ $5 (CORE excluded)`);
  console.log(`  - TOKEN→TOKEN swaps: always sent to LIVE TRADES`);
  console.log(`Router: ${ROUTER_ADDRESS}`);
  console.log("Enrichment: historical Position (block-1) + Market Cap + Holders");
  console.log("ETN price: CoinGecko → CoinPaprika → previous valid price (never on-chain pool)");
  console.log("FUGAZI support: enabled (V2 pool)");
  await loadDecimals();
  await updatePrice();
  setInterval(updatePrice, 120000);
  setInterval(checkAllSwaps, 12000);
  await checkAllSwaps();
}

start();

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.writeHead(200); res.end("Bot is running"); }).listen(PORT);
