# رفع موقع Pulse Lab على GitHub واستضافته

الموقع React + Vite، والحاسبات تعمل داخل المتصفح من غير خادم.

## طريقة GitHub Desktop (بدون أوامر)

1. فك ضغط الملف وافتح GitHub Desktop وسجل دخولك بحسابك.
2. اختر **File → Add Local Repository** وحدد مجلد `HeartRateCalculator` الذي يحتوي `package.json` مباشرة.
3. إذا أخبرك البرنامج أن المجلد ليس Repository، اختر **Create a Repository Here**.
4. في **Summary** اكتب `Initial commit: Pulse Lab Purple Theme` واضغط **Commit to main**.
5. اضغط **Publish repository** واختر اسمًا مثل `pulse-lab-heart-rate`.
6. بعد نشر الكود اذهب إلى **Settings → Pages → Build and deployment → Source: GitHub Actions**.
7. انتقل إلى **Actions** ثم شغّل workflow `Deploy Pulse Lab to GitHub Pages` إن لم يُشغَّل تلقائيًا.
8. عندما تظهر حالة نجاح، ستجد رابط الموقع داخل **Settings → Pages**. مثال على الشكل فقط:
   `https://USERNAME.github.io/pulse-lab-heart-rate/`

> لو كان المستودع خاصًا، تأكد من أن خطة GitHub وإعدادات Pages تدعم النشر له. الكود نفسه غير حساس، لكن يمكنك اختيار Public لو مناسب.

## طريقة Vercel (بديل أسهل لربط دومين)

1. بعد نشر Repository على GitHub افتح `https://vercel.com/new`.
2. اختار **Import Git Repository** ثم مستودع Pulse Lab.
3. اختر **Framework: Vite**.
4. **Root Directory:** `/` (جذر المجلد الذي يحتوي على `package.json`).
5. **Build Command:** `npm run build`، **Output Directory:** `dist`.
6. اضغط **Deploy** لتحصل على رابط HTTPS متاح من الموبايل.

## تجربة الكود محليًا

```bash
npm ci
npm test
npm run build
npm run dev
```

لا ترفع `node_modules` أو `dist` بنفسك. ملف `.gitignore` يستبعدهم.

## ملاحظة

ملف GitHub Actions يحسب مسار الـrepository تلقائيًا لصفحات GitHub Pages.
Vercel يبني المشروع من الجذر كالمعتاد.

مراجع رسمية:
- https://vite.dev/guide/static-deploy
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://vercel.com/docs/git
