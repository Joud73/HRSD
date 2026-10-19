# سيناريوهات اختبار الصلاحيات (staging)

الهدف: إثبات أن كل دور يرى ويعدّل ما يخصه فقط، وأن تغيير حالة التقييم لا يتم إلا عبر `transition_assessment()`.

## حسابات الاختبار

| الدور | البريد | ملاحظة |
|---|---|---|
| أدمن | admin.test@tamkeen.local | |
| منظمة أ | org.a@tamkeen.local | مرتبطة بـ "منظمة الاختبار أ" |
| منظمة ب | org.b@tamkeen.local | مرتبطة بـ "منظمة الاختبار ب" |
| مدقق 1 | evaluator1@tamkeen.local | مسند إلى تقييم منظمة أ |
| مدقق 2 | evaluator2@tamkeen.local | غير مسند |

تُنشأ من لوحة Supabase: Authentication ← Users ← Add user (Auto confirm). ثم يُشغَّل `supabase/seed/test_accounts.sql` لربط الأدوار والمنظمات.

## طريقة التنفيذ

من Console المتصفح بعد تسجيل الدخول بالحساب المطلوب على رابط staging. الكائن `supabase` متاح عبر الواجهة، أو يُستخدم SQL Editor مع:

```sql
set role authenticated;
set request.jwt.claims = '{"sub":"<user-uuid>","role":"authenticated"}';
```

## الحالات

| # | الحساب | الفعل | المتوقع |
|---|---|---|---|
| 1 | منظمة أ | `select count(*) from items` | 378 |
| 2 | منظمة أ | `select * from ensure_my_assessment()` | صف واحد بحالة draft |
| 3 | منظمة ب | `select count(*) from assessments` | 0 (لا ترى تقييم أ) |
| 4 | منظمة أ | `update profiles set organization_id = '<id منظمة ب>' where id = auth.uid()` | خطأ: can only be changed by an administrator |
| 5 | منظمة أ | `update assessments set status = 'approved'` | 0 صفوف أو خطأ |
| 6 | منظمة أ | insert في item_responses على تقييمها ثم `transition_assessment(id, 'submitted')` | الحالة submitted |
| 7 | منظمة أ | تعديل item_responses بعد الإرسال | 0 صفوف |
| 8 | مدقق 2 | `select count(*) from assessments` | 0 |
| 9 | مدقق 1 | `select count(*) from assessments` بعد الإسناد | 1 |
| 10 | مدقق 1 | `transition_assessment(id, 'approved')` من حالة submitted | خطأ: not allowed |
| 11 | مدقق 1 | `transition_assessment(id, 'under_review')` قبل فترة المراجعة | خطأ: not allowed |
| 12 | أدمن | `transition_assessment(id, 'under_review')` بلا ملاحظة | خطأ: requires a note |
| 13 | أدمن | نفس الأمر مع ملاحظة | under_review، ومسجل في history |
| 14 | مدقق 1 | `update item_responses set is_met = false` | 0 صفوف (لا يغيّر إجابة المنظمة) |
| 15 | مدقق 1 | `transition_assessment(id, 'returned')` بلا ملاحظة | خطأ: note is required |
| 16 | منظمة ب | رفع ملف إلى bucket evidences في مجلد تقييم أ | خطأ |
| 17 | منظمة أ | `select * from assessment_status_history` | ترى سجل تقييمها فقط |
| 18 | مستخدم غير مسجل | `select * from items` بمفتاح publishable | خطأ permission denied |
| 19 | أي حساب | Supabase Dashboard ← Advisors ← Security | لا تحذيرات من نوع ERROR |

## النتيجة

تُوثَّق في جدول: الحالة، المتوقع، الفعلي، النتيجة (نجح / فشل)، لقطة أو نص الخطأ.
