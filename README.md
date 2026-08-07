# 🏛️ SIC Community Management System

نظام إدارة مجتمع **SIC** — منصة ويب متكاملة مصممة لتبسيط العمليات الإدارية، تتبع الأداء، وإدارة التقييمات والفعاليات الخاصة بالأعضاء التقنيين داخل مجتمع SIC.

---

## 📌 فكرة المشروع

المنصة عبارة عن **لوحة تحكم إدارية مركزية** تخدم الهيكل التنظيمي لمجتمع SIC. تقضي على التتبع اليدوي عن طريق توفير أدوات لـ Track Heads و Vice Heads و HR و Leader المجتمع لتنسيق الأنشطة التشغيلية، إجراء تقييمات بمعايير محددة، إدارة الفعاليات، ومراجعة سجلات النشاط.

### 🎯 المستخدمون المستهدفون

| الدور | الصلاحيات |
|---|---|
| **Leader** | وصول كامل للنظام — إنشاء/حذف مستخدمين، إدارة الفعاليات، مراقبة السجلات، مراجعة التقييمات |
| **HR** | عرض المستخدمين، إنشاء وتعديل الأعضاء التقنيين في كل الـ Tracks، عرض الفعاليات (قراءة فقط) |
| **Track Head** | عمليات خاصة بالـ Track — تقييم الأعضاء، إدارة أعضاء الـ Track، عرض الفعاليات (قراءة فقط) |
| **Vice Head** | وصول محدود (قراءة فقط) ضمن نطاق الـ Track، عرض الفعاليات (قراءة فقط) |

---

## ✨ المميزات الرئيسية

- **🔐 نظام صلاحيات متقدم (RBAC):** صلاحيات هرمية لكل دور في المجتمع مع حماية المسارات والمتحكمات.
- **🔒 عزل الـ Tracks:** كل Track Head يشوف ويتحكم بس في الـ Track بتاعه.
- **👥 سجل الأعضاء التقنيين:** دليل كامل لتتبع الأعضاء وبيانات التواصل والـ Track المخصص ليهم.
- **📊 محرك التقييمات:** إنشاء وقراءة وتعديل وحذف تقييمات الأداء مع درجات (0–100) وملاحظات.
- **📥 تصدير التقييمات:** إمكانية تصدير بيانات التقييمات لملف CSV.
- **🗓️ إدارة الفعاليات:** إنشاء وتعديل وحذف فعاليات ورشات العمل والاجتماعات (Leader فقط)، مع عرض تفاعلي لكل المستخدمين.
- **📋 سجل نشاط غير قابل للتعديل:** تسجيل كل العمليات الإدارية (مين عمل إيه وإمتى) لضمان الشفافية.
- **🎨 واجهة حديثة وديناميكية:** تصميم عصري مع Dark/Light mode وانتقالات سلسة وSkeleton Loaders.

---

## 🛠️ Tech Stack

### Frontend
| التقنية | الوصف |
|---|---|
| **React** v19 | المكتبة الأساسية للـ UI |
| **Vite** v8 | أداة البناء والـ Dev Server |
| **TypeScript** | Type Safety |
| **React Router DOM** v7 | نظام الـ Routing |
| **Axios** | HTTP Client للتواصل مع الـ Backend API |
| **TailwindCSS** v4 | التنسيق والتصميم |
| **Framer Motion** | الأنيميشن |
| **Lucide React** | الأيقونات |
| **Sonner** | إشعارات Toast |

### Backend
| التقنية | الوصف |
|---|---|
| **Node.js + Express** | الـ Runtime والـ Framework |
| **TypeScript** | Type Safety |
| **Prisma ORM** v7 | أداة الربط وإدارة قاعدة البيانات (ORM) |
| **PostgreSQL (Neon)** | قاعدة البيانات العلائقية السحابية |
| **@prisma/adapter-pg + pg** | محرك تشغيل وقناة اتصال PostgreSQL مع Connection Pool |
| **Helmet** | حماية HTTP Headers |
| **Express Rate Limit** | حماية من الـ Brute Force |
| **Zod** | التحقق من صحة المدخلات والبيانات |
| **JWT & Bcryptjs** | إدارة المصادقة (Authentication) وتشفير كلمات المرور |

---

## 📁 Folder Structure

```
sic-management/
├── 📂 backend/                     # الـ Backend (Express API + Prisma)
│   ├── 📂 prisma/                  # إعدادات وقواعد بيانات Prisma
│   │   ├── 📂 migrations/          # سجل هجرات قاعدة البيانات
│   │   └── schema.prisma           # مخطط الجداول والعلاقات لقاعدة البيانات
│   ├── 📂 src/
│   │   ├── 📂 controllers/         # منطق الـ Business Logic
│   │   │   ├── auth.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── evaluation.controller.ts
│   │   │   ├── event.controller.ts       # ✅ جديد — إدارة الفعاليات
│   │   │   ├── log.controller.ts
│   │   │   ├── member.controller.ts
│   │   │   ├── track.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── 📂 lib/                 # المكتبات المشتركة
│   │   │   └── prisma.ts           # تهيئة عميل Prisma مع PostgreSQL Adapter
│   │   ├── 📂 middlewares/         # الـ Middleware (Auth + Rate Limit)
│   │   │   ├── auth.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── 📂 routes/              # تعريف الـ API Endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── evaluation.routes.ts
│   │   │   ├── event.routes.ts           # ✅ جديد — مسارات الفعاليات
│   │   │   ├── log.routes.ts
│   │   │   ├── member.routes.ts
│   │   │   ├── track.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── 📂 scripts/             # سكريبتات مساعدة
│   │   │   └── seed.ts             # تغذية قاعدة البيانات بالبيانات الأساسية
│   │   ├── 📂 types/               # تعريفات TypeScript
│   │   │   └── express.d.ts
│   │   ├── 📂 utils/               # أدوات مساعدة
│   │   │   ├── auditLogger.ts      # نظام تسجيل النشاط بـ EventEmitter
│   │   │   └── cache.ts            # In-Memory Cache
│   │   └── server.ts               # نقطة البداية للسيرفر
│   ├── package.json
│   ├── prisma.config.ts            # ملف إعدادات Prisma v7
│   └── tsconfig.json
│
└── 📂 frontend/                    # الـ Frontend (React + Vite)
    ├── 📂 public/                  # ملفات Static
    ├── 📂 src/
    │   ├── 📂 assets/              # الصور والملفات الثابتة
    │   ├── 📂 components/
    │   │   ├── 📂 common/          # مكونات مشتركة وقابلة لإعادة الاستخدام
    │   │   │   ├── EmptyState.tsx
    │   │   │   ├── MobileEntityCard.tsx
    │   │   │   └── SkeletonLoader.tsx
    │   │   └── 📂 layout/          # مكونات التخطيط
    │   │       └── DashboardLayout.tsx
    │   ├── 📂 contexts/            # React Contexts
    │   │   ├── AuthContext.tsx
    │   │   ├── ConfirmContext.tsx
    │   │   └── ThemeContext.tsx
    │   ├── 📂 pages/               # صفحات التطبيق
    │   │   ├── ActivityLogs.tsx    # سجل النشاط
    │   │   ├── DashboardHome.tsx   # الصفحة الرئيسية
    │   │   ├── Evaluations.tsx     # التقييمات
    │   │   ├── Events.tsx          # ✅ جديد — إدارة الفعاليات
    │   │   ├── Heads.tsx           # إدارة Track Heads
    │   │   ├── Login.tsx           # صفحة تسجيل الدخول
    │   │   ├── Members.tsx         # الأعضاء التقنيون
    │   │   └── ViceHeads.tsx       # إدارة Vice Heads
    │   ├── 📂 routes/              # تعريف الـ Routes
    │   │   └── AppRoutes.tsx
    │   ├── 📂 services/            # خدمات الـ API
    │   │   └── api.ts              # Axios instance مُهيأ مع JWT interceptors
    │   ├── App.tsx                  # المكون الرئيسي
    │   ├── main.tsx                 # نقطة الدخول
    │   └── index.css               # الستايل الرئيسي (TailwindCSS)
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 🗄️ Database Schema

النظام يستخدم **PostgreSQL** عبر Prisma ORM مع الجداول التالية:

| الجدول | الوصف |
|---|---|
| `tracks` | تتبع التراكات المختلفة داخل المجتمع |
| `users` | حسابات المستخدمين (Leader / Head / HR) مع الأدوار والصلاحيات |
| `technical_members` | الأعضاء التقنيون المنتسبون لكل Track |
| `evaluations` | تقييمات الأداء المرتبطة بالأعضاء التقنيين |
| `events` | فعاليات ورشات العمل والاجتماعات المجتمعية |
| `activity_logs` | سجل شامل لجميع العمليات الإدارية |

---

## 🔌 API Endpoints

| الـ Endpoint | الوصف | الأدوار المسموح لها |
|---|---|---|
| `POST /api/auth/login` | تسجيل الدخول والحصول على JWT | جميع المستخدمين |
| `POST /api/auth/logout` | تسجيل الخروج | جميع المستخدمين |
| `GET /api/dashboard` | إحصائيات لوحة التحكم | جميع المستخدمين |
| `GET /api/tracks` | قائمة الـ Tracks | جميع المستخدمين |
| `GET /api/users` | قائمة المستخدمين (مع فلترة بالدور) | Leader, HR |
| `POST /api/users` | إنشاء مستخدم جديد | Leader |
| `PUT /api/users/:id` | تعديل مستخدم | Leader |
| `DELETE /api/users/:id` | حذف مستخدم | Leader |
| `GET /api/technical-members` | قائمة الأعضاء التقنيين | جميع المستخدمين |
| `POST /api/technical-members` | إضافة عضو تقني | Head, HR |
| `PUT /api/technical-members/:id` | تعديل عضو تقني | Head, HR |
| `DELETE /api/technical-members/:id` | حذف عضو تقني | Head, HR |
| `GET /api/evaluations` | قائمة التقييمات | جميع المستخدمين |
| `POST /api/evaluations` | إنشاء تقييم | Head, HR |
| `PUT /api/evaluations/:id` | تعديل تقييم | Head, HR |
| `DELETE /api/evaluations/:id` | حذف تقييم | Head, HR |
| `GET /api/events` | قائمة الفعاليات | جميع المستخدمين |
| `POST /api/events` | إنشاء فعالية | Leader |
| `PUT /api/events/:id` | تعديل فعالية | Leader |
| `DELETE /api/events/:id` | حذف فعالية | Leader |
| `GET /api/activity-logs` | سجل النشاط | Leader, HR |

---

## 🏗️ Architecture Overview

النظام مبني كـ **Client-Server Application** منفصل بالكامل:

```
┌─────────────┐      HTTP/REST       ┌──────────────┐      Prisma ORM      ┌──────────────┐
│             │  ──────────────────► │              │  ──────────────────► │              │
│   React     │                      │   Express    │                      │  PostgreSQL  │
│   Frontend  │  ◄──────────────────  │   Backend    │  ◄──────────────────  │  (Neon DB)   │
│(Vite/Local) │      JSON Response   │(Node.js API) │      Query Results    │              │
└─────────────┘                      └──────────────┘                      └──────────────┘
```

1. الـ **Frontend** (React) يرسل طلبات HTTP باستخدام Axios مع ترويسة المصادقة (`Bearer JWT Token`).
2. الـ **Backend** (Express) يقوم بفك تشفير وتأكيد صحة الـ Token، والتحقق من الصلاحيات (RBAC Middleware).
3. الـ **Prisma ORM** يستقبل الاستعلامات وينفذها على قاعدة بيانات **PostgreSQL** السحابية عبر Neon.
4. يتم تسجيل كل عمليات الكتابة تلقائياً في جدول `activity_logs` عبر **AuditEmitter** (EventEmitter بدون تأثير على الأداء).

---

## 🚀 التشغيل المحلي

### المتطلبات
- **Node.js** (v18+)
- **npm**
- قاعدة بيانات **PostgreSQL** (محلياً أو سحابياً عبر [Neon](https://neon.tech))

### 1. إعداد الـ Backend

```bash
cd backend
npm install
```

أنشئ ملف `.env` في مجلد `backend/`:
```env
PORT=2005
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

طبّق مخطط قاعدة البيانات عبر Prisma:
```bash
npx prisma db push
```

غذّ قاعدة البيانات بالبيانات الأساسية (حساب Leader والـ Tracks):
```bash
npm run seed
```

> **بيانات الدخول الافتراضية للـ Leader:**
> - Email: `leader@sic-communinty.com`
> - Password: `Password123!`

شغّل السيرفر في وضع التطوير:
```bash
npm run dev
```

السيرفر سيعمل على: `http://localhost:2005`

### 2. إعداد الـ Frontend

```bash
cd frontend
npm install
```

أنشئ ملف `.env` في مجلد `frontend/`:
```env
VITE_API_URL=http://localhost:2005/api
```

شغّل تطبيق الـ Frontend:
```bash
npm run dev
```

التطبيق سيعمل على: `http://localhost:5173`

---

## 🔐 نظام الصلاحيات (RBAC)

| الصلاحية | Leader | HR | Head | Vice Head |
|---|:---:|:---:|:---:|:---:|
| إدارة المستخدمين (CRUD) | ✅ | ❌ | ❌ | ❌ |
| عرض المستخدمين | ✅ | ✅ | ❌ | ❌ |
| إدارة الأعضاء التقنيين | ✅ | ✅ | ✅ (Track فقط) | ❌ |
| عرض الأعضاء التقنيين | ✅ | ✅ | ✅ | ✅ |
| إدارة التقييمات | ✅ | ✅ | ✅ (Track فقط) | ❌ |
| عرض التقييمات | ✅ | ✅ | ✅ | ✅ |
| إدارة الفعاليات (CRUD) | ✅ | ❌ | ❌ | ❌ |
| عرض الفعاليات | ✅ | ✅ | ✅ | ✅ |
| عرض سجل النشاط | ✅ | ✅ | ❌ | ❌ |

---

## 📄 License

هذا المشروع للاستخدام الداخلي لمجتمع SIC.
