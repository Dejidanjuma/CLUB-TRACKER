import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../bot.js", import.meta.url), "utf8");

test("monitor is pinned to Electroneum and the configured wallet", () => {
  assert.match(source, /chainId: 52014/);
  assert.match(source, /const DEPOSIT_WALLET = "0x210D9A9b9173E0691ac89D32B4EB9600464FeDEB"/);
  assert.match(source, /USDT: "0x48E722f1458b253c2FB0E573F939318D7Dbd54e7"/);
  assert.match(source, /USDC: "0x3187deAd7A2Bd6770F5Fe81495D1B715926AAe6e"/);
});

test("Supabase requests support both modern secret and legacy service-role keys", () => {
  assert.match(source, /apikey: SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /if \(!SUPABASE_SERVICE_ROLE_KEY\.startsWith\("sb_secret_"\)\)/);
  assert.match(source, /headers\\.Authorization = `Bearer \\$\\{SUPABASE_SERVICE_ROLE_KEY\\}`/);
});

test("scan only queries transfers to the configured recipient", () => {
  assert.match(source, /topics: \[DEPOSIT_TRANSFER_TOPIC, null, recipientTopic\]/);
  assert.match(source, /if \(to\.toLowerCase\(\) !== DEPOSIT_WALLET\.toLowerCase\(\)\) continue/);
});

test("only successful transaction receipts can become deposit records", () => {
  assert.match(source, /if \(!receipt\) throw new Error/);
  assert.match(source, /if \(Number\(receipt\.status\) !== 1\) continue/);
});

test("deposit records are idempotent by chain, transaction and log index", () => {
  assert.match(source, /on_conflict=chain_id,transaction_hash,log_index/);
  assert.match(source, /resolution=ignore-duplicates,return=representation/);
});

test("alerts are durably claimed and terminal states suppress duplicates", () => {
  assert.match(source, /stored\.alert_status === "sent" \|\| stored\.alert_status === "uncertain" \|\| stored\.alert_status === "sending"/);
  assert.match(source, /alert_status: "sending"/);
  assert.match(source, /alert_status: "sent"/);
  assert.match(source, /alert_status: "uncertain"/);
});

test("deposit alerts use the configured Hyper group and never a topic thread", () => {
  assert.match(source, /HYPER_TRANSACTION_CHAT_ID = process\.env\.HYPER_TRANSACTION_CHAT_ID \|\| CHAT_ID/);
  assert.match(source, /sendTelegramPayload\(HYPER_TRANSACTION_CHAT_ID, message, null\)/);
});

test("first activation establishes a current-head baseline and cursor advances only after scan", () => {
  assert.match(source, /stablecoinLastBlock = head;[\s\S]*?persistStablecoinCheckpoint\(head \+ 1\)/);
  assert.match(source, /await scanStablecoinDeposits\(fromBlock, toBlock\);[\s\S]*?await persistStablecoinCheckpoint\(toBlock \+ 1\);[\s\S]*?stablecoinLastBlock = toBlock/);
});
