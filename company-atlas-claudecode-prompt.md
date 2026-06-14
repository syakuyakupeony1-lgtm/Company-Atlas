# Company Atlas — Claude Code 実装プロンプト（Phase 1）

> 企業を「読む」から、企業を「理解する」へ。
> EDINET（有報・半期）の財務データを起点に、財務3表をX-Ray（レントゲン）として可視化する「企業理解OS」。

このドキュメントは Claude Code にそのまま渡して実装を開始するための設計書です。Phase 1 のスコープ・技術スタック・design token・Postgresスキーマ・画面ごとのレイアウトと可視化仕様を含みます。

---

## 0. 実装方針（Claude Codeへの指示）

- このファイルを正とし、勝手にスコープを広げない。迷ったら**Phase 1の体験を最短で動かす**方を選ぶ。
- データは**EDINET API v2（無料）から取得する有価証券報告書・半期報告書**を情報源とする。決算説明資料PDF・転職サイト水準の年収/従業員データは**扱わない**（Phase 2以降）。TDnet（決算短信）は公式APIが有料のためPhase 1では使わない。
- セグメント情報は**Phase 1.5**で有報（EDINET）から取得（事業内容＋セグメント数値）。Phase 1のBubble Chart系UIは骨を用意し、データ未取得時はフォールバック表示。
- 数字は見せる、説明は隠す（ⓘで開く）。Apple Health的な「状態を理解させる」UIを徹底。
- まず**ダミーデータでUI全体を完成**させ、その後にXBRL取得パイプラインを繋ぐ。UIとデータ層を疎結合に保つ。

---

## 1. Phase 1 スコープ

### 作るもの
1. **トップ（企業探索画面）** — 上場企業の一覧テーブル。市場区分（プライム/スタンダード/グロース）・業種フィルタ、表示項目カスタマイズ・並び替え・プリセット。
2. **企業ページ** — 以下のX-Rayを縦に積む：
   - Snapshot（最初の3秒で掴む要約 + 一行要約。要約はテンプレート生成）
   - Business Mix（売上/利益/資産の構成Treemap・切替）— 「何で稼いでいるか」
   - PL X-Ray（Sankey: 売上→原価→粗利→販管費→営業利益→純利益）
   - BS X-Ray（資産構造のTreemap）
   - CF X-Ray（営業CF→投資→財務→現金残高のフロー）
   - SS X-Ray（利益→内部留保→配当→自社株買い→純資産）※有報から取れる範囲
   - Company Timeline / 推移分析（複数指標を1グラフ・指数化モード）
3. **AI要約 / Earnings Review** — 有報・半期の数値から自動生成する要約（Anthropic API）。

### Phase 1.5（Phase 1の後すぐ着手・有報セグメント）
- **Segment X-Ray / Segment一覧** — 各セグメントの事業内容＋セグメント別の売上・利益・資産。情報源は**有報XBRL（EDINET、年次）**。事業内容は有報「事業の内容」の実テキスト（出典あり）を表示し、AIに捏造させない。
- セグメント（有報・年1回）は財務（有報＋半期）と更新頻度が一致するため整合しやすい。鮮度は「最新有報時点」と明示する。

### 作らないもの（Phase 2+）
- Segment Compare（複数社の同一セグメント横断比較）— セグメント基盤が安定してから
- KPI Builder ドラッグ&ドロップ
- Business Situation（事業レビュー）— 中計・決算説明資料が情報源のため後回し
- Capital Allocation 10年集計（時系列データが貯まってから）
- 年収・従業員数・勤続年数（有報マター。セグメント基盤の後に同じ有報パイプラインで追加可）
- 決算説明資料パース

> 企業ページに将来差し込むもの（Segment は Phase 1.5 で実装。Capital Allocation / Business Situation は Phase 2）は、6.2の該当位置に**「準備中」プレースホルダカード**を置く。利用者に将来像を示し、後からの差し込み位置を固定する。

---

## 2. 技術スタック

| 層 | 技術 |
|---|---|
| フロント | Next.js (App Router) + TypeScript |
| スタイル | Tailwind CSS + CSS変数でdesign token |
| 可視化 | D3（Sankey/Treemap）+ Recharts（推移ライン） |
| DB | Postgres（Supabase想定、RLS有効） |
| 取得バッチ | Node.js script（JPX一覧→企業マスタ / EDINET API→財務・セグメント→upsert） |
| AI | Anthropic API（Haiku系。論点・レビュー地の文のみ。要約はテンプレート。バッチ＋キャッシュ＋全社事前生成） |
| ホスティング | Vercel |

> Sankey/Treemapは `d3-sankey`・`d3-hierarchy` を直接使い、Rechartsは時系列ラインのみ担当させる。混ぜない。

### チャート品質の共通仕様（全グラフ必須）
可視化は**このプロダクトの主役**であり、「正しく描く」だけでなく「**美しく、一目で意味が伝わる**」ことを要求する。目標は Apple Health / Apple の電池・アクティビティ画面のような、**質感のある・余白の効いた・ラベルを間引いた洗練されたチャート**。データビズが安っぽく見える原因（けばけばしい色、過密なラベル、太い枠線、強いグリッド）を排する。

**全チャート共通の美学:**
- **色は質感で**: データ色は `--cat-1..6` の彩度を抑えた上品な6色＋増減の緑赤のみ。ネオン・原色・虹色パレット禁止。塗りは**わずかなグラデ or ソリッド**で、面に奥行きを一段だけ与える。
- **線・枠は最小**: 軸線・グリッドは極薄（`--hairline`）か無し。チャートを囲む枠線は引かない。データを罫線で仕切らず余白で仕切る。
- **ラベルは間引く**: 全点にラベルを置かない。意味のある極値・端点・hover時のみ。ラベルは `--ink-secondary` で控えめに。
- **余白**: チャートの上下左右に十分なパディング。要素を縁いっぱいに詰めない。
- **数値の組版**: チャート内数値も等幅（tnum）。単位は従属。

**チャート別:**
- **Sankey（PL）**: リンクは `sankeyLinkHorizontal()` のベジェ曲線（直角禁止）。リンクは**流れる方向への淡いグラデーション**＋半透明（重なりが美しく見える）。ノードは角丸・細め。費用は `--cost`、残る利益は徐々に色が乗る。hoverでそのフローだけ濃くなり他は沈む（フォーカス）。
- **Treemap（BS/Mix）**: タイルは角丸6〜8px・2pxギャップで「タイルが浮く」質感。色は `--cat-*` を面積順でなく意味で割当。小タイルのラベルは省略しhoverで出す。
- **折れ線（推移）**: `type="monotoneX"` 単調補間（linear禁止）。線幅2px、点は通常非表示・hover時のみ。指数化の基準線100は極薄の水平線。複数系列は色＋直接ラベル（凡例を別置きしない）。
- **ウォーターフォール（CF）**: バーは角丸、増減で `--pos`/`--neg`、累計線は細く。FCFの中間強調は色でなく**わずかな台座（背景の面）**で示す。
- **バブル（業界マップ/Segment）**: 円は半透明で重なりを許容、サイズスケールは面積基準（半径基準にしない＝誤認防止）。ラベルは大きい円のみ。

**モーション（上質さの肝。やりすぎ厳禁）:**
- **数値変化**: 期切替・トグルは framer-motion で 320ms、数字はカウントアップ、形状はモーフ。一瞬で差し替えない。
- **イージング統一**: 全トランジション `cubic-bezier(0.22, 1, 0.36, 1)`。標準320ms、入場（露光）240ms×スタッガー。
- **hover**: 120msで対象を前面化（他を沈める／わずかなスケール）。グロー多用はしない（AIっぽさの元）。
- **レスポンシブ**: ResizeObserverで幅追従、再描画でアニメが暴れない。
- `prefers-reduced-motion` で全補間を即時表示に。
- 形状補間が必要なら `framer-motion` 使用可。

> 実装者へ: 各チャートは描いた後に必ずスクリーンショットで自己批評する。「これは安っぽくないか／Apple Healthの隣に置けるか／色は多すぎないか／ラベルは過密でないか／余白は十分か」。一つでもNoなら直す。

---

## 3. Design Token

### 美学の方針（AI典型からの脱却を明記）
「暗い背景＋ネオン青のアクセント」は、frontend-designが名指しするAI生成の典型(2)であり、**採用しない**。同様にクリーム＋セリフ(典型1)、新聞罫線(典型3)も採らない。

このプロダクトの本質は「健康診断のように、企業の状態を静かに正確に見せる」こと。目指す質感は**Apple Health／医療画像ビューア／精密機器のダッシュボード**——すなわち **明るく清潔な余白、静寂、質感（マテリアル）、徹底した抑制**。色や効果で語らず、**余白とタイポと数字そのもの**で語る。

**5つの美学規律（全実装で厳守）:**
1. **余白が主役**: 要素間は詰めず、大胆に空ける。1画面に詰め込まず、1カード1メッセージ。情報密度はプロレベルでのみ上げる。
2. **静寂な面**: 背景はほぼ無彩色の明るいオフホワイト。カードは紙のように軽く浮く（極薄シャドウ、罫線は最小）。グラデーションの多用禁止。
3. **色は意味のためだけに**: 装飾の色を使わない。色が出るのは「データ（増減・構成・業種）」のときだけ。UIクロームはグレースケール。
4. **数字が一番美しい要素**: 大きな数字＋小さなラベルではなく、数字に呼吸とリズムを与える（桁の組版、単位の従属、整列）。
5. **動きは最小限・上質**: 派手なアニメは「AIっぽさ」の元。動かすのは意味のある一瞬だけ（後述signature）。

### カラートークン
明るい基調。データ色だけ彩度を持ち、UIは無彩。

```css
:root {
  /* surface — 明るく清潔。紙と空気 */
  --bg:            #FBFBFD;   /* 画面背景（わずかに青みのオフホワイト） */
  --surface:       #FFFFFF;   /* カード（純白で背景からそっと浮く） */
  --surface-sunken:#F5F5F7;   /* 沈んだ面（フィルタ帯・テーブルヘッダ） */
  --hairline:      #E8E8ED;   /* 罫線。極薄 */
  --shadow:        0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04); /* 紙の浮き */

  /* ink — 文字。真っ黒は使わずわずかに和らげる */
  --ink:           #1D1D1F;   /* 主テキスト（Apple的なほぼ黒） */
  --ink-secondary: #6E6E73;   /* 補助・ラベル */
  --ink-tertiary:  #AEAEB2;   /* キャプション・装飾のみ */

  /* accent — 強調は最小限。リンク/フォーカス/選択のみ */
  --accent:        #0071E3;   /* Apple的な青。多用しない */
  --accent-weak:   #E8F1FD;

  /* data — データ表現専用の彩度。ここだけ色を許す */
  --pos:           #1A7F4B;   /* 増益・流入（緑） */
  --neg:           #C7362F;   /* 減益・流出（赤） */
  --cost:          #B7B7BD;   /* 原価・費用フロー（無彩グレー） */
  /* セグメント/構成の質感カラー：彩度を抑えた上品な6色。ネオンにしない */
  --cat-1:#5B8DEF; --cat-2:#57B3A4; --cat-3:#E0A458;
  --cat-4:#B57BD6; --cat-5:#6BA368; --cat-6:#D98C8C;

  /* radius / space — 8pxグリッド。余白は広めの倍数を選ぶ */
  --r-card: 18px;   /* Apple的にやや大きい角丸 */
  --r-chip: 980px;
  --r-control: 10px;
  --space: 8px;
}
```

> ダークモードは Phase 2。まず明るい基調で「静謐な精密さ」を完成させる。暗背景に逃げない（AI典型回避を徹底するため）。

### タイポグラフィ
借り物の無難な組み合わせを避け、**数字の美しさ**に全振りする。

- **数値（主役）**: `SF Mono` 系が望ましいが入手性から **`Roboto Mono` か `JetBrains Mono`** を使い、`font-feature-settings: "tnum"`（等幅数字）必須。財務数値は必ずこれ。桁区切りカンマは `--ink-tertiary` で軽く。
- **見出し**: 日本語main なので **`Noto Sans JP`** の Medium/Bold を主役に据え、字間（letter-spacing）をわずかに詰めてApple的な締まりを出す。英字見出しは `Inter` の tight setting で揃える。セリフは使わない。
- **本文・ラベル**: 日本語 `Noto Sans JP` Regular、英数 `Inter`。
- **タイプスケール**は明確な段階を持たせる（例: 数値ヒーロー 40/32、見出し 22/17、本文 15、ラベル 13、キャプション 11）。中途半端なサイズを混ぜない。
- 数値は等幅＋桁区切り、単位は従属させて小さく（例: `6,500`<small> 億円</small>）。単位とラベルは `--ink-secondary`。
- **数字に呼吸を**: 主要数値は行間と前後の余白をたっぷり取り、ラベルとの間にリズムを作る。詰めて並べない。

### レイアウト原則
- 8pxグリッド。**余白を恐れない**——カード内パディングは広め（24〜32px）、カード間も十分に空ける。表は最小限、可視化と余白を最大化。
- 1カード=1メッセージ。1つのカードに機能を詰め込まない。
- 説明文はカードに常駐させず、ラベル横の **ⓘ** で開く。ただしⓘ無しでも主旨が通るラベルにする。
- **signature要素 = 露光（Exposure）**: 企業ページ読み込み時、各カードが**わずかな上方移動＋フェード＋ほのかな明度の立ち上がり**で、上から順に「現像」されるように現れる（X線写真が浮かび上がる比喩）。派手な走査線ビームではなく、静かで上質な一度きりの所作。160ms ずつのスタッガー、各240ms。`prefers-reduced-motion`で無効化。これが「医療画像」の世界観を体現する唯一の記憶点で、ここにだけ凝る（他は静かに保つ＝Chanelの「鏡の前で一つ外す」）。

### 3.5 状態・性能・アクセシビリティ（プロダクト品質の土台）
実データは穴だらけ・大量・遅延ありが前提。ここを設計しないと「デモは綺麗だが実運用で崩れる」ものになる。

**状態設計（全カード・全テーブルに4状態を必ず用意）**
- **Loading**: チャートは骨格スケルトン（レイアウトシフトを起こさない固定高）。数値はシマー。明るい面に合わせた淡いスケルトン。
- **Empty**: そのデータが未取得の企業（例: 半期未提出、セグメント未対応業種）は「データなし」を穏やかに示し、理由（例「最新有報待ち」）＋次の行動を添える。空白や0で誤魔化さない。
- **Partial**: 一部指標のみ取得済みは、取れた範囲を出し欠損は「—」。カードは消さない。
- **Error**: 取得失敗は再試行ボタン＋具体的な状況説明（謝罪や曖昧表現でなく「データを読み込めませんでした。再試行してください」）。生成AI失敗時は要約だけ非表示にし、数値カードは残す。

**パフォーマンス**
- トップの全社テーブル（最大約4000行）は**サーバー側でフィルタ/ソート/ページング**し、クライアントは仮想スクロール。全件をクライアントに送らない。
- 企業ページは**サーバーコンポーネントで初期データ取得**（財務・ベンチは事前計算済みを読むだけ）。重いd3チャートは個別に動的import（コード分割）し、初期表示をブロックしない。
- `sector_stats` のように集計はバッチで事前計算しキャッシュ。リクエスト時に全社走査しない。
- 画像/フォントは最適化。LCPの主役はSnapshotなので最優先で描く。

**アクセシビリティ（高校生からプロまで＝多様な利用者に必須）**
- **色だけに依存しない**: 増益/減益・流入/流出は色＋記号（▲▼/＋−）＋ラベルで三重化。色覚多様性に対応。
- **コントラスト**: 明背景で `--ink`/`--ink-secondary` はWCAG AA以上を確保。`--ink-tertiary` は装飾のみ。
- **キーボード操作**: テーブル・トグル・タブ・ⓘは全てキーボードで到達/操作可。フォーカスリングを `--accent` で明示。
- **スクリーンリーダー**: チャートには要点のテキスト代替（例「営業利益率6.5%、業種中央値5.0%より高い」）を `aria-label`/視覚的隠しテキストで提供。等幅数値は読み上げ可能なマークアップに。
- **モバイル**: 親指到達・タップ領域44px以上。横スクロールはテーブルのみに限定。

---

## 4. Postgresスキーマ

```sql
-- 市場区分マスタ（東証の3市場 + PRO Market。表示順を持たせる）
create table markets (
  code        text primary key,   -- 'prime' | 'standard' | 'growth' | 'pro'
  label_ja    text not null,      -- 'プライム' | 'スタンダード' | 'グロース' | 'TOKYO PRO Market'
  label_en    text not null,      -- 'Prime' | 'Standard' | 'Growth' | 'Pro'
  sort_order  smallint not null   -- 1=Prime 2=Standard 3=Growth 4=Pro
);
-- seed:
-- ('prime','プライム','Prime',1),('standard','スタンダード','Standard',2),
-- ('growth','グロース','Growth',3),('pro','TOKYO PRO Market','Pro',4)

-- 33業種マスタ（東証33業種区分コード。JPX標準）
create table sectors (
  code      text primary key,   -- 東証33業種コード（例 '3050'=食料品）
  label_ja  text not null,      -- '食料品'
  label_en  text                -- 'Foods'
);

-- 企業マスタ。一次ソースは JPX「東証上場銘柄一覧」(data_j.xls) 月次
create table companies (
  id              uuid primary key default gen_random_uuid(),
  ticker          text not null unique,        -- 証券コード "2871"（4桁、先頭ゼロ保持＝text）
  name            text not null,
  name_en         text,
  market_code     text references markets(code),   -- 上場市場区分
  is_domestic     boolean default true,            -- 内国株式/外国株式（区分欄の「（内国株式）」由来）
  sector_code     text references sectors(code),   -- 33業種コード
  fiscal_month    smallint,                        -- 決算月 1-12
  market_cap      bigint,                          -- 時価総額（円）日次更新は別ジョブ
  listed_on       date,                            -- 上場日（JPX一覧/J-Quants）
  is_active       boolean default true,            -- 上場中=true / 廃止=false（7-Eの差分検知で更新。行は消さない）
  jpx_updated_at  date,                            -- data_j.xls の対象年月末
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 会計期ごとの財務サマリー（EDINET書類 1件 = 1行）
create table financial_reports (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  fiscal_year     smallint not null,           -- 2024
  period_type     text not null,               -- 'FY'（有報/通期） | 'H1'（半期）
  consolidated    boolean not null default true,
  disclosed_at    timestamptz not null,        -- 提出日（EDINET）
  doc_id          text not null,               -- EDINET docID（冪等キー）

  -- PL
  net_sales        bigint,    -- 売上高
  cost_of_sales    bigint,    -- 売上原価
  gross_profit     bigint,    -- 売上総利益
  sga              bigint,    -- 販管費
  operating_income bigint,    -- 営業利益
  ordinary_income  bigint,    -- 経常利益
  net_income       bigint,    -- 当期純利益（親会社株主帰属）

  -- BS（資産構造Treemap用）
  total_assets        bigint,
  cash_and_deposits   bigint,
  inventories         bigint,
  ppe                 bigint,   -- 有形固定資産
  goodwill            bigint,
  investment_secs     bigint,
  total_equity        bigint,   -- 純資産
  retained_earnings   bigint,

  -- CF
  cf_operating     bigint,
  cf_investing     bigint,
  cf_financing     bigint,
  cash_end         bigint,      -- 現金及び現金同等物期末残高

  -- 株主還元
  dividends_paid       bigint,
  treasury_purchases   bigint,
  dividend_per_share   numeric(10,2),

  -- 会社予想（通期予想。有報・短信いずれにも記載あり）
  forecast_net_sales        bigint,
  forecast_operating_income bigint,
  forecast_net_income       bigint,

  created_at  timestamptz default now(),
  unique (company_id, fiscal_year, period_type, consolidated, doc_id)
);

-- AIテキスト＋テンプレート生成テキスト（要約・Earnings Review・論点）。全社事前生成のキャッシュ
create table ai_insights (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  report_id    uuid references financial_reports(id) on delete cascade,
  kind         text not null,                 -- 'snapshot_summary' | 'earnings_review' | 'key_points' | 'highlights'
  level        text default 'standard',       -- 'easy' | 'standard' | 'pro'（レベル別生成）
  content      jsonb not null,                -- 構造化された要約（kind別の固定スキーマ）
  model        text,
  generated_at timestamptz default now()
);

-- セグメント情報（Phase 1.5）。情報源は有報XBRL（EDINET、年次）
-- 1社1会計期に複数セグメント。数値は有報のセグメント注記、事業内容は「事業の内容」記述から
create table segments (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  fiscal_year     smallint not null,
  source_doc_id   text not null,               -- 有報の文書ID（冪等キー）
  name            text not null,               -- セグメント名（例「冷凍食品」「低温物流」）
  display_order   smallint,                    -- 開示順を保持

  -- セグメント別財務（有報セグメント注記。取れない値はnull）
  net_sales        bigint,   -- 外部売上高
  segment_profit   bigint,   -- セグメント利益（営業利益相当）
  assets           bigint,   -- セグメント資産

  -- 事業内容（有報「事業の内容」由来。出典のある実テキスト。AI生成ではない）
  description      text,     -- そのセグメントが何をしているか
  source_excerpt   text,     -- 有報原文の該当抜粋（出典明示用、短く）

  created_at  timestamptz default now(),
  unique (company_id, fiscal_year, name, source_doc_id)
);

-- ユーザー（プリセット/カスタム表示項目の保存用）
create table profiles (
  id          uuid primary key references auth.users(id),
  created_at  timestamptz default now()
);
create table saved_views (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,                  -- "投資家セット"
  columns     jsonb not null,                 -- 表示する指標キーの配列
  sort_key    text,
  created_at  timestamptz default now()
);

-- ウォッチ/比較リスト（出口体験。就活生の志望先、投資家の候補など）
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
  note          text,                          -- ユーザーの一言メモ
  added_at      timestamptz default now(),
  unique (watchlist_id, company_id)
);

create index on financial_reports (company_id, fiscal_year);
create index on segments (company_id, fiscal_year);
create index on companies (sector_code);
create index on companies (market_code);

-- 業種ベンチマーク（事前集計キャッシュ。5.1の比較表示用）
-- 業種×指標×会計期で中央値・四分位を持つ。取得バッチ後に再計算する
create table sector_stats (
  id           uuid primary key default gen_random_uuid(),
  sector_code  text not null references sectors(code) on delete cascade,
  fiscal_year  smallint not null,
  metric_key   text not null,            -- 'op_margin' | 'roic' | ... METRICSのキー
  median       numeric,
  q1           numeric,                  -- 第1四分位
  q3           numeric,                  -- 第3四分位
  sample_size  smallint,                 -- 集計に使った社数（少数なら信頼度低、UIで注記）
  computed_at  timestamptz default now(),
  unique (sector_code, fiscal_year, metric_key)
);
create index on sector_stats (sector_code, fiscal_year);

-- 市場全体ベンチマーク（トップのダッシュボード用。全市場 or 市場区分単位の集計）
-- market_code が null の行 = 全上場企業の集計。値ありの行 = その市場区分の集計
create table market_stats (
  id           uuid primary key default gen_random_uuid(),
  market_code  text references markets(code) on delete cascade,  -- null=全市場
  fiscal_year  smallint not null,
  metric_key   text not null,            -- 'op_margin' | 'roic' | 'net_sales' | ...
  median       numeric,
  mean         numeric,                  -- 平均（ダッシュボードの見出し数値に使用）
  q1           numeric,
  q3           numeric,
  sample_size  smallint,
  computed_at  timestamptz default now(),
  unique (market_code, fiscal_year, metric_key)
);
create index on market_stats (market_code, fiscal_year);

-- ダッシュボード用の比率系サマリー（増収/増益企業の割合など。指標とは別物）
-- 例 metric='revenue_up_ratio'（増収企業比率）, 'profit_up_ratio'（増益企業比率）
create table market_summary (
  id           uuid primary key default gen_random_uuid(),
  market_code  text references markets(code) on delete cascade,  -- null=全市場
  fiscal_year  smallint not null,
  metric       text not null,
  value        numeric,                  -- 0〜1 の比率や件数
  sample_size  smallint,
  computed_at  timestamptz default now(),
  unique (market_code, fiscal_year, metric)
);
```

### RLSポリシー
- `companies` / `financial_reports` / `segments` / `sector_stats` / `market_stats` / `market_summary` / `ai_insights` / `markets` / `sectors`: 全ユーザー read 可（公開データ）、write はサービスロールのみ。
- `profiles` / `saved_views` / `watchlists` / `watchlist_items`: `auth.uid() = user_id` の本人のみ read/write（watchlist_itemsは親watchlist経由で判定）。

```sql
alter table companies enable row level security;
create policy "public read" on companies for select using (true);

alter table markets enable row level security;
create policy "public read" on markets for select using (true);

alter table sectors enable row level security;
create policy "public read" on sectors for select using (true);

alter table saved_views enable row level security;
create policy "own rows" on saved_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

## 5. 指標定義（全項目に「この数字で何がわかるか」を持たせる）

UIのⓘに出す説明をコード内のメタデータとして一元管理する。各指標は2層の説明を持つ：`desc`（標準）と `plain`（高校生・就活生向けの一言。専門用語を使わない）。表示モード（後述の理解レベル）で出し分ける。

```ts
// lib/metrics.ts
export const METRICS = {
  net_sales:        { label: "売上高",     reading: "うりあげだか",   unit: "円", desc: "企業規模がわかる",                              plain: "どれだけ商品やサービスを売ったか" },
  operating_income: { label: "営業利益",   reading: "えいぎょうりえき", unit: "円", desc: "本業で稼ぐ力がわかる",                          plain: "本業でいくら儲かったか" },
  op_margin:        { label: "営業利益率", reading: "えいぎょうりえきりつ", unit: "%", desc: "稼ぐ効率がわかる", derived: true,            plain: "売上のうち何割が本業の儲けか" },
  net_income:       { label: "純利益",     reading: "じゅんりえき",   unit: "円", desc: "最終的に残る利益がわかる",                      plain: "税金まで払って最後に残ったお金" },
  roic:             { label: "ROIC",       reading: "ロイック",       unit: "%",  desc: "投下資本をどれだけ効率よく利益に変えたかがわかる", derived: true, plain: "元手を使ってどれだけ上手に稼いだか" },
  fcf:              { label: "FCF",        reading: "エフシーエフ",   unit: "円", desc: "自由に使える現金の創出力がわかる", derived: true, plain: "自由に使えるお金をどれだけ生んだか" },
  dividend_yield:   { label: "配当利回り", reading: "はいとうりまわり", unit: "%", desc: "株価に対する配当の水準がわかる", derived: true,  plain: "株を買うと毎年どれくらい配当がもらえるか" },
  equity_ratio:     { label: "自己資本比率", reading: "じこしほんひりつ", unit: "%", desc: "財務の安定性がわかる", derived: true,         plain: "会社の財産のうち借金でない割合（高いほど安全）" },
} as const;
// derived指標は financial_reports の生値から算出する純関数を別途用意
```

導出: `op_margin = operating_income / net_sales`、`fcf = cf_operating + cf_investing`、`roic = operating_income*(1-実効税率) / (total_equity + 有利子負債)`（Phase 1は有利子負債が取得値に無ければ `total_assets - total_equity` で近似し、ⓘに「簡易計算」と明記）、`equity_ratio = total_equity / total_assets`。

### 5.1 文脈と比較（このプロダクトを「理解OS」にする核）

数字は**単独では理解できない**。「営業利益率6.5%」は高いのか低いのか、業種を知らなければ無意味。人が企業を理解するのは常に相対比較を通じてであり、ここが弱いと単なる数値ビューアに留まる。全レベルのユーザー（高校生〜プロ）に等しく効く、最優先の機能。

- **業種ベンチマーク**: 主要指標（利益率/ROIC/自己資本比率/成長率等）に**同業種（33業種）の中央値・四分位**を併走表示。「この会社は食料品業種で上位25%」のような位置づけを、数値の隣に小さなレンジバーで示す。
- **集計テーブル `sector_stats`**（スキーマに追加）: 業種×指標×会計期で中央値・四分位を事前計算してキャッシュ。毎回全社走査しない。
- **やさしいレベル**では「業種の平均くらい」「平均より高い」など語彙化、**プロレベル**では実数値＋パーセンタイル。
- **自社の時系列内比較**: 推移分析（⑦）で各指標に「自社過去レンジ」の帯を敷き、今が高水準か低水準かを背景で示す。
- 比較は**事実の提示に留める**（「高い＝良い」と評価しない）。AIの禁止事項と一貫させる。ⓘに「業種で意味が変わる（例：商社と小売で適正利益率は違う）」の注意を添える。

> これにより、Snapshotを開いた瞬間に「規模はこの業種で中堅、利益率は上位、財務は平均的」といった**立体的な理解**が一目で得られる。これがIR BANK等の単純データベースとの決定的な差別化になる。

---

## 6. 画面仕様

### 6.000 サービスの姿勢と免責（全画面に通底）

このプロダクトは**企業を理解するための道具**であり、企業を評価・批判したり、投資を勧めたりするものではない。この姿勢をプロダクト全体で一貫させ、UIにも明示する。

**プロダクトとして守ること:**
- 数字とその構造を、事実として中立に提示する。「良い/悪い」「買い/売り」の判断を下さない。
- 業種比較・前年比較も、高低という事実の提示に留め、優劣の評価にしない。
- AI生成テキストも同じ（8章の制約と一貫）。論点は「問い」として示し、結論を出さない。

**UIに常時出す免責（フッター＋初回オンボーディング）:**
画面下部のフッターに、控えめだが明確に常設する。法律文書調の堅い言い回しではなく、サービスの voice で平易に。例:

> Company Atlas は、公開情報をもとに企業の数字を分かりやすく示すためのサービスです。特定の企業を評価・批判する意図はなく、また投資や就職などの判断を勧めるものではありません。掲載内容は参考情報であり、実際の判断はご自身で、必要に応じて専門家にご相談ください。出典は各社の有価証券報告書・半期報告書（EDINET）等の公開情報です。

- **データの限界も正直に**: 「数字は最新の開示時点のもの」「一部は簡易計算を含む（ⓘで明示）」を、隠さず添える。鮮度ヘッダ・ⓘと一貫。
- **初回オンボーディング**にも一行で姿勢を織り込む（「企業を、数字の構造で“理解する”ための場所です」）。売り込み文句にしない。
- 個別企業ページにも、AI論点・要約カードの近くに小さく「事実の提示であり、評価や推奨ではありません」を添える（くどくしない。1箇所で十分）。

> 表現の原則（frontend-designの writing 指針と一貫）: 謝罪調や法律文書調にしない。能動態・平易・サービスの声で。「免責事項」と大書せず、信頼を損なわないさりげなさで、しかし誤解なく伝える。

### 6.00 UX原則（全画面に通底する直感性の設計）

「数字が並ぶ難しいサイト」にしないための、操作体験の背骨。各画面はこの原則に従う。

**ナビゲーション（迷子にしない）**
- **永続ヘッダー**: 全画面共通。左にロゴ（タップでトップ）、中央に検索、右に理解レベル＋（ログイン時）ウォッチリスト。スクロールしても検索とレベルは常に届く（モバイルは縮約）。
- **現在地の明示**: 企業ページは「業種 › 企業名」、業界ページは「市場 › 業種」のパンくずを上部に。今どこにいて、一つ上がどこかが常に分かる。
- **戻る/閉じる**: 比較ビュー・ⓘ詳細・モーダルは明示的な閉じる手段（×・スワイプダウン・Escape）。ブラウザ戻るでも破綻しない（状態はURLに持つ）。
- **回遊の一貫性**: 企業→関連企業、企業→業界、業界→構成企業、比較→各社、が双方向。行き止まりを作らない。

**段階的開示（最初はシンプル、欲しい人だけ深く）**
- 各画面は**3秒で要点 → スクロール/タップで詳細**の二段構え。Snapshotや市場ダッシュボードが「要点」、X-Rayやⓘが「詳細」。
- 数字は見せる、説明は隠す（ⓘ）。ただしⓘは「あれば便利」であって、ⓘを開かなくても主要な意味が通るようにラベルと併記表示を整える。
- 専門度の高い要素（ROIC・SS X-Ray等）はやさしいレベルで折りたたみ、必要な人だけ開く。

**インタラクションの一貫則**
- **押せるものは押せると分かる**: タップ可能要素は一貫した手がかり（`--accent`、下線、チップ形状、hover時の前面化）。ただのテキストと混同させない。
- **即時フィードバック**: あらゆる操作に120〜200msの即応（押下のscale、トグルの移動、追加時のチェック）。「反応した」が必ず分かる。
- **楽観的更新**: ウォッチ追加・比較追加はサーバー応答を待たず即UIに反映、失敗時のみ戻す。
- **取り消せる**: 追加・削除はトースト＋「元に戻す」。破壊的操作で不安にさせない。
- **同じ操作は同じ場所・同じ見た目**: 「比較に追加」「ウォッチ」はトップ・企業・業界で同一の配置と挙動。

**マイクロインタラクション（手応え）**
- 値の変化はカウントアップ＋形状補間（チャート品質仕様と統一）。
- ウォッチ追加＝星が満ちる、比較追加＝下部の比較トレイにサムネが飛ぶ、保存＝チェックの一筆。小さな達成感を設計する。
- 全て `prefers-reduced-motion` で無効化。

**空・初回・読み込み（迷わせない）**
- **初回オンボーディング**: 初訪問時、市場ダッシュボードの上に1行で「日本の上場企業を、数字の構造で理解する。気になる会社を検索 or 業界から探す」＋検索への視線誘導。押し付けない（×で消え、再表示しない）。やさしいレベルでは各画面の初回に一言ガイド。
- **空状態は次の行動を示す**: データ無し・検索0件・ウォッチ空は、嘆くのではなく「業界から探す」「人気企業を見る」等の次の一手を提示。
- **読み込みはスケルトン**: レイアウトシフトを起こさない固定枠のスケルトン＋シマー。スピナーの全画面ブロックはしない。

**モバイルファースト（Y自身モバイル中心）**
- スマホ幅を第一に設計し、広い画面で拡張する。
- **3層トップ**: モバイルでは縦積み。市場ダッシュボードは横スワイプのカルーセル指標、業界マップは横スクロールチップ、テーブルは主要2〜3列＋タップで詳細展開。
- **X-Ray**: 縦長1カラム。Sankey/Treemapはピンチズーム or タップで拡大モーダル。横スクロールは最終手段。
- **比較ビュー**: モバイルは2社まで横並び、3社目以降は横スワイプ。
- タップ領域44px以上、親指の届く下部に主要操作（比較トレイ・レベル切替）。



- **やさしい（初心者）**: 指標ラベルに `plain`（平易な言い換え）を併記、難語に読み仮名。表示指標を売上/利益/利益率/現金の4つに絞る。各X-Rayの冒頭にAIの一文ガイド（「この会社は〜で稼いでいます」）。専門X-Ray（SS/ROIC等）は折りたたみ。
- **標準（就活・一般投資家）**: `desc` を使用。主要X-Rayを全部展開。プリセットの初期値は「就活」または「投資家」。
- **プロ（証券・IR）**: 全指標・全X-Ray展開、数値は実額も併記、前年比・予想進捗まで密に表示。余白を詰めた高密度モード。

> レベルは「情報量と語彙の出し分け」であり、データ自体は同一。プロが見ても物足りず、初心者が見ても溺れない、を両立する。各カードは `level` を受け取り表示を出し分ける純粋コンポーネントにする。

### 6.0.1 検索体験
トップ／全画面のヘッダーに常設。社名（漢字/かな/英）・証券コードの**あいまい検索**（部分一致＋読み仮名一致）。コード4桁の直接入力で即遷移。候補はドロップダウンに市場区分チップ付きで出す。0件時は「別の社名やコードで試す」を促す空状態メッセージ。

### 6.1 トップ（企業探索画面 ＝ 市場の体温→業界→企業の3層）

LPではなく探索画面。ただし**ただの表ではなく、上から「市場全体の体温 → 業界の目安 → 個別企業」とズームインしていく構造**にする。Apple Healthが歩数・睡眠を集約して「今日の状態」を見せるように、開いた瞬間に日本市場全体の状態が分かり、そこから業界、企業へ自然に降りていける。

```
┌──────────────────────────────────────────────────────────┐
│  Company Atlas        [レベル▾] [プリセット▾] [⚙]  [🔍検索]│
│  市場: [全] [プライム] [スタンダード] [グロース]            │
├──────────────────────────────────────────────────────────┤
│ ▍市場ダッシュボード（選択中: 全市場 · FY2024）             │ ← 第1層(A)
│  平均営業利益率 6.8%   平均ROIC 7.2%   増収企業 62%        │
│  自己資本比率(中央値) 48%   増益企業 55%   上場 3,900社    │
├──────────────────────────────────────────────────────────┤
│ ▍業界マップ（タップで業界を絞り込み）                      │ ← 第2層(B/C)
│  [食料品 利益率5%●][商社 2%●][医薬 18%●][銀行 -●]...     │
├──────────────────────────────────────────────────────────┤
│ ▍企業一覧（食料品 32社）                                   │ ← 第3層
│ コード 企業名    市場   利益率(業界比)  売上↓  ROIC  決算月│
│ 2871  ニチレイ  Prime  6.5%▕▔●▔▏上位  6,500億 7%  3月   │
│ 2802  味の素    Prime  10% ▕▔▔●▏上位  1.4兆  9%  3月    │
└──────────────────────────────────────────────────────────┘
```

#### 第1層：市場ダッシュボード（A）
- 上場企業全体の集計を見出し数値で。**平均営業利益率 / 平均ROIC / 自己資本比率中央値 / 増収企業比率 / 増益企業比率 / 上場社数**。`market_stats`（mean/median）＋`market_summary`（増収増益比率）から。
- **市場区分フィルタと連動**: 「プライム」を選ぶとプライムの集計に切り替わる（market_code でフィルタ）。
- 各数値にⓘで「これは全上場企業の平均。業種でばらつくので下の業界マップで確認」。やさしいレベルは「日本の会社は平均このくらい儲けている」と語彙化。
- これが**全数値の基準点**になる。個別企業の数字を見たとき「市場平均6.8%に対してこの会社は…」と無意識に比較できる。

#### 第2層：業界マップ（B＋C）
- 33業種を**チップ／バブルで一覧**。各業種に代表値（中央値の営業利益率）と社数、円サイズ=業種の合計売上規模。
- **これが「数値感の目安」の核**: 食料品5%・商社2%・医薬18%のように業種で適正水準が全く違うことを、企業を見る前に体得できる。「商社の2%」と「医薬の2%」の意味の違いが分かるようになる。
- 業種チップをタップ→第3層がその業種で絞り込まれ、ダッシュボードの基準線も「業種平均」に切り替わる。
- 表示指標は切替可能（利益率/ROIC/成長率/平均規模）。`sector_stats` から。
- やさしいレベルは「儲かりやすい業界・薄利多売の業界が一目で分かる」と添える。

#### 第3層：企業一覧テーブル
- **市場区分フィルタ**: 全/プライム/スタンダード/グロースのセグメント切替（複数選択可）。PRO Marketはトグル。市場列は `markets.label_en` チップ、`sort_order` で整列。
- **業種フィルタ**: 第2層の業界マップと連動（マップで選んでも、ここのドロップダウンで選んでもよい）。
- **業界比カラム**: 各指標セルに、その業種内での位置を極小レンジバーで併記（5.1の業種ベンチをテーブルにも適用）。「6.5%」だけでなく「6.5% ▕▔●▔▏上位」と見える。これで表の中でも数値感が即座に分かる。
- **表示項目カスタマイズ**: METRICSから列を追加/削除。各列ヘッダにⓘ。市場・業種・決算月は常設列。
- **並び替え**: 任意の数値列でソート。
- **プリセット**: 初心者/投資家/就活/営業/経営企画/プロ。未対応指標を含む列はグレーアウト＋Phase 2バッジ。
- 行クリックで企業ページへ。仮想スクロール、サーバー側フィルタ/ソート/ページング。
- 市場・業種フィルタはURLクエリに反映し共有・復元可能。

> 3層は折りたたみ可能。プロは第1・2層を畳んでテーブル直行、初心者は上から眺めて降りていく、と使い分けられる。レベルとスクロール位置で自然に出し分ける。

### 6.2 企業ページ

縦に積む。各セクションは独立カード。読み込み時に各カードが上から順に「露光（Exposure）」で静かに現れる（design token signature参照）。

**共通仕様（全カードに適用）**
- **パンくず**: ページ上部に「業種 › 企業名」。業種はタップで業界ページへ。現在地と一つ上が常に分かる（UX原則のナビゲーション）。
- **データ鮮度の明示**: ページ上部に「FY2024（有報 / 2024-06-21提出）」のように、表示中の会計期と提出日を必ず出す。最新期は `financial_reports` の `disclosed_at` 最新で判定し、'FY'（通期）/'H1'（半期）をラベルで明示。半期と通期を混同させない。
- **欠損フォールバックの統一ルール**: ある科目/指標が欠損のとき、(1) フローやTreemapの一要素なら0扱いで描画を壊さない、(2) カード全体が成立しない場合のみカードを非表示（例: SS X-Ray）、(3) 個別数値は「—」で表示し捏造しない。AI要約には欠損値を渡さない。どのルールを適用したかをⓘで辿れるようにする。
- **単位の一貫性**: 全数値は円ベースで保持し、表示時に億/兆へ整形。混在表示しない。

**① Snapshot（最初の3秒）**
```
ニチレイ  2871 · プライム · 食料品 · 3月決算
売上 6,500億   営業利益 420億   時価総額 4,100億
─────────────────────────────────────
🤖 冷凍食品と低温物流を中核とする食品インフラ企業。
   営業利益率6.5%、CFは安定し設備投資を継続。
```
一行要約は `ai_insights.kind='snapshot_summary'`（8章のとおりテンプレート生成。AIではない）から表示。時価総額・従業員数のうち未対応項目は出さない。

**Snapshotに業種内ポジションを併記**（5.1の比較を最初の3秒に効かせる）: 主要数値の各々に、業種内の位置を極小レンジバーで添える（例: 営業利益率6.5% の隣に「食料品で上位30%」）。`sector_stats` から算出。これがあるだけで「この数字が良いのか悪いのか」が即座に分かる。やさしいレベルは語彙化、プロは実数値＋パーセンタイル。

> やさしいレベル時は、Snapshot直下に「この会社の見どころ」を3点、AIが平易な文で提示（例: ①冷凍食品で稼ぐ ②現金より設備に投資 ③利益は安定）。以降のX-Rayへの道案内になる。標準/プロでは非表示。

**② Business Mix（何で稼いでいるか）**
売上・利益・資産の**構成**をTreemapで切替表示。
- **資産構成**は有報・半期のBSから直接描ける（現金/在庫/設備/のれん/投資/その他）→Phase 1で実装。
- **売上構成 / 利益構成**はセグメント別の値が要る。Phase 1では**「全社単一」表示にフォールバック**し、Phase 1.5でセグメント（`segments`テーブル）が入ると自動で複数タイルに展開する。タブは最初から出し、データ未取得時は『セグメント別は近日対応』の注記。
- ⓘ「事業の偏りがわかる」。BS X-Ray④と描画コンポーネントを共有（Treemapを使い回し、データソースだけ切替）。

> 補足：Business Mixの資産タブとBS X-Ray④は同じTreemap。Mixは「ざっくり何に寄っているか」の入口、④は科目内訳の詳細、と役割を分けて重複感を出さない。Mixはコンパクト表示、④はフル。

**③ PL X-Ray（Sankey）**
売上を起点に左→右へ：`売上高 → [原価/粗利] → 粗利から[販管費/営業利益] → 営業利益→…→純利益`。
- 流量＝金額。費用フローは `--cost`、残る利益は徐々に色が乗る（チャート品質仕様のSankey参照）。
- ノードhoverで金額と対売上比。ⓘで「利益率の正体」を説明。

**④ BS X-Ray（Treemap）**
資産を面積で：`現金 / 棚卸資産 / 有形固定資産 / のれん / 投資有価証券 / その他`。
- 面積＝資産額。タイルに金額と構成比。
- 下部に判定チップ: 現金型 / 設備型 / 在庫型 / M&A型（最大構成カテゴリから自動判定）。

**⑤ CF X-Ray（フロー）**
`営業CF → 投資CF → 財務CF → 現金期末残高` を横並びウォーターフォール。
- 流入 `--pos` / 流出 `--neg`。FCF（営業+投資）を中間に強調表示。
- ⓘ「利益と現金の違い」。

**⑥ SS X-Ray（株主還元）**
`純利益 → 内部留保 / 配当 / 自社株買い → 純資産` の簡易フロー。値が無い期はカードごと非表示。

**⑦ Company Timeline / 推移分析**
- 指標チェックボックス（売上/営業利益/営業CF/純利益…）を複数選択し**1グラフに重ねる**。
- **指数化モード**トグル: 起点年＝100 に正規化。「どれだけ伸びたか」を一目で。
- Rechartsのライン。期は `financial_reports` の `period_type='FY'` を時系列に。

**⑧ Segment X-Ray（事業を見る）— Phase 1.5**
コンセプトの核「企業ではなく事業を見る」。`segments`（有報由来）から各セグメントを示す。
- **セグメント一覧**: 各セグメントをカードで並べ、**事業内容（有報の実テキスト、出典あり）** ＋ 売上・利益・利益率・資産。事業内容はAI生成ではなく `segments.description`。原文抜粋は折りたたみで確認可能（`source_excerpt`）。
- **Segment Bubble**: 横軸=利益率、縦軸=（推移があれば）成長率、円サイズ=売上。どの事業が大きい/稼ぐ/効率的かを一目で。Phase 1.5は成長率が単年で出ない場合、縦軸を資産に代えるか1軸表示にフォールバック。
- Business Mix②の売上/利益タブは、このデータが入ると自動で複数タイル展開。
- 鮮度: 「最新有報（FY2024）時点」と明示。半期の財務カードと期がズレうるので注記。
- ⓘ「会社ではなく事業の単位で強み・偏りがわかる」。

**⑨ Earnings Review（最新決算がある時）**
`ai_insights.kind='earnings_review'` を構造表示: Headline / 主要数値 / 前年差 / 予想進捗 / CF / 株主還元 / AI論点整理。

**⑩ 確認すべき論点（AI Lens）**
原文の「次の論点」を実装する、Snapshotと並ぶ知的価値の中心。`ai_insights.kind='key_points'` として、財務データ＋業種ベンチ＋前年差をコンテキストに、AIが「この企業を理解するうえで確認すべき問い」を3〜5点提示する。
- 例: 「営業CFは潤沢だが投資CFが小さい→成長投資に消極的か、それとも成熟事業か」「のれんが資産の20%→過去のM&Aの減損リスクは」。
- **問いの提示であって答え・評価ではない**。「〜は割安」のような結論は出さない。ユーザー自身の調査の起点を与える。
- やさしいレベルでは1〜2点に絞り平易に。プロは5点まで深く。
- 出典のある数値（コンテキスト）にのみ言及し、推測の数字を作らない。

**⑪ 関連企業（回遊の導線）**
1社で探索を終わらせない。ページ下部に関連企業をチップで提示し、ワンタップで遷移。
- **同業種**（同 sector_code、規模が近い順）/ **規模が近い**（売上が近い）/ **構造が似ている**（資産型が同じ、利益率が近い）の3軸。
- Phase 1は sector_code と売上で算出（追加データ不要）。「似た構造」はBS判定チップ＋利益率帯の一致で簡易に。
- これにより「ニチレイを見た→味の素・ニッスイも見る→食料品業界が掴める」という探索の連鎖が生まれる。

**⑫ 準備中カード（Phase 2の置き場所）**
Capital Allocation / Business Situation / Segment Compare を、薄いプレースホルダカードとして該当位置に置く（Capital AllocationはCF⑤付近、Business Situationは最下部）。見出し＋「Phase 2で対応」の一文のみ。実装は空でよい。

> AIの役割: 説明・翻訳・比較・要約・論点整理のみ。**投資判断・企業批判・格付けはしない**。プロンプトに明記し、断定的評価を出力させない。

### 6.3 比較ビュー（複数社を並べて理解する）
「理解OS」は1社を見るだけでなく**並べて初めて分かる**ことがある。就活生の志望先比較、投資家の候補比較という実利用に直接応える出口機能。
- **比較トレイ**: トップ・企業・業界のどこで「比較に追加」しても、画面下部に常駐する比較トレイ（選択中の企業サムネが溜まる）に飛ぶ。2社以上で「比較する」ボタンが点灯。これにより「どこで何社選んだか」が常に見え、操作が自己説明的になる。
- トレイから比較ビューへ。**同じX-Rayを横並び**（Snapshot指標の表、PL利益率の対比、Business Mixの構成、推移の重ね）。業種ベンチも併走。
- 各指標で最良/最弱をさりげなくハイライト（評価語は使わず、数値の高低のみ）。
- URLに企業コードを持たせ共有可能（`/compare?codes=2871,2802,1332`）。ログイン不要で使える（保存はログイン時）。
- モバイルは2社横並び＋3社目以降は横スワイプ（UX原則のモバイル則）。

### 6.4 ウォッチリスト（持ち帰り）
- 企業を `watchlists` に保存、一言メモ（`watchlist_items.note`）。
- リストから比較ビューへ。就活生は「受ける会社」、投資家は「監視銘柄」として使える。
- ログインユーザーのみ（RLSで本人限定）。未ログイン時はローカル一時保存＋ログイン誘導。

### 6.5 業界ページ（業界を理解の単位にする）
トップの業界マップから業種を選ぶと開く専用ビュー（`/sector/[code]`）。「この業界はどういう世界か」を企業の前に掴ませる、トップダウン探索の受け皿。
- **業界サマリー**: 代表値（営業利益率・ROIC・自己資本比率の中央値と四分位レンジ）、社数、業界合計売上、市場平均との対比。`sector_stats`＋`market_stats` から。
- **業界内分布**: 利益率や規模のヒストグラム/バブルで、その業界の企業がどう散らばっているか。外れ値（突出して稼ぐ企業）も見える。
- **構成企業テーブル**: その業種の全社をランキング表示（トップの第3層と同じ部品を業種固定で再利用）。
- 「業界の数値感」をⓘで言語化（例: 食料品は利益率5%前後が標準、装置産業ではない）。やさしいレベルは平易に。
- 業界ページ同士・企業ページとの相互リンクで回遊を作る（企業ページの業種ラベルから業界ページへ飛べる）。

---

## 7. データ取得パイプライン

**データソース戦略（重要）**: 財務もセグメントも、**EDINET API v2（無料）を主軸**にする。TDnetの公式APIは有料（全量で月24〜34万円）で個人開発のPhase 1には不適、HTMLは動的生成でスクレイピング困難かつ約款上のリスクがあるため、Phase 1では使わない。EDINETは過去10年分の開示を無料で提供し、APIキー登録だけで使える。

トレードオフ: EDINETは2024年4月の制度改正で四半期報告書が廃止され、現在は**半期報告書（年2回）＋有価証券報告書（年1回）**。第1・第3四半期の財務はEDINETに無い（取引所の四半期決算短信に一本化された）。Phase 1は**通期（有報）＋半期で年2回粒度**とし、四半期の即時性が要るならPhase 2でTDnet有料契約を検討。「企業の構造を理解する」目的には年2回で十分。

| 系統 | 取得物 | ソース | 料金 | 頻度 |
|---|---|---|---|---|
| 7-A 企業マスタ | コード/社名/市場区分/業種 | JPX `data_j.xls` | 無料 | 月次 |
| 7-B 財務 | PL/BS/CF | EDINET API v2（有報＋半期） | 無料 | 年2回 |
| 7-C セグメント | 事業内容＋セグメント数値 | EDINET API v2（有報） | 無料 | 年1回 |

7-B と 7-C は**同じEDINET書類（有報）から同時に取れる**ので、パイプラインを共通化できるのが大きな利点。

### 7-A. 企業マスタ（市場区分・業種）
```
JPX「東証上場銘柄一覧」 data_j.xls（月次・前月末時点）
  https://www.jpx.co.jp/markets/statistics-equities/misc/01.html
   → コード/銘柄名/市場・商品区分/33業種区分/業種コード を抽出
   → markets・sectors を seed、companies に upsert（ticker をキー）
```
- **市場区分の正規化**: data_j.xls の「市場・商品区分」は `プライム（内国株式）` `スタンダード（外国株式）` 等の文字列。`(内国株式)/(外国株式)` を `is_domestic` に分離し、市場名を `markets.code`（prime/standard/growth/pro）へ変換する表を `lib/jpx-market-map.ts` に集約。
- **業種**: 「33業種区分」(名称)と「33業種コード」を `sectors` に、`companies.sector_code` で参照。
- **コードは4桁textで先頭ゼロ保持**。月次再取得し、前回との差分から新規上場・廃止・市場変更を検知（7-E）。デフォルト表示は `is_active=true` のみ（廃止企業は履歴として残すが一覧では隠す）。

### 7-B / 7-C. 財務＋セグメント（EDINET API v2・共通パイプライン）
```
EDINET API v2（要・無料APIキー。https://api.edinet-fsa.go.jp/api/v2/）
  1. 書類一覧API（/documents.json?date=YYYY-MM-DD&type=2）で
     有価証券報告書・半期報告書のdocIDを日次で収集
  2. 書類取得API（/documents/{docID}?type=5）でCSV版（2024年4月〜提供）を取得
     ※CSVが最も扱いやすい。type=1のXBRL ZIPでも可
  3. 財務本表 → financial_reports に upsert
     セグメント注記＋「事業の内容」 → segments に upsert
     いずれも docID を冪等キーに
```
- **APIキー**: EDINETでユーザー登録→マイページでAPIキー発行（無料）。`EDINET_API_KEY` を環境変数に。
- **CSV形式を優先**: 2024年4月からEDINET APIはCSV出力（type=5）に対応。XBRLの名前空間解決より格段に楽。財務はCSVの要素ID（`jppfs_cor:NetSales` 等）でマッピング。マッピング表は `lib/edinet-map.ts` に集約。
- **EDINETコード↔証券コード対応**: 書類一覧APIのメタデータに証券コード（`secCode`）が含まれるので、これで `companies.ticker` と突合。対応表を構築・保持。
- **セグメント**: セグメント注記はディメンション（軸）構造。CSVでは軸メンバー列で展開されるため、XBRL直接より解決しやすい。`description`/`source_excerpt` は「事業の内容」テキストから格納し、**AIで生成・脚色しない**。
- **鮮度**: 有報=年1回、半期=年1回。`financial_reports.period_type` は 'FY'（有報）/'H1'（半期）。四半期は持たない前提でUIの鮮度表示を出す。
- **冪等キー** = docID。再実行で重複しないこと。

### 7-D. 集計の再計算（ダッシュボード・業界・ベンチ用）
財務取得（7-B）の後に、集計テーブルを再計算するバッチを必ず走らせる。
```
financial_reports が更新されたら
  → sector_stats（業種×指標×期 の中央値・四分位）を再計算
  → market_stats（全市場/市場区分×指標×期 の平均・中央値・四分位）を再計算
  → market_summary（増収/増益企業比率など）を再計算
```
- SQLの集約（`percentile_cont` で中央値・四分位、`avg`、比率は前年比から算出）で一括計算。`scripts/recompute-stats.ts` か Postgres関数として実装。
- 増収/増益比率は、同一企業の当期と前期（`fiscal_year` 連結）を突き合わせて算出。比較できない企業（前期欠損）は分母から除外し `sample_size` に反映。
- これらは**リクエスト時に計算しない**。トップ・業界・Snapshotは集計済みテーブルを読むだけ。

### 7-E. 新規上場・異動の自動取り込み（差分検知＋初回バックフィル）
上場企業は増減する。新規上場が手作業なしで自動でサイト全体に反映される仕組みを持つ。

```
月次：JPX一覧（7-A）を取得 → 既存 companies と差分検知
  ├ 新コード（新規上場）        → companies に追加 ＋ 初回バックフィル（下記）
  ├ 消えたコード（上場廃止）    → companies に is_active=false（行は消さず履歴を残す）
  └ 市場/業種の変更            → market_code / sector_code を更新

新規企業の初回バックフィル：
  EDINET書類一覧APIを過去方向に検索（その企業のEDINETコードで）
   → 取得可能な有報・半期を遡って取得（EDINETは過去10年保持）
   → financial_reports / segments に upsert
   → テンプレート＋Haiku でテキスト生成（8章）
   → 集計（7-D）を再計算（新規企業が母集団に加わる）
```

- **差分検知**: JPX一覧の毎月のスナップショットを前回と比較。`companies.ticker` の集合差分で新規/廃止を判定。`is_active` 列を `companies` に追加（true既定）。
- **初回バックフィル**: 新規企業は「これから出る開示を待つ」だけでなく、**上場時点で既に存在する過去の有報を遡って取得**する。これがないとTimeline・推移分析が空になる。EDINETコード↔証券コードの対応は書類一覧APIのメタデータ（secCode）から解決。
- **データが薄い新規企業の表示**: 上場直後で有報が1期分しかない等は、Timeline/推移は「データ蓄積中」のEmpty/Partial表示（3.5の状態設計）。業種ベンチは sample_size に反映済み。新規上場という文脈を添えると親切（例「2025年上場・データ蓄積中」）。
- **冪等性**: 差分検知・バックフィルは何度走らせても重複しない（ticker・docID がキー）。月次cronで自動化。

> これにより、新規上場企業は翌月のマスタ更新で自動的にテーブル・業界マップ・ベンチに登場し、取得可能な過去財務まで埋まる。手作業は不要。

### 開発順（ダミー→実データ）
- まず**ダミーJSON（5〜10社分）でUI全体を完成**。`/lib/seed/*.json` を本番スキーマと同形に（markets/sectors/companies/financial_reports/segments/sector_stats/market_stats/market_summary すべて）。集計系もダミー値を入れてダッシュボード・業界マップを先に作る。
- 次にJPX（7-A）→EDINET（7-B/C）→集計再計算（7-D）の順で接続。EDINETは1社の最新有報を手動docID指定で取得・検証してから、書類一覧API経由の自動収集に広げる。
- レート制御に注意（EDINETは常識的な間隔でアクセス。ループにsleepを入れる）。

---

## 8. AIテキスト生成方針（コスト最適化・全社事前生成）

### 生成戦略（コストを最小化する3層）
AIに全部やらせない。**機械的に作れるものはテンプレート（コスト0）、解釈が要るものだけAI**、というハイブリッドにする。

| 用途 | 方式 | 理由 |
|---|---|---|
| `snapshot_summary`（1〜2文の概要） | **テンプレート**（数値＋業種ベンチからルール生成） | 「○○を中核に、営業利益率は業種中央値を上回る」等は数値から機械生成できる |
| 「見どころ3点」（やさしいレベル） | **テンプレート**（最大構成事業＋際立つ指標を規則抽出） | 同上 |
| `earnings_review` の数値部分 | **テンプレート**（前年差・予想進捗は計算結果を文面化） | 計算で出る |
| `earnings_review` の地の文／`key_points`（確認すべき論点） | **AI（Haiku）** | 解釈・問いの提示は機械化しにくい。ここだけAI |

- テンプレート生成は `lib/narrative.ts` に集約（数値→定型文。語彙はレベル別に分岐）。事実のみ、評価語を入れない。
- AIを使うのは「論点」と「レビューの地の文」だけ。これで**AI呼び出しが7〜8割減る**。

### モデルとコスト最適化
- モデルは **Haiku（claude-haiku 系）** を使う。要約・論点抽出は Haiku で十分な品質。Sonnetは使わない（コスト1/3）。
- **バッチAPIで生成**（50%割引）。即時性は不要（決算は年2回しか変わらない）。
- **プロンプトキャッシュ**: 共通のシステムプロンプト・出力スキーマ・禁止事項はキャッシュ（入力側最大90%減）。
- **全社事前生成**: 新規開示を検知したら、その企業のAIテキストをバッチで生成し `ai_insights` に保存。閲覧時はキャッシュを読むだけで**実行時のAI呼び出しゼロ**（表示が速く、コストが予測可能）。
- **永続キャッシュ**: 同一 docID（report）× kind × level は再生成しない。決算が更新された企業だけ差分生成。

> 全社（約4,000社）をHaiku＋バッチ＋キャッシュで事前生成しても、決算更新は年2回なので**AI費は月数ドル規模**に収まる。閲覧時コストは常にゼロ。

### 生成時の制約（品質・安全）
AIに渡すコンテキストは `financial_reports` の数値＋`sector_stats` の業種ベンチ＋前年差。以下を厳守させる：
- 出力は事実の要約・前年比較・業種比較・**論点の提示**に限定。論点は「問い」の形にし、答えや結論を出さない。
- 「買い/売り」「割安/割高」「経営の是非」など**評価・推奨・格付けを出さない**。
- 数値はコンテキストの値のみ使用、推測で数字を作らない。欠損値は渡さない・触れない。
- 業種比較は `sector_stats` の値に基づくときのみ言及。手元に無い比較はしない。
- 日本語、簡潔。レベルに応じて語彙と点数を調整（やさしい=平易・少なめ / プロ=詳細・多め）。
- **構造化出力**: JSON固定スキーマで返させ、パース失敗時はテンプレート文にフォールバック（AIが落ちても画面は成立）。

---

## 9. 実装順序

1. スキーマ作成（markets/sectors/segments/sector_stats/market_stats/market_summary/watchlists含む）+ ダミーseed投入（集計系もダミー値）。
2. design token / 共通レイアウト / 露光アニメ（signature）/ 状態設計（Loading/Empty/Partial/Error）の共通コンポーネント。
3. トップの第3層 企業テーブル（市場・業種フィルタ、業界比カラム、カスタマイズ・ソート・プリセット、サーバー側ページング）。
4. トップの第1層 市場ダッシュボード＋第2層 業界マップ（market_stats/market_summary/sector_statsのダミーから）。3層の連動・折りたたみ。
5. 企業ページ共通仕様（鮮度・欠損フォールバック）+ Snapshot（業種ベンチ併記）→ Business Mix → PL → BS → CF → SS → Timeline → 関連企業 → 準備中カード。
6. 業種ベンチ表示の実接続。テンプレート生成（lib/narrative.ts）＋Haiku論点生成のバッチ関数（全社事前生成→ai_insightsキャッシュ、構造化出力＋テンプレfallback）。
7. 業界ページ（6.5）。トップ業界マップ・企業ページ業種ラベルから相互リンク。
8. JPX企業マスタ取得 → EDINET財務取得 → 集計再計算（7-D）。ダミーを実データに置換。
9. RLS・認証 / saved_views・watchlists・比較ビュー。
10. **【Phase 1.5】** Segment X-Ray（⑧）実装＋EDINET有報でセグメント取得。Business Mixの売上/利益タブをセグメント展開に接続。

> 1〜9がPhase 1、10がPhase 1.5。アクセシビリティ（色非依存・キーボード・SR代替）と状態設計は全STEPで維持するfloorであり、後付けにしない。

---

## 10. 完成の定義（Phase 1）

- トップを開くと**市場ダッシュボード（全上場企業の平均利益率・ROIC・増収増益比率など）**が見え、市場区分を切ると連動する。
- **業界マップ**で33業種の代表値（利益率の目安・社数・規模）が一覧でき、業種で「数値感」が違うことが企業を見る前に掴める。業界ページで業界を深掘りできる。
- 第3層の企業テーブルで、各指標セルに**業界内ポジション**が併記され、表の中でも数値の高低が即座に分かる。
- 実在5〜10社のEDINETデータで、企業ページの全カード（Snapshot / Business Mix / PL / BS / CF / SS / Timeline / 関連企業 / Earnings Review / 確認すべき論点）が破綻なく描画される。
- Snapshotの主要指標に**業種内ポジション**が併走し、市場平均・業種中央値という二重の基準で数字を読める。
- 各企業ページに会計期と提出日が出て、欠損科目があっても画面が壊れない（4状態が用意されている）。
- **2〜4社の比較ビュー**が動き、ウォッチリストに保存でき、関連企業・業界ページで回遊できる。
- 色だけに依存せず、キーボードのみで主要操作が完結する。
- **初見の人が迷わない**: 永続ヘッダーの検索・パンくず・比較トレイで現在地と次の操作が常に分かり、初回ガイドが入口を示す。操作には即時フィードバックがあり、追加・削除は取り消せる。
- **モバイルで完結**: スマホ幅で3層トップ・X-Ray・比較が破綻なく操作でき、主要操作が親指の届く位置にある。
- 「有報を読まなくても、その企業の数字が、市場全体と業界の中でどの位置にあるかとともに3分で掴める」体験が成立している。
