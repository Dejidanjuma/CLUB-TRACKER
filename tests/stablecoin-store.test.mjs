import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { StablecoinStore } = require("../stablecoin-store.js");

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "club-tracker-sqlite-"));
  const dbPath = path.join(dir, "state.sqlite");
  return { dir, dbPath, store: new StablecoinStore(dbPath) };
}

const record = {
  chain_id: 52014,
  transaction_hash: "0x" + "a".repeat(64),
  log_index: 3,
  block_number: 17000000,
  block_timestamp: "2026-11-17T20:00:00.000Z",
  token_symbol: "USDC",
  token_address: "0x3187deAd7A2Bd6770F5Fe81495D1B715926AAe6e",
  from_address: "0x1111111111111111111111111111111111111111",
  to_address: "0x210D9A9b9173E0691ac89D32B4EB9600464FeDEB",
  raw_amount: "2202000000",
  token_decimals: 6,
  receipt_status: 1,
  telegram_chat_id: "-1001234567890"
};

test("checkpoint survives database close and reopen", () => {
  const f = fixture();
  f.store.saveCheckpoint({ monitorKey: "electroneum:52014:test", chainId: 52014, walletAddress: record.to_address, nextBlock: 17000001 });
  f.store.close();
  const reopened = new StablecoinStore(f.dbPath);
  assert.equal(reopened.getCheckpoint("electroneum:52014:test"), 17000001);
  reopened.close();
  fs.rmSync(f.dir, { recursive: true, force: true });
});

test("deposit identity is idempotent by chain, transaction hash and log index", () => {
  const f = fixture();
  assert.equal(f.store.insertDeposit(record).inserted, true);
  assert.equal(f.store.insertDeposit(record).inserted, false);
  f.store.close();
  fs.rmSync(f.dir, { recursive: true, force: true });
});

test("sending, sent and uncertain statuses persist across restart", () => {
  const f = fixture();
  f.store.insertDeposit(record);
  f.store.updateDeposit(record.transaction_hash, record.log_index, { alert_status: "sending" });
  f.store.close();
  const reopened = new StablecoinStore(f.dbPath);
  assert.equal(reopened.insertDeposit(record).alert_status, "sending");
  reopened.updateDeposit(record.transaction_hash, record.log_index, {
    alert_status: "uncertain",
    alert_error: "delivery outcome uncertain"
  });
  reopened.close();
  const finalStore = new StablecoinStore(f.dbPath);
  assert.equal(finalStore.insertDeposit(record).alert_status, "uncertain");
  finalStore.close();
  fs.rmSync(f.dir, { recursive: true, force: true });
});

test("replay reservation is at-most-once across restarts", () => {
  const f = fixture();
  const args = {
    transactionHash: record.transaction_hash,
    chainId: 52014,
    tokenSymbol: "USDC",
    amount: "2202.00",
    destination: "WALLET_INTELLIGENCE"
  };
  assert.equal(f.store.reserveReplay(args), true);
  f.store.close();
  const reopened = new StablecoinStore(f.dbPath);
  assert.equal(reopened.reserveReplay(args), false);
  reopened.finishReplay(record.transaction_hash, {
    status: "sent",
    completedAt: new Date().toISOString(),
    telegramChatId: "-1001234567890",
    resultNote: "Telegram confirmed"
  });
  reopened.close();
  fs.rmSync(f.dir, { recursive: true, force: true });
});

test("invalid checkpoints and unapproved update fields are rejected", () => {
  const f = fixture();
  assert.throws(() => f.store.saveCheckpoint({
    monitorKey: "bad", chainId: 52014, walletAddress: record.to_address, nextBlock: 0
  }));
  assert.throws(() => f.store.updateDeposit(record.transaction_hash, record.log_index, { block_number: 1 }));
  f.store.close();
  fs.rmSync(f.dir, { recursive: true, force: true });
});
