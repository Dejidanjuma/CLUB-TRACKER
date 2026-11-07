create table if not exists public.club_stablecoin_replay_attempts (
  transaction_hash text primary key,
  chain_id bigint not null,
  token_symbol text not null check (token_symbol in ('USDC', 'USDT')),
  amount numeric(38, 18) not null check (amount > 0),
  destination text not null check (destination = 'WALLET_INTELLIGENCE'),
  status text not null check (status in ('attempted', 'sent', 'uncertain', 'failed')),
  attempted_at timestamptz not null default now(),
  completed_at timestamptz,
  telegram_chat_id text,
  result_note text
);

alter table public.club_stablecoin_replay_attempts enable row level security;

comment on table public.club_stablecoin_replay_attempts is
  'At-most-once audit ledger for explicitly authorized historical stablecoin Telegram replays. Does not modify deposit rows or scan checkpoints.';