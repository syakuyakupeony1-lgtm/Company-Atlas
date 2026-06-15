-- companies テーブルに EDINETコードを追加（EDINET財務データ連携に使用）
alter table companies add column if not exists edinet_code text unique;
create index if not exists on companies (edinet_code);

-- EDINETコードと ticker の対応を一括投入するためのヘルパービュー（任意）
-- edinet_code は "E" + 5桁数字（例: "E00001"）
