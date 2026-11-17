const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_DB_PATH = process.env.STABLECOIN_DB_PATH || "/var/lib/club-tracker/club-tracker.sqlite";

class StablecoinStore {
  constructor(dbPath = DEFAULT_DB_PATH) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scan_checkpoints (
        monitor_key TEXT PRIMARY KEY,
        chain_id INTEGER NOT NULL,
        wallet_address TEXT NOT NULL,
        next_block INTEGER NOT NULL CHECK (next_block > 0),
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS stablecoin_deposits (
        chain_id INTEGER NOT NULL,
        transaction_hash TEXT NOT NULL,
        log_index INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        block_timestamp TEXT,
        token_symbol TEXT NOT NULL CHECK (token_symbol IN ('USDT','USDC')),
        token_address TEXT NOT NULL,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        raw_amount TEXT NOT NULL,
        token_decimals INTEGER NOT NULL,
        receipt_status INTEGER NOT NULL CHECK (receipt_status = 1),
        telegram_chat_id TEXT NOT NULL,
        alert_status TEXT NOT NULL DEFAULT 'pending'
          CHECK (alert_status IN ('pending','sending','sent','uncertain','failed')),
        telegram_sent_at TEXT,
        telegram_message_id TEXT,
        alert_error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (chain_id, transaction_hash, log_index)
      );
      CREATE INDEX IF NOT EXISTS stablecoin_deposits_status_idx
        ON stablecoin_deposits(alert_status);
      CREATE TABLE IF NOT EXISTS replay_attempts (
        transaction_hash TEXT PRIMARY KEY,
        chain_id INTEGER NOT NULL,
        token_symbol TEXT NOT NULL CHECK (token_symbol IN ('USDC','USDT')),
        amount TEXT NOT NULL,
        destination TEXT NOT NULL CHECK (destination = 'WALLET_INTELLIGENCE'),
        status TEXT NOT NULL CHECK (status IN ('attempted','sent','uncertain','failed')),
        attempted_at TEXT NOT NULL,
        completed_at TEXT,
        telegram_chat_id TEXT,
        result_note TEXT
      );
    `);
  }

  getCheckpoint(monitorKey) {
    const row = this.db.prepare("SELECT next_block FROM scan_checkpoints WHERE monitor_key = ?").get(monitorKey);
    return row ? Number(row.next_block) : null;
  }

  saveCheckpoint({ monitorKey, chainId, walletAddress, nextBlock }) {
    if (!Number.isSafeInteger(nextBlock) || nextBlock < 1) throw new Error("Invalid next_block checkpoint");
    this.db.prepare(`
      INSERT INTO scan_checkpoints (monitor_key, chain_id, wallet_address, next_block, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(monitor_key) DO UPDATE SET
        chain_id=excluded.chain_id, wallet_address=excluded.wallet_address,
        next_block=excluded.next_block, updated_at=excluded.updated_at
    `).run(monitorKey, chainId, walletAddress.toLowerCase(), nextBlock, new Date().toISOString());
  }

  insertDeposit(record) {
    const result = this.db.prepare(`
      INSERT OR IGNORE INTO stablecoin_deposits (
        chain_id, transaction_hash, log_index, block_number, block_timestamp,
        token_symbol, token_address, from_address, to_address, raw_amount,
        token_decimals, receipt_status, telegram_chat_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.chain_id, record.transaction_hash.toLowerCase(), record.log_index,
      record.block_number, record.block_timestamp, record.token_symbol,
      record.token_address.toLowerCase(), record.from_address.toLowerCase(),
      record.to_address.toLowerCase(), record.raw_amount, record.token_decimals,
      record.receipt_status, String(record.telegram_chat_id)
    );
    const row = this.db.prepare(`
      SELECT alert_status, telegram_message_id FROM stablecoin_deposits
      WHERE chain_id = ? AND transaction_hash = ? AND log_index = ?
    `).get(record.chain_id, record.transaction_hash.toLowerCase(), record.log_index);
    return { inserted: Number(result.changes) === 1, ...row };
  }

  updateDeposit(txHash, logIndex, patch) {
    const allowed = new Set(["alert_status", "telegram_sent_at", "telegram_message_id", "alert_error"]);
    const entries = Object.entries(patch).filter(([key]) => allowed.has(key));
    if (!entries.length) throw new Error("No permitted deposit fields to update");
    const assignments = entries.map(([key]) => key + " = ?").join(", ");
    const values = entries.map(([, value]) => value);
    this.db.prepare(`UPDATE stablecoin_deposits SET ${assignments}, updated_at = ? WHERE chain_id = 52014 AND transaction_hash = ? AND log_index = ?`)
      .run(...values, new Date().toISOString(), txHash.toLowerCase(), logIndex);
  }

  reserveReplay({ transactionHash, chainId, tokenSymbol, amount, destination }) {
    const result = this.db.prepare(`
      INSERT OR IGNORE INTO replay_attempts
        (transaction_hash, chain_id, token_symbol, amount, destination, status, attempted_at)
      VALUES (?, ?, ?, ?, ?, 'attempted', ?)
    `).run(transactionHash.toLowerCase(), chainId, tokenSymbol, String(amount), destination, new Date().toISOString());
    return Number(result.changes) === 1;
  }

  finishReplay(transactionHash, { status, completedAt, telegramChatId, resultNote }) {
    this.db.prepare(`
      UPDATE replay_attempts SET status=?, completed_at=?, telegram_chat_id=?, result_note=?
      WHERE transaction_hash=?
    `).run(status, completedAt, telegramChatId == null ? null : String(telegramChatId), resultNote, transactionHash.toLowerCase());
  }

  close() {
    this.db.close();
  }
}

module.exports = { StablecoinStore, DEFAULT_DB_PATH };
