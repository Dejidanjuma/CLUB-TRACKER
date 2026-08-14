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
  CORE: "0x309B916b3A90cb3E071697Ea9680e9217A30066f"
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
  { symbol: "CORE", token: ADDR.CORE, pool: "0xF0539385BD7057c81925382d1e74108Fc5c31bbC", version: "v3", wetnIsToken0: true }
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

let etnPriceUsd = 0.00025;
let lastBlock = null;
const tokenDecimals = {};
const seenKeys = new Set();

const supplyCache = new Map();
const holdersCache = new Map();
const SUPPLY_TTL = 3 * 60 * 1000;
const HOLDERS_TTL = 8 * 60 * 1000;

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
  if (cached &&
