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

// Official Electroneum Name Service contracts
// Source: https://github.com/electroneum/ens-contracts/tree/staging/deployments/electroneum
const ENS_REGISTRY = "0x6f311f2212593165988dff84977e24c1005dbb85";
const ENS_REVERSE_REGISTRAR = "0xfbb14edbd8d3f6e7bb240bfa388f6582df0d8e7a";
const ENS_PUBLIC_RESOLVER = "0xdb4a3abb6703232e20a118a104e7f4ebb3e2738d";
const ENS_UNIVERSAL_RESOLVER = "0x75509153af7db00beecc30ec042299fd30e2cb6e";
const ENS_NAME_CACHE_TTL_MS = 45 * 1000;
const ENS_NONE_CACHE_TTL_MS = 45 * 1000;
const ENS_ERROR_CACHE_TTL_MS = 20 * 1000;
const ENS_RESOLVE_TIMEOUT_MS = 4000;
const ENS_ETN_COIN_TYPE = 0x80000000 + 52014;

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
const ensRegistryAbi = [
  "function resolver(bytes32 node) view returns (address)",
  "function owner(bytes32 node) view returns (address)"
];
const ensReverseRegistrarAbi = [
  "function node(address addr) pure returns (bytes32)"
];
const ensResolverAbi = [
  "function name(bytes32 node) view returns (string)",
  "function addr(bytes32 node) view returns (address)"
];
const ensUniversalResolverAbi = [
  "function reverse(bytes lookupAddress, uint256 coinType) view returns (string, address, address)",
  "function resolve(bytes name, bytes data) view returns (bytes result, address resolver)",
  "error ReverseAddressMismatch(string primary, bytes primaryAddress)"
];

let etnPriceUsd = 0.00071;
let lastBlock = null;
const tokenDecimals = {};
const seenKeys = new Set();
const reclassifiedTxs = new Set();
const walletNameCache = new Map();
const ensInFlight = new Set();

const supplyCache = new Map();
const holdersCache = new Map();
const SUPPLY_TTL = 3 * 60 * 1000;
const HOLDERS_TTL = 8 * 60 * 1000;

const ADDR_TO_SYMBOL = {};
for (const [sym, addr] of Object.entries(ADDR)) {
  ADDR_TO_SYMBOL[addr.toLowerCase()] = sym;
}

const WETN_POOL_BY_ADDR = {};
for (const p of wetnPools) WETN_POOL_BY_ADDR[p.pool.toLowerCase()] = p;
const CROSS_POOL_BY_ADDR = {};
for (const p of crossPools) CROSS_POOL_BY_ADDR[p.pool.toLowerCase()] = p;

const V2_SWAP_TOPIC = ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)");
const V3_SWAP_TOPIC = ethers.id("Swap(address,address,int256,int256,uint160,uint128,int24)");
const v2Iface = new ethers.Interface(v2Abi);
const v3Iface = new ethers.Interface(v3Abi);
const WETN_POOL_ADDRS = wetnPools.map((p) => p.pool);
const CROSS_POOL_ADDRS = crossPools.map((p) => p.pool);

const ensRegistry = new ethers.Contract(ENS_REGISTRY, ensRegistryAbi, provider);
const ensReverseRegistrar = new ethers.Contract(ENS_REVERSE_REGISTRAR, ensReverseRegistrarAbi, provider);
const ensUniversalResolver = new ethers.Contract(ENS_UNIVERSAL_RESOLVER, ensUniversalResolverAbi, provider);

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

function withTimeout(promise, ms) {
  let timer;
  const wrapped = Promise.resolve(promise).then(
    (value) => {
      clearTimeout(timer);
      return value;
    },
    (err) => {
      clearTimeout(timer);
      throw err;
    }
  );
  wrapped.catch(() => {});
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("ENS resolve timeout")), ms);
  });
  return Promise.race([wrapped, timeout]);
}

function cacheEtnName(walletLc, name, ttlMs = ENS_NAME_CACHE_TTL_MS) {
  walletNameCache.set(walletLc, { name, ts: Date.now(), ttlMs });
  if (walletNameCache.size > 5000) {
    const now = Date.now();
    for (const [k, v] of walletNameCache) {
      const ttl = v.ttlMs || ENS_NAME_CACHE_TTL_MS;
      if (now - v.ts > ttl) walletNameCache.delete(k);
    }
  }
}

function normalizeEtnName(name) {
  if (!name || typeof name !== "string") return null;
  const n = name.trim().toLowerCase();
  if (!n.endsWith(".etn")) return null;
  return n;
}

async function verifyForwardAddr(name, walletLc) {
  const fwdNode = ethers.namehash(name);
  try {
    const data = new ethers.Interface(["function addr(bytes32) view returns (address)"]).encodeFunctionData("addr", [fwdNode]);
    const [raw] = await ensUniversalResolver.resolve(ethers.dnsEncode(name), data);
    const [fwdAddr] = ethers.AbiCoder.defaultAbiCoder().decode(["address"], raw);
    console.log("[ENS DEBUG] UR forwardAddr", name, "=", fwdAddr);
    if (fwdAddr && fwdAddr !== ethers.ZeroAddress) {
      return fwdAddr.toLowerCase() === walletLc;
    }
  } catch (e) {
    console.log("[ENS DEBUG] UR forward resolve failed for", name, e.message);
  }

  const fwdResolverAddr = await ensRegistry.resolver(fwdNode);
  console.log("[ENS DEBUG] registry forwardResolver", name, "=", fwdResolverAddr);
  if (!fwdResolverAddr || fwdResolverAddr === ethers.ZeroAddress) return false;
  const fwdResolver = new ethers.Contract(fwdResolverAddr, ensResolverAbi, provider);
  const fwdAddr = await fwdResolver.addr(fwdNode);
  console.log("[ENS DEBUG] registry forwardAddr", name, "=", fwdAddr);
  if (!fwdAddr || fwdAddr === ethers.ZeroAddress) return false;
  return fwdAddr.toLowerCase() === walletLc;
}

function extractRevertData(err) {
  if (!err) return null;
  const candidates = [
    err.data,
    err.error && err.error.data,
    err.info && err.info.error && err.info.error.data,
    err.cause && err.cause.data,
    err.payload && err.payload.data,
    err.value
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("0x") && c.length >= 10) return c;
    if (c && typeof c === "object" && typeof c.data === "string" && c.data.startsWith("0x")) return c.data;
  }
  return null;
}

function decodeUniversalReverseName(err) {
  const data = extractRevertData(err);
  if (!data) return null;
  try {
    const decoded = ensUniversalResolver.interface.parseError(data);
    if (decoded && decoded.name === "ReverseAddressMismatch") {
      return normalizeEtnName(decoded.args[0]);
    }
  } catch (_) {}
  return null;
}

async function resolveViaUniversalResolver(walletLc) {
  const lookupBytes = ethers.getBytes(walletLc);
  for (const coinType of [ENS_ETN_COIN_TYPE, 60n]) {
    try {
      const result = await ensUniversalResolver.reverse(lookupBytes, coinType);
      const primary = normalizeEtnName(result[0]);
      console.log("[ENS DEBUG] UR reverse coinType", coinType.toString(), "verified primary candidate =", primary);
      if (primary && await verifyForwardAddr(primary, walletLc)) {
        console.log("[ENS DEBUG] using verified primary", primary);
        return primary;
      }
    } catch (e) {
      const mismatchName = decodeUniversalReverseName(e);
      console.log("[ENS DEBUG] UR reverse coinType", coinType.toString(), "mismatch candidate =", mismatchName, "err =", e.message);
      if (mismatchName && await verifyForwardAddr(mismatchName, walletLc)) {
        console.log("[ENS DEBUG] using ElectroSwap-compatible display name", mismatchName);
        return mismatchName;
      }
    }
  }
  return null;
}

async function resolveViaReverseRegistrar(walletLc) {
  const reverseNode = await ensReverseRegistrar.node(walletLc);
  console.log("[ENS DEBUG] reverseNode =", reverseNode);
  const resolverAddr = await ensRegistry.resolver(reverseNode);
  console.log("[ENS DEBUG] reverseResolver =", resolverAddr);
  if (!resolverAddr || resolverAddr === ethers.ZeroAddress) return null;

  const resolver = new ethers.Contract(resolverAddr, ensResolverAbi, provider);
  const primary = normalizeEtnName(await resolver.name(reverseNode));
  console.log("[ENS DEBUG] reverseName =", primary);
  if (!primary) return null;
  if (await verifyForwardAddr(primary, walletLc)) return primary;
  return null;
}

async function resolveEtnName(wallet) {
  if (!wallet) return null;
  const walletLc = wallet.toLowerCase();
  const cached = walletNameCache.get(walletLc);
  if (cached && Date.now() - cached.ts < (cached.ttlMs || ENS_NAME_CACHE_TTL_MS)) {
    return cached.name;
  }

  try {
    const name = await withTimeout((async () => {
      console.log("[ENS DEBUG] wallet =", walletLc);
      const fromUr = await resolveViaUniversalResolver(walletLc);
      if (fromUr) return fromUr;
      return resolveViaReverseRegistrar(walletLc);
    })(), ENS_RESOLVE_TIMEOUT_MS);

    if (name) cacheEtnName(walletLc, name, ENS_NAME_CACHE_TTL_MS);
    else cacheEtnName(walletLc, null, ENS_NONE_CACHE_TTL_MS);
    return name || null;
  } catch (e) {
    console.error("ENS resolve failed:", e.message);
    cacheEtnName(walletLc, null, ENS_ERROR_CACHE_TTL_MS);
    return null;
  }
}

function getCachedEtnName(wallet) {
  if (!wallet) return null;
  const walletLc = wallet.toLowerCase();
  const cached = walletNameCache.get(walletLc);
  if (cached && Date.now() - cached.ts < (cached.ttlMs || ENS_NAME_CACHE_TTL_MS)) {
    return cached.name || null;
  }
  return null;
}

function prefetchEtnName(wallet) {
  if (!wallet) return;
  const walletLc = wallet.toLowerCase();
  const cached = walletNameCache.get(walletLc);
  if (cached && Date.now() - cached.ts < (cached.ttlMs || ENS_NAME_CACHE_TTL_MS)) return;
  if (ensInFlight.has(walletLc)) return;
  ensInFlight.add(walletLc);
  resolveEtnName(wallet)
    .catch((e) => console.error("ENS prefetch failed:", e.message))
    .finally(() => ensInFlight.delete(walletLc));
}

async function getEtnNameForAlert(wallet) {
  if (!wallet) return null;
  const cached = getCachedEtnName(wallet);
  if (cached) return cached;
  try {
    return await resolveEtnName(wallet);
  } catch (e) {
    console.error("ENS alert lookup failed:", e.message);
    return null;
  }
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
  if (!receipt) return null;
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

function formatWalletField(roleLabel, wallet, etnName) {
  const { link, short } = walletLinkParts(wallet);
  if (etnName) {
    return "👤 *" + roleLabel + ":* [" + etnName + "](" + link + ")\n";
  }
  return "👤 *" + roleLabel + ":* [" + short + "](" + link + ")\n";
}

function formatWetnMessage(symbol, isBuy, wetnAmount, tokenAmount, txHash, wallet, poolAddress, website, websiteLabel, enrichment, etnName) {
  const usdValue = wetnAmount * etnPriceUsd;
  const tokenUsdPrice = enrichment?.tokenUsdPrice ?? (tokenAmount > 0 ? usdValue / tokenAmount : 0);
  const circles = buildCircles(isBuy, usdValue);
  const label = isBuy ? "BUY" : "SELL";
  const roleLabel = isBuy ? "Buyer" : "Seller";
  const txLink = "https://blockexplorer.electroneum.com/tx/" + txHash;
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
  msg += formatWalletField(roleLabel, wallet, etnName);
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

function formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, txHash, wallet, poolAddress, etnName) {
  const txLink = "https://blockexplorer.electroneum.com/tx/" + txHash;
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
    formatWalletField("Trader", wallet, etnName) +
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
    } catch (e) {
      throw new Error("Telegram main send failed: " + (e.message || err.message));
    }
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

function claimSeen(key) {
  if (seenKeys.has(key)) return false;
  seenKeys.add(key);
  return true;
}

function releaseSeen(key) {
  seenKeys.delete(key);
}

function claimReclassified(txHash) {
  if (reclassifiedTxs.has(txHash)) return false;
  reclassifiedTxs.add(txHash);
  return true;
}

function releaseReclassified(txHash) {
  reclassifiedTxs.delete(txHash);
}

function failRetryableEvent(key, reason, txHash = null, reclassClaimed = false) {
  releaseSeen(key);
  if (reclassClaimed && txHash) releaseReclassified(txHash);
  throw new Error(reason);
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

async function fetchSwapLogsPerPool(addresses, fromBlock, toBlock) {
  const out = [];
  let failed = 0;
  for (const addr of addresses) {
    const cfg = WETN_POOL_BY_ADDR[addr.toLowerCase()] || CROSS_POOL_BY_ADDR[addr.toLowerCase()];
    if (!cfg) continue;
    try {
      const abi = cfg.version === "v2" ? v2Abi : v3Abi;
      const c = new ethers.Contract(addr, abi, provider);
      const events = await c.queryFilter("Swap", fromBlock, toBlock);
      for (const ev of events) {
        out.push({
          address: addr,
          transactionHash: ev.transactionHash,
          index: ev.index != null ? ev.index : ev.logIndex,
          topics: ev.topics,
          data: ev.data
        });
      }
    } catch (e) {
      failed += 1;
      console.error(`queryFilter fallback failed ${addr.slice(0, 10)}:`, e.message);
    }
  }
  return { logs: out, ok: failed === 0, failed };
}

async function fetchSwapLogs(addresses, fromBlock, toBlock) {
  try {
    const logs = await provider.getLogs({
      address: addresses,
      topics: [[V2_SWAP_TOPIC, V3_SWAP_TOPIC]],
      fromBlock,
      toBlock
    });
    return { logs, ok: true, failed: 0 };
  } catch (e) {
    console.error("Batched getLogs failed, using per-pool fallback:", e.message);
    return fetchSwapLogsPerPool(addresses, fromBlock, toBlock);
  }
}

function decodeSwapLog(log) {
  const topic = (log.topics && log.topics[0])
    ? log.topics[0].toLowerCase()
    : "";

  try {
    if (topic === V2_SWAP_TOPIC.toLowerCase()) {
      const parsed = v2Iface.parseLog(log);
      return {
        transactionHash: log.transactionHash,
        logIndex: log.index != null ? log.index : log.logIndex,
        args: parsed.args,
        version: "v2"
      };
    }

    if (topic === V3_SWAP_TOPIC.toLowerCase()) {
      const parsed = v3Iface.parseLog(log);
      return {
        transactionHash: log.transactionHash,
        logIndex: log.index != null ? log.index : log.logIndex,
        args: parsed.args,
        version: "v3"
      };
    }

    throw new Error(`Unknown Swap topic ${topic}`);
  } catch (e) {
    throw new Error(
      `decodeSwapLog failed for ${log.transactionHash || "unknown tx"}: ${e.message}`
    );
  }
}

async function processWetnV2Event(p, event) {
  const dec = tokenDecimals[p.symbol] || 18;
    const key = makeKey(event.transactionHash, event.logIndex);
    if (!claimSeen(key)) return;

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

    if (tokenAmountFromSwap < 0.000001 || wetnAmount < 0.000001) return;

    const wallet = await getTraderWallet(event.transactionHash);
    if (!wallet) failRetryableEvent(key, "receipt/wallet unavailable " + event.transactionHash.slice(0, 10));

    const direction = isBuy ? "to" : "from";
    const genuine = await isGenuineLeg(event.transactionHash, wallet, p.token, direction);
    if (genuine == null) failRetryableEvent(key, "genuine-leg receipt unavailable " + event.transactionHash.slice(0, 10));
    if (!genuine) {
      console.log(`⏭️ Skipped ${p.symbol} ${isBuy ? "BUY" : "SELL"} (intermediate hop) [v2]`);
      return;
    }

    const receipt = await getReceipt(event.transactionHash);
    if (!receipt) failRetryableEvent(key, "receipt unavailable " + event.transactionHash.slice(0, 10));

    const flows = getTraderTokenFlows(receipt, wallet);
    const outs = flows.filter(f => f.direction === "out");
    const ins  = flows.filter(f => f.direction === "in");

    if (outs.length === 1 && ins.length === 1) {
      if (!claimReclassified(event.transactionHash)) return;

      const outFlow = outs[0];
      const inFlow  = ins[0];
      const symbolIn  = outFlow.symbol;
      const amountIn  = outFlow.amount;
      const symbolOut = inFlow.symbol;
      const amountOut = inFlow.amount;

      const etnName = await getEtnNameForAlert(wallet);
      prefetchEtnName(wallet);
      const message = formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, event.transactionHash, wallet, p.pool, etnName);
      const gifUrl = pickCrossGif(symbolIn, symbolOut);
      try {
        await sendMessageWithOptionalGif(message, gifUrl, 0);
      } catch (e) {
        failRetryableEvent(key, e.message, event.transactionHash, true);
      }
      console.log(`✅ Sent multi-hop ${symbolIn}→${symbolOut} (reclassified from ${p.symbol} WETN leg) [v2]`);
      return;
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

    const etnName = await getEtnNameForAlert(wallet);
    prefetchEtnName(wallet);
    const message = formatWetnMessage(p.symbol, isBuy, wetnAmount, tokenAmount, event.transactionHash, wallet, p.pool, p.website, p.websiteLabel, enrichment, etnName);
    const gifUrl = pickWetnGif(p.symbol, isBuy);
    try {
      await sendMessageWithOptionalGif(message, gifUrl, usdValue, p.symbol);
    } catch (e) {
      failRetryableEvent(key, e.message);
    }
    console.log(`✅ Sent ${p.symbol} ${isBuy ? "BUY" : "SELL"} $${usdValue.toFixed(2)} | Amount: ${formatTokenAmount(tokenAmount)} [v2]`);
}

async function processWetnV3Event(p, event) {
  const dec = tokenDecimals[p.symbol] || 18;
    const key = makeKey(event.transactionHash, event.logIndex);
    if (!claimSeen(key)) return;

    const amount0 = event.args[2];
    const amount1 = event.args[3];
    const wetnRaw = p.wetnIsToken0 ? amount0 : amount1;
    const tokenRaw = p.wetnIsToken0 ? amount1 : amount0;

    const isBuy = tokenRaw < 0n;
    let wetnAmount = Number(ethers.formatUnits(wetnRaw < 0n ? -wetnRaw : wetnRaw, 18));
    const tokenAmountFromSwap = Number(ethers.formatUnits(tokenRaw < 0n ? -tokenRaw : tokenRaw, dec));

    if (tokenAmountFromSwap < 0.000001 || wetnAmount < 0.000001) return;

    const wallet = await getTraderWallet(event.transactionHash);
    if (!wallet) failRetryableEvent(key, "receipt/wallet unavailable " + event.transactionHash.slice(0, 10));

    const direction = isBuy ? "to" : "from";
    const genuine = await isGenuineLeg(event.transactionHash, wallet, p.token, direction);
    if (genuine == null) failRetryableEvent(key, "genuine-leg receipt unavailable " + event.transactionHash.slice(0, 10));
    if (!genuine) {
      console.log(`⏭️ Skipped ${p.symbol} ${isBuy ? "BUY" : "SELL"} (intermediate hop) [v3]`);
      return;
    }

    const receipt = await getReceipt(event.transactionHash);
    if (!receipt) failRetryableEvent(key, "receipt unavailable " + event.transactionHash.slice(0, 10));

    const flows = getTraderTokenFlows(receipt, wallet);
    const outs = flows.filter(f => f.direction === "out");
    const ins  = flows.filter(f => f.direction === "in");

    if (outs.length === 1 && ins.length === 1) {
      if (!claimReclassified(event.transactionHash)) return;

      const outFlow = outs[0];
      const inFlow  = ins[0];
      const symbolIn  = outFlow.symbol;
      const amountIn  = outFlow.amount;
      const symbolOut = inFlow.symbol;
      const amountOut = inFlow.amount;

      const etnName = await getEtnNameForAlert(wallet);
      prefetchEtnName(wallet);
      const message = formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, event.transactionHash, wallet, p.pool, etnName);
      const gifUrl = pickCrossGif(symbolIn, symbolOut);
      try {
        await sendMessageWithOptionalGif(message, gifUrl, 0);
      } catch (e) {
        failRetryableEvent(key, e.message, event.transactionHash, true);
      }
      console.log(`✅ Sent multi-hop ${symbolIn}→${symbolOut} (reclassified from ${p.symbol} WETN leg) [v3]`);
      return;
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

    const etnName = await getEtnNameForAlert(wallet);
    prefetchEtnName(wallet);
    const message = formatWetnMessage(p.symbol, isBuy, wetnAmount, tokenAmount, event.transactionHash, wallet, p.pool, p.website, p.websiteLabel, enrichment, etnName);
    const gifUrl = pickWetnGif(p.symbol, isBuy);
    try {
      await sendMessageWithOptionalGif(message, gifUrl, usdValue, p.symbol);
    } catch (e) {
      failRetryableEvent(key, e.message);
    }
    console.log(`✅ Sent ${p.symbol} ${isBuy ? "BUY" : "SELL"} $${usdValue.toFixed(2)} | Amount: ${formatTokenAmount(tokenAmount)} [v3]`);
}

async function processCrossV2Event(p, event) {
  const decA = tokenDecimals[p.symbolA] || 18;
  const decB = tokenDecimals[p.symbolB] || 18;
    const key = makeKey(event.transactionHash, event.logIndex);
    if (!claimSeen(key)) return;

    if (reclassifiedTxs.has(event.transactionHash)) return;

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

    if (amountIn < 0.000001 || amountOut < 0.000001) return;

    const wallet = await getTraderWallet(event.transactionHash);
    if (!wallet) failRetryableEvent(key, "receipt/wallet unavailable " + event.transactionHash.slice(0, 10));

    const genuineIn = await isGenuineLeg(event.transactionHash, wallet, ADDR[symbolIn], "from");
    if (genuineIn == null) failRetryableEvent(key, "genuine-leg receipt unavailable " + event.transactionHash.slice(0, 10));
    if (!genuineIn) return;

    let usdValue = 0;
    if (STABLES.includes(symbolIn)) usdValue = amountIn;
    else if (STABLES.includes(symbolOut)) usdValue = amountOut;

    seenKeys.add(key);

    const etnName = await getEtnNameForAlert(wallet);
    prefetchEtnName(wallet);
    const message = formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, event.transactionHash, wallet, p.pool, etnName);
    const gifUrl = pickCrossGif(symbolIn, symbolOut);
    try {
      await sendMessageWithOptionalGif(message, gifUrl, usdValue);
    } catch (e) {
      failRetryableEvent(key, e.message);
    }
    console.log(`✅ Sent cross ${symbolIn}→${symbolOut}`);
}

async function processCrossV3Event(p, event) {
  const decA = tokenDecimals[p.symbolA] || 18;
  const decB = tokenDecimals[p.symbolB] || 18;
    const key = makeKey(event.transactionHash, event.logIndex);
    if (!claimSeen(key)) return;

    if (reclassifiedTxs.has(event.transactionHash)) return;

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

    if (amountIn < 0.000001 || amountOut < 0.000001) return;

    const wallet = await getTraderWallet(event.transactionHash);
    if (!wallet) failRetryableEvent(key, "receipt/wallet unavailable " + event.transactionHash.slice(0, 10));

    const genuineIn = await isGenuineLeg(event.transactionHash, wallet, ADDR[symbolIn], "from");
    if (genuineIn == null) failRetryableEvent(key, "genuine-leg receipt unavailable " + event.transactionHash.slice(0, 10));
    if (!genuineIn) return;

    let usdValue = 0;
    if (STABLES.includes(symbolIn)) usdValue = amountIn;
    else if (STABLES.includes(symbolOut)) usdValue = amountOut;

    seenKeys.add(key);

    const etnName = await getEtnNameForAlert(wallet);
    prefetchEtnName(wallet);
    const message = formatCrossMessage(symbolIn, amountIn, symbolOut, amountOut, event.transactionHash, wallet, p.pool, etnName);
    const gifUrl = pickCrossGif(symbolIn, symbolOut);
    try {
      await sendMessageWithOptionalGif(message, gifUrl, usdValue);
    } catch (e) {
      failRetryableEvent(key, e.message);
    }
    console.log(`✅ Sent cross ${symbolIn}→${symbolOut}`);
}

const POLL_HEAD_MS = 1500;
const SCAN_RETRY_MS = 2000;
const STARTUP_LOOKBACK_BLOCKS = 200;
let latestHead = null;
let schedulerRunning = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processDecodedWetn(log) {
  const p = WETN_POOL_BY_ADDR[log.address.toLowerCase()];
  if (!p) return;
  const event = decodeSwapLog(log);
  try {
    if (event.version === "v2") await processWetnV2Event(p, event);
    else await processWetnV3Event(p, event);
  } catch (e) {
    console.error(`Error ${p.symbol}:`, e.message);
    throw e;
  }
}

async function processDecodedCross(log) {
  const p = CROSS_POOL_BY_ADDR[log.address.toLowerCase()];
  if (!p) return;
  const event = decodeSwapLog(log);
  try {
    if (event.version === "v2") await processCrossV2Event(p, event);
    else await processCrossV3Event(p, event);
  } catch (e) {
    console.error(`Error cross ${p.symbolA}/${p.symbolB}:`, e.message);
    throw e;
  }
}

async function scanRange(fromBlock, toBlock) {
  const t0 = Date.now();
  console.log(`Checking blocks ${fromBlock} to ${toBlock}`);
  console.log(`[PERF] block=${toBlock} range=${fromBlock}-${toBlock} lag=${toBlock - fromBlock}`);

  const twq = Date.now();
  const wetnFetch = await fetchSwapLogs(WETN_POOL_ADDRS, fromBlock, toBlock);
  const wetnLogs = wetnFetch.logs || [];
  const wetnQueryMs = Date.now() - twq;

  const twp = Date.now();
  for (const log of wetnLogs) {
    await processDecodedWetn(log);
  }
  const wetnProcessMs = Date.now() - twp;

  const tcq = Date.now();
  const crossFetch = await fetchSwapLogs(CROSS_POOL_ADDRS, fromBlock, toBlock);
  const crossLogs = crossFetch.logs || [];
  const crossQueryMs = Date.now() - tcq;

  const tcp = Date.now();
  for (const log of crossLogs) {
    await processDecodedCross(log);
  }
  const crossProcessMs = Date.now() - tcp;

  if (seenKeys.size > 5000) seenKeys.clear();
  if (reclassifiedTxs.size > 2000) reclassifiedTxs.clear();

  console.log(
    `[PERF] checkAllSwaps=${Date.now() - t0}ms ` +
    `wetnQuery=${wetnQueryMs}ms wetnEvents=${wetnLogs.length} wetnProcess=${wetnProcessMs}ms ` +
    `crossQuery=${crossQueryMs}ms crossEvents=${crossLogs.length} crossProcess=${crossProcessMs}ms ` +
    `pools=${wetnPools.length + crossPools.length}` +
    ((!wetnFetch.ok || !crossFetch.ok) ? ` incomplete=1 wetnFail=${wetnFetch.failed || 0} crossFail=${crossFetch.failed || 0}` : "")
  );

  if (!wetnFetch.ok || !crossFetch.ok) {
    throw new Error(
      `incomplete log fetch wetnFail=${wetnFetch.failed || 0} crossFail=${crossFetch.failed || 0}`
    );
  }
}

async function runSchedulerLoop() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  try {
    while (true) {
      let head;
      try {
        head = await provider.getBlockNumber();
        latestHead = head;
      } catch (e) {
        console.error("Head refresh failed:", e.message);
        await sleep(POLL_HEAD_MS);
        continue;
      }
      const fromBlock = lastBlock != null ? lastBlock + 1 : head - STARTUP_LOOKBACK_BLOCKS;
      if (fromBlock > head) {
        await sleep(POLL_HEAD_MS);
        continue;
      }
      try {
        await scanRange(fromBlock, head);
        lastBlock = head;
      } catch (e) {
        console.error("Check error:", e.message);
        console.log(`[PERF] scan failed; lastBlock stays ${lastBlock}; retry in ${SCAN_RETRY_MS}ms`);
        await sleep(SCAN_RETRY_MS);
      }
    }
  } finally {
    schedulerRunning = false;
  }
}

function scheduleTick() {
  runSchedulerLoop().catch((e) => console.error("Scheduler error:", e.message));
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
  console.log("ENS: verified primary, else UR ReverseAddressMismatch name if forward addr matches wallet");
  console.log("Phase B scheduler: 1.5s head poll + sequential catch-up + batched getLogs");
  await loadDecimals();
  await updatePrice();
  setInterval(updatePrice, 120000);
  setInterval(scheduleTick, POLL_HEAD_MS);
  await runSchedulerLoop();
}


start();

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.writeHead(200); res.end("Bot is running"); }).listen(PORT);
