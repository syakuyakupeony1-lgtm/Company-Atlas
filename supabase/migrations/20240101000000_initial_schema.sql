-- ============================================================
-- Company Atlas — Initial Schema
-- Section 4 of design document
-- ============================================================

-- ─── Market master ───────────────────────────────────────────
create table markets (
  code        text primary key,
  label_ja    text not null,
  label_en    text not null,
  sort_order  smallint not null
);

insert into markets (code, label_ja, label_en, sort_order) values
  ('prime',    'プライム',          'Prime',    1),
  ('standard', 'スタンダード',      'Standard', 2),
  ('growth',   'グロース',          'Growth',   3),
  ('pro',      'TOKYO PRO Market',  'Pro',      4);

-- ─── 33-sector master ────────────────────────────────────────
create table sectors (
  code      text primary key,
  label_ja  text not null,
  label_en  text
);

insert into sectors (code, label_ja, label_en) values
  ('0050', '水産・農林業',         'Fishery, Agriculture & Forestry'),
  ('1050', '鉱業',                 'Mining'),
  ('2050', '建設業',               'Construction'),
  ('3050', '食料品',               'Foods'),
  ('3100', '繊維製品',             'Textiles & Apparel'),
  ('3150', 'パルプ・紙',           'Pulp & Paper'),
  ('3200', '化学',                 'Chemicals'),
  ('3250', '医薬品',               'Pharmaceutical'),
  ('3300', '石油・石炭製品',       'Oil & Coal Products'),
  ('3350', 'ゴム製品',             'Rubber Products'),
  ('3400', 'ガラス・土石製品',     'Glass & Ceramics Products'),
  ('3450', '鉄鋼',                 'Iron & Steel'),
  ('3500', '非鉄金属',             'Nonferrous Metals'),
  ('3550', '金属製品',             'Metal Products'),
  ('3600', '機械',                 'Machinery'),
  ('3650', '電気機器',             'Electric Appliances'),
  ('3700', '輸送用機器',           'Transportation Equipment'),
  ('3750', '精密機器',             'Precision Instruments'),
  ('3800', 'その他製品',           'Other Products'),
  ('4050', '電気・ガス業',         'Electric Power & Gas'),
  ('5050', '陸運業',               'Land Transportation'),
  ('5100', '海運業',               'Marine Transportation'),
  ('5150', '空運業',               'Air Transportation'),
  ('5200', '倉庫・運輸関連業',     'Warehousing & Harbor Transportation'),
  ('5250', '情報・通信業',         'Information & Communication'),
  ('6050', '卸売業',               'Wholesale Trade'),
  ('6100', '小売業',               'Retail Trade'),
  ('7050', '銀行業',               'Banks'),
  ('7100', '証券、商品先物取引業', 'Securities & Commodity Futures'),
  ('7150', '保険業',               'Insurance'),
  ('7200', 'その他金融業',         'Other Financing Business'),
  ('8050', '不動産業',             'Real Estate'),
  ('9050', 'サービス業',           'Services');

-- ─── Companies ───────────────────────────────────────────────
create table companies (
  id              uuid primary key default gen_random_uuid(),
  ticker          text not null unique,
  name            text not null,
  name_en         text,
  market_code     text references markets(code),
  is_domestic     boolean default true,
  sector_code     text references sectors(code),
  fiscal_month    smallint,
  market_cap      bigint,
  listed_on       date,
  is_active       boolean default true,
  jpx_updated_at  date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index on companies (sector_code);
create index on companies (market_code);
create index on companies (is_active);

-- ─── Financial reports ────────────────────────────────────────
create table financial_reports (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  fiscal_year     smallint not null,
  period_type     text not null check (period_type in ('FY', 'H1')),
  consolidated    boolean not null default true,
  disclosed_at    timestamptz not null,
  doc_id          text not null,

  -- PL
  net_sales           bigint,
  cost_of_sales       bigint,
  gross_profit        bigint,
  sga                 bigint,
  operating_income    bigint,
  ordinary_income     bigint,
  net_income          bigint,

  -- BS
  total_assets        bigint,
  cash_and_deposits   bigint,
  inventories         bigint,
  ppe                 bigint,
  goodwill            bigint,
  investment_secs     bigint,
  total_equity        bigint,
  retained_earnings   bigint,

  -- CF
  cf_operating    bigint,
  cf_investing    bigint,
  cf_financing    bigint,
  cash_end        bigint,

  -- Shareholder returns
  dividends_paid       bigint,
  treasury_purchases   bigint,
  dividend_per_share   numeric(10,2),

  -- Company forecast
  forecast_net_sales          bigint,
  forecast_operating_income   bigint,
  forecast_net_income         bigint,

  created_at  timestamptz default now(),
  unique (company_id, fiscal_year, period_type, consolidated, doc_id)
);

create index on financial_reports (company_id, fiscal_year);
create index on financial_reports (fiscal_year, period_type);

-- ─── AI insights ─────────────────────────────────────────────
create table ai_insights (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  report_id    uuid references financial_reports(id) on delete cascade,
  kind         text not null,
  level        text default 'standard',
  content      jsonb not null,
  model        text,
  generated_at timestamptz default now()
);

create index on ai_insights (company_id, kind, level);

-- ─── Segments (Phase 1.5) ─────────────────────────────────────
create table segments (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  fiscal_year     smallint not null,
  source_doc_id   text not null,
  name            text not null,
  display_order   smallint,
  net_sales       bigint,
  segment_profit  bigint,
  assets          bigint,
  description     text,
  source_excerpt  text,
  created_at      timestamptz default now(),
  unique (company_id, fiscal_year, name, source_doc_id)
);

create index on segments (company_id, fiscal_year);

-- ─── Users / saved views ─────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id),
  created_at  timestamptz default now()
);

create table saved_views (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  columns     jsonb not null,
  sort_key    text,
  created_at  timestamptz default now()
);

-- ─── Watchlists ──────────────────────────────────────────────
create table watchlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null default 'マイリスト',
  created_at  timestamptz default now()
);

create table watchlist_items (
  id            uuid primary key default gen_random_uuid(),
  watchlist_id  uuid not null references watchlists(id) on delete cascade,
  company_id    uuid not null references companies(id) on delete cascade,
  note          text,
  added_at      timestamptz default now(),
  unique (watchlist_id, company_id)
);

create index on watchlist_items (watchlist_id);
create index on watchlist_items (company_id);

-- ─── Sector benchmark stats ───────────────────────────────────
create table sector_stats (
  id           uuid primary key default gen_random_uuid(),
  sector_code  text not null references sectors(code) on delete cascade,
  fiscal_year  smallint not null,
  metric_key   text not null,
  median       numeric,
  q1           numeric,
  q3           numeric,
  sample_size  smallint,
  computed_at  timestamptz default now(),
  unique (sector_code, fiscal_year, metric_key)
);

create index on sector_stats (sector_code, fiscal_year);

-- ─── Market benchmark stats ───────────────────────────────────
create table market_stats (
  id           uuid primary key default gen_random_uuid(),
  market_code  text references markets(code) on delete cascade,
  fiscal_year  smallint not null,
  metric_key   text not null,
  median       numeric,
  mean         numeric,
  q1           numeric,
  q3           numeric,
  sample_size  smallint,
  computed_at  timestamptz default now(),
  unique (market_code, fiscal_year, metric_key)
);

create index on market_stats (market_code, fiscal_year);

-- ─── Market summary (ratios, counts) ─────────────────────────
create table market_summary (
  id           uuid primary key default gen_random_uuid(),
  market_code  text references markets(code) on delete cascade,
  fiscal_year  smallint not null,
  metric       text not null,
  value        numeric,
  sample_size  smallint,
  computed_at  timestamptz default now(),
  unique (market_code, fiscal_year, metric)
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Public read: master & financial data
alter table markets            enable row level security;
alter table sectors            enable row level security;
alter table companies          enable row level security;
alter table financial_reports  enable row level security;
alter table segments           enable row level security;
alter table sector_stats       enable row level security;
alter table market_stats       enable row level security;
alter table market_summary     enable row level security;
alter table ai_insights        enable row level security;

create policy "public read" on markets           for select using (true);
create policy "public read" on sectors           for select using (true);
create policy "public read" on companies         for select using (true);
create policy "public read" on financial_reports for select using (true);
create policy "public read" on segments          for select using (true);
create policy "public read" on sector_stats      for select using (true);
create policy "public read" on market_stats      for select using (true);
create policy "public read" on market_summary    for select using (true);
create policy "public read" on ai_insights       for select using (true);

-- Own rows only: user data
alter table profiles       enable row level security;
alter table saved_views    enable row level security;
alter table watchlists     enable row level security;
alter table watchlist_items enable row level security;

create policy "own rows" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own rows" on saved_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on watchlist_items
  for all using (
    exists (
      select 1 from watchlists w
      where w.id = watchlist_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from watchlists w
      where w.id = watchlist_id and w.user_id = auth.uid()
    )
  );
