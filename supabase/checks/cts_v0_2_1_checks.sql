-- Verification queries for the loaded tool. Run in SQL Editor on staging, paste results in the progress report.
-- Expected: 5 / 15 / 61 / 378, 13-14-10-14-10 per track, zero orphans, zero empty texts, approved.

-- 1. Counts
select
  (select count(*) from public.tracks     where tool_version_id = md5('cts-v0.2.1')::uuid) as tracks,
  (select count(*) from public.standards  where tool_version_id = md5('cts-v0.2.1')::uuid) as standards,
  (select count(*) from public.indicators where tool_version_id = md5('cts-v0.2.1')::uuid) as indicators,
  (select count(*) from public.items      where tool_version_id = md5('cts-v0.2.1')::uuid) as items;

-- 2. Indicators per track (expected: التوجه 13, الفريق 14, الشراكات 10, البرامج 14, التأثير 10)
select t.number, t.name, count(i.id) as indicators, count(distinct s.id) as standards
from public.tracks t
join public.standards s on s.track_id = t.id
join public.indicators i on i.standard_id = s.id
group by t.number, t.name order by t.number;

-- 3. Items per indicator (expected min 3, max 9, every indicator has at least one item)
select min(c) as min_items, max(c) as max_items, count(*) as indicators_with_items
from (select indicator_id, count(*) c from public.items group by indicator_id) x;

-- 4. Empty texts (expected 0)
select count(*) as empty_texts from public.items
where length(trim(text)) = 0 or length(trim(improvement_action)) = 0
   or length(trim(strength_text)) = 0 or length(trim(opportunity_text)) = 0;

-- 5. Version status and source hash (expected approved, e48c2d8f...)
select code, status, approved_at, left(source_sha256, 16) as sha_prefix from public.tool_versions;

-- 6. Immutability check (expected: ERROR ... immutable)
-- update public.items set text = text where number = 1;
