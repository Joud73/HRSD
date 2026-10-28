# منصة التمكين | Tamkeen Platform

## العربية

منصة التمكين هي المنصة الرقمية لمركز التمكين الفني للمنظمات غير الربحية، بإشراف وزارة الموارد البشرية والتنمية الاجتماعية. تتيح المنصة للمنظمات التسجيل والتقييم الذاتي ورفع الشواهد، وللمدققين مراجعة التقييمات واعتمادها، وللإدارة متابعة النتائج.

هذا المستودع هو النموذج الأولي الوظيفي للمنصة، والمرجع المعتمد لتنفيذها على منصة SDP التابعة للوزارة.

### التقنيات

Vite، React 18، TypeScript، Tailwind CSS، shadcn/ui، Motion، Supabase. الواجهة عربية أولاً باتجاه من اليمين إلى اليسار، بخط HRSDGov.

### التشغيل محلياً

```sh
npm install
npm run dev   # http://localhost:8080
```

### متغيرات البيئة (.env)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### أسرار Supabase للدوال (Edge Functions)

تحتاج الدالتان `create-user` و`approve-organization` إلى سرّين:

| السر | الاستخدام | مثال |
|---|---|---|
| `SITE_URL` | عنوان الواجهة؛ تُوجَّه إليه روابط الدعوة إلى صفحة `/set-password` | `https://tamkeen.example.sa` |
| `ALLOWED_ORIGINS` | النطاقات المسموح لها باستدعاء الدوال من المتصفح، مفصولة بفواصل. إن لم يُضبط تُرفض جميع طلبات المتصفح | `https://tamkeen.example.sa,http://localhost:8080` |

```sh
npx supabase secrets set SITE_URL=https://tamkeen.example.sa ALLOWED_ORIGINS=https://tamkeen.example.sa,http://localhost:8080
```

أضف أيضاً `${SITE_URL}/set-password` إلى قائمة Redirect URLs في إعدادات Authentication ← URL Configuration، وإلا لن تفتح روابط الدعوة واستعادة كلمة المرور الصفحة. للتشغيل المحلي (`supabase functions serve`) ضع القيمتين في `supabase/functions/.env`.

### سياسة الفروع

- لا يُدفع أي تعديل مباشرة إلى الفرع `main`.
- يتم العمل على فروع مستقلة (مثل `demo/visual-polish`) ثم الدمج عبر طلب مراجعة.

## English

Tamkeen Platform is the digital platform of the Technical Empowerment Center for Nonprofit Organizations, supervised by the Ministry of Human Resources and Social Development (HRSD). Organizations register, complete a self-assessment and upload evidence; evaluators review and approve; administrators monitor results.

This repository is the functional prototype and the reference for the HRSD SDP implementation.

### Stack

Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, Motion, Supabase. Arabic-first RTL interface using the HRSDGov typeface. Design tokens live in `src/index.css` and `tailwind.config.ts`; all interface copy lives in `src/lib/copy.ts`.

### Run locally

```sh
npm install
npm run dev   # http://localhost:8080
```

Checks: `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run build`.

### Environment variables (.env)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Supabase secrets (Edge Functions)

`create-user` and `approve-organization` need two secrets:

| Secret | Purpose | Example |
|---|---|---|
| `SITE_URL` | Frontend URL; invitation links land on `/set-password` here | `https://tamkeen.example.sa` |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to call the functions from a browser. When unset, every browser request is rejected | `https://tamkeen.example.sa,http://localhost:8080` |

```sh
npx supabase secrets set SITE_URL=https://tamkeen.example.sa ALLOWED_ORIGINS=https://tamkeen.example.sa,http://localhost:8080
```

Also add `${SITE_URL}/set-password` to Authentication → URL Configuration → Redirect URLs, otherwise invitation and password-recovery links will not open the page. For local `supabase functions serve`, put both values in `supabase/functions/.env`.

### Branch policy

- Never push directly to `main`.
- Work on feature branches (for example `demo/visual-polish`) and merge through a reviewed pull request.
