-- طموحي programs: DEMO placeholders until the owner's program list arrives. Staging only. Idempotent.
-- Five clearly named demo programs (code DEMO-T{n}), one per track of the open cycle's tool, each mapped to every
-- indicator of its track and recommended for review levels 0 to 2 (v_program_recommendations, default rule).
-- Replace this file with the real list when it is available; the codes DEMO-T* are removed by that script.

begin;

with tracks as (
  select t.id, t.number, t.name
  from public.tracks t
  join public.assessment_cycles c on c.tool_version_id = t.tool_version_id and c.status = 'open'
)
insert into public.programs (code, title, summary, track_id, level_min, level_max, duration_hours, delivery, url, sort_order)
select 'DEMO-T' || t.number,
       'برنامج تجريبي: ' || t.name,
       'برنامج تجريبي لعرض الاقتراحات، يُستبدل بقائمة برامج طموحي المعتمدة.',
       t.id, 0, 2, 6, 'online',
       'https://example.org/tumohi/demo-t' || t.number,
       t.number
from tracks t
on conflict (code) do update set
  title = excluded.title, summary = excluded.summary, track_id = excluded.track_id,
  level_min = excluded.level_min, level_max = excluded.level_max, duration_hours = excluded.duration_hours,
  delivery = excluded.delivery, url = excluded.url, sort_order = excluded.sort_order, is_active = true, updated_at = now();

delete from public.program_indicators pi using public.programs p where p.id = pi.program_id and p.code like 'DEMO-T%';

insert into public.program_indicators (program_id, indicator_id)
select p.id, ind.id
from public.programs p
join public.standards s on s.track_id = p.track_id
join public.indicators ind on ind.standard_id = s.id
where p.code like 'DEMO-T%';

commit;

select p.code, p.title, p.level_min, p.level_max, count(pi.indicator_id) as indicators
from public.programs p
left join public.program_indicators pi on pi.program_id = p.id
where p.code like 'DEMO-T%'
group by p.code, p.title, p.level_min, p.level_max
order by p.code;
