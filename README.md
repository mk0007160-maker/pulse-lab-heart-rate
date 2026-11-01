# Pulse Lab — Heart Rate Calculator

موقع عربي يعمل على **الكمبيوتر والموبايل** لحساب معدلات النبض فقط، مبني باستخدام React + TypeScript + Vite + Tailwind CSS.

## الإصدار الحالي: Purple Edition

- ألوان داكنة بنفسجية مطابقة للمرجع: خلفية `#0A0A0C`، كروت `#101015`، وAccent `#9333EA`.
- إزالة الشارات/العناصر الزائدة من رأس الصفحة.
- 9 حاسبات للنبض مع شرح مفصّل لكل حاسبة ودعم كامل للموبايل.

لرفع الموقع إلى GitHub أو نشره مجانًا، اقرأ [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md).

## ما الجديد؟

- تصميم عربي حديث بألوان Purple Edition (خلفية سوداء داكنة ولمسات بنفسجية #9333EA) مناسب للشاشات الصغيرة (Responsive) بعرض يبدأ من 320px، وقائمة تنقل أفقية قابلة للتمرير بالموبايل.
- 9 حاسبات: HRmax، RHR، Heart Rate Reserve، Target HR، Karvonen، Training Zones، Intensity، Heart Rate Recovery، Pulse Rate.
- كل حاسبة معها شرح تفصيلي: تعريف، كيفية الاستخدام، مثال حي بالمعادلة، تفسير وتحذيرات ومراجع علمية.
- مثال جاهز من زر «جرّب مثال» ومسح المدخلات من زر «مسح المدخلات».
- لا يرسل بيانات التدريب لأي خادم؛ الحساب داخل المتصفح.
- تصحيح علمي: %HRR تكون عادة أقل من %HRmax لنفس نبض المجهود إذا كانت القراءة بين RHR وHRmax؛ ولا تعني النسبتان نفس طريقة تحديد الشدة.

## التشغيل على الكمبيوتر (Windows)

تحتاج Node.js 18 أو إصدار أحدث.

```powershell
cd E:\HeartRateCalculator
npm install
npm run dev
```

افتح رابط `http://localhost:5173` على الكمبيوتر (أو عنوان Vite الذي يظهر في Terminal).

**اختصار:** على Windows ممكن تدوس مرتين على `START_MOBILE.bat`، هيشغّل السيرفر بشكل يسمح للهاتف بالاتصال ويعرض لك عناوين IPv4.

## فتح الموقع على الموبايل على نفس شبكة Wi-Fi

1. تأكد أن الكمبيوتر والموبايل متصلان **بنفس شبكة Wi-Fi**، بدون VPN يعزل الأجهزة.
2. افتح Terminal داخل المشروع وشغّل:

```powershell
npm run dev -- --host 0.0.0.0
```

3. على Windows، افتح PowerShell ونفّذ `ipconfig` وابحث عن `IPv4 Address` الخاصة بكارت الشبكة الحالي (مثال توضيحي فقط: `192.168.1.5`).
4. افتح متصفح الموبايل على `http://192.168.1.5:5173` **مع استبدال** الرقم بعنوان الكمبيوتر الفعلي. استخدم البورت الذي يظهر لك من Vite إذا كان مختلفًا.
5. إذا لم يفتح، راجع Windows Firewall للسماح بوصول Vite/Node إلى الشبكة المحلية، وتأكد أن شبكة Wi-Fi لا تفعل Client Isolation.

> `localhost` على الموبايل يعني الموبايل نفسه، مش الكمبيوتر؛ لازم عنوان IP للكمبيوتر.

## فتح الموقع من أي موبايل خارج المنزل

للحصول على رابط عام على الإنترنت لا يتطلب بقاء الكمبيوتر شغالًا، **انشر** نسخة الـ production على خدمة استضافة مواقع ثابتة (مثلاً Vercel أو Netlify أو Cloudflare Pages). النشر غير مضمن في المشروع ويتطلب إنشاء مشروع على خدمة الاستضافة:

```powershell
npm run build
```

- Build command: `npm run build`
- Output / Publish directory: `dist`
- Framework: `Vite`

يمكن رفع المشروع إلى GitHub ثم ربط المستودع بخدمة الاستضافة. بعد النشر تحصل على HTTPS URL يفتح من أي هاتف؛ هذا الملف وحده **لا** ينشئ رابطًا عامًا.

## الاختبارات

```powershell
npm test
npm run build
npm run preview
```

## تنظيم الملفات

- `src/lib/formulas.ts` — المعادلات الحسابية المستقلة.
- `src/lib/model.ts` — التحقق من المدخلات ومشاركة قيم HRmax وRHR وHRR بين جميع الحاسبات.
- `src/lib/formulas.test.ts` — اختبارات المعادلات.
- `src/App.tsx` — لوحة التحكم والملخص والتنقل.
- `src/tabs.tsx` — الحاسبات وشروحاتها ومراجعها.
- `src/ui.tsx` — مكوّنات العرض المشتركة.
- `src/index.css` — التصميم، ودعم الموبايل والتابلت.

## المراجع

- [American Heart Association — Target Heart Rates](https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates)
- [Tanaka et al. (2001)](https://pubmed.ncbi.nlm.nih.gov/11153730/)
- [Nes et al. (2013)](https://pubmed.ncbi.nlm.nih.gov/22376273/)
- [Gulati et al. (2010)](https://pubmed.ncbi.nlm.nih.gov/20585008/)
- [Karvonen et al. (1957)](https://pubmed.ncbi.nlm.nih.gov/13470504/)
- [Cleveland Clinic — Heart Rate Recovery](https://my.clevelandclinic.org/health/articles/23490-heart-rate-recovery)
- [INTERLIVE Network — HR zones review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11946962/)
- [Mayo Clinic — Resting Heart Rate](https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate/faq-20057979)

**تنبيه:** أداة تعليمية رياضية ولا تقدم تشخيصًا أو تعليمات طبية شخصية؛ نتائج HRmax المقدرة من العمر قد تختلف كثيرًا عن قياس الفرد.


## ألوان Purple Edition

تم تطبيق لوحة الألوان الجديدة المستوحاة من مرجع المستخدم: خلفية `#0A0A0C`، لوحات `#101015`، حقول `#1A1A22`، أزرار بنفسجي `#9333EA`، ونصوص بارزة `#C084FC`. تم تغيير ملفات CSS وTailwind والأيقونة ولون شريط المتصفح دون المساس بمعادلات حساب النبض أو الشروحات أو دعم الموبايل.

## تثبيت Pulse Lab مجانًا كتطبيق

يمكن تثبيت Pulse Lab على Android من قائمة Chrome > Install app، وعلى iPhone من Safari > Share > Add to Home Screen. الحاسبات تعمل بدون إنترنت بعد أول فتح وتحميل ملفات التطبيق. روابط المصادر العلمية الخارجية تحتاج إنترنت.

لمزيد من التفاصيل اقرأ [APP_INSTALL.md](APP_INSTALL.md).
