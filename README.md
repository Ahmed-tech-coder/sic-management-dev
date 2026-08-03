# 🏛️ SIC Community Management System

نظام إدارة مجتمع **SIC** — منصة ويب متكاملة مصممة لتبسيط العمليات الإدارية، تتبع الأداء، وإدارة التقييمات الخاصة بالأعضاء التقنيين داخل مجتمع SIC.

---

## 📌 فكرة المشروع

المنصة عبارة عن **لوحة تحكم إدارية مركزية** تخدم الهيكل التنظيمي لمجتمع SIC. بتقضي على التتبع اليدوي عن طريق توفير أدوات لـ Track Heads و Vice Heads و HR و Leader المجتمع لتنسيق الأنشطة التشغيلية، إجراء تقييمات بمعايير محددة، ومراجعة سجلات النشاط.

### 🎯 المستخدمين المستهدفين

| الدور | الصلاحيات |
|---|---|
| **Leader** | وصول كامل للنظام — إنشاء/حذف مستخدمين، مراقبة السجلات، مراجعة التقييمات |
| **HR** | عرض المستخدمين، إنشاء وتعديل الأعضاء التقنيين في كل الـ Tracks، تصدير البيانات |
| **Track Head** | عمليات خاصة بالـ Track — تقييم الأعضاء، إدارة أعضاء الـ Track |
| **Vice Head** | وصول محدود (قراءة فقط) ضمن نطاق الـ Track |

---

## ✨ المميزات الرئيسية

- **🔐 نظام صلاحيات متقدم (RBAC):** صلاحيات هرمية لكل دور في المجتمع مع حماية المسارات والمتحكمات.
- **🔒 عزل الـ Tracks:** كل Track Head يشوف ويتحكم بس في الـ Track بتاعه.
- **👥 سجل الأعضاء التقنيين:** دليل كامل لتتبع الأعضاء وبيانات التواصل والـ Track المخصص ليهم.
- **📊 محرك التقييمات:** إنشاء وقراءة وتعديل وحذف تقييمات الأداء مع درجات (0–100) وملاحظات.
- **📥 تصدير التقييمات:** إمكانية تصدير بيانات التقييمات لملف CSV.
- **📋 سجل نشاط غير قابل للتعديل:** تسجيل كل العمليات الإدارية (مين عمل إيه وإمتى) لضمان الشفافية.
- **🎨 واجهة حديثة وديناميكية:** تصميم عصري مع Dark/Light mode وانتقالات سلسة.

---

## 🛠️ Tech Stack

### Frontend
| التقنية | الوصف |
|---|---|
| **React** v19 | المكتبة الأساسية للـ UI |
| **Vite** | أداة البناء والـ Dev Server |
| **TypeScript** | Type Safety |
| **React Router DOM** v7 | نظام الـ Routing |
| **TanStack React Query** v5 | إدارة الـ Server State والـ Data Fetching |
| **React Hook Form + Zod** | إدارة الفورم والـ Validation |
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
| **PostgreSQL** | قاعدة البيانات العلائقية لتخزين بيانات النظام |
| **@prisma/adapter-pg + pg** | محرك تشغيل وقناة اتصال PostgreSQL لقاعدة البيانات مع Connection Pool |
| **Helmet** | حماية HTTP Headers |
| **Express Rate Limit** | حماية من الـ Brute Force |
| **Zod** | التحقق من صحة المدخلات والبيانات |
| **JWT & Bcryptjs** | إدارة المصادقة (Authentication) وتشفير كلمات المرور محلياً |

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
│   │   │   ├── log.controller.ts
│   │   │   ├── member.controller.ts
│   │   │   ├── track.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── 📂 lib/                 # المكتبات المشترسة
│   │   │   └── prisma.ts           # تهيئة عميل Prisma Client مع PostgreSQL Adapter
│   │   ├── 📂 middlewares/         # الـ Middleware (Auth + Rate Limit)
│   │   │   ├── auth.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── 📂 routes/              # تعريف الـ API Endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── evaluation.routes.ts
│   │   │   ├── log.routes.ts
│   │   │   ├── member.routes.ts
│   │   │   ├── track.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── 📂 scripts/             # سكريبتات مساعدة (تغذية البيانات)
│   │   │   └── seed.ts
│   │   ├── 📂 types/               # تعريفات TypeScript
│   │   │   └── express.d.ts
│   │   ├── 📂 utils/               # أدوات مساعدة
│   │   │   ├── auditLogger.ts
│   │   │   └── cache.ts
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
    │   │   ├── 📂 common/          # مكونات مشتركة
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
    │   │   ├── ActivityLogs.tsx
    │   │   ├── DashboardHome.tsx
    │   │   ├── Evaluations.tsx
    │   │   ├── Heads.tsx
    │   │   ├── Login.tsx
    │   │   ├── Members.tsx
    │   │   └── ViceHeads.tsx
    │   ├── 📂 routes/              # تعريف الـ Routes
    │   │   └── AppRoutes.tsx
    │   ├── 📂 services/            # خدمات الـ API
    │   │   └── api.ts
    │   ├── App.tsx                  # المكون الرئيسي
    │   ├── App.css                  # الستايل الرئيسي
    │   ├── main.tsx                 # نقطة الدخول
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── postcss.config.js
    └── tsconfig.json
```

---

## 🏗️ Architecture Overview

النظام مبني كـ **Client-Server Application** منفصل بالكامل:

```
┌─────────────┐      HTTP/REST       ┌──────────────┐      Prisma Client      ┌──────────────┐
│             │  ──────────────────►  │              │  ─────────────────────► │              │
│   React     │                      │   Express    │                         │  PostgreSQL  │
│   Frontend  │  ◄──────────────────  │   Backend    │  ◄───────────────────── │   Database   │
│(Vite/Local) │      JSON Response   │(NodeJS Server)│      Query Results      │              │
└─────────────┘                      └──────────────┘                         └──────────────┘
```

1. الـ **Frontend** (React) يرسل طلبات HTTP باستخدام Axios مع ترويسة المصادقة (`Bearer JWT Token`).
2. الـ **Backend** (Express) يقوم بفك تشفير وتأكيد صحة الـ Token، والتحقق من الصلاحيات (RBAC Middleware).
3. الـ **Prisma ORM** يستقبل الاستعلامات من الـ Backend وينفذها على قاعدة بيانات **PostgreSQL** المحلية أو السحابية باستخدام Connection Pool متاح عبر مكتبة `pg`.

---

## 🚀 التشغيل المحلي

### المتطلبات
- **Node.js** (v18+)
- **npm** أو **yarn**
- قاعدة بيانات **PostgreSQL** (محلياً أو سحابياً)

### 1. إعداد الـ Backend

```bash
cd backend
npm install
```

أنشئ ملف `.env` في مجلد `backend/`:
```env
PORT=2005
DATABASE_URL="postgresql://username:password@localhost:5432/sic_management"
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

قم بإنشاء وتطبيق الجداول في قاعدة البيانات عبر Prisma:
```bash
npx prisma db push
```

قم بتغذية قاعدة البيانات بالحسابات والبيانات الأساسية (مثل حساب الـ Leader والـ Tracks الأساسية):
```bash
npm run seed
```

تشغيل السيرفر في وضع التطوير:
```bash
npm run dev
```

### 2. إعداد الـ Frontend

```bash
cd frontend
npm install
```

أنشئ ملف `.env` في مجلد `frontend/`:
```env
VITE_API_URL=http://localhost:2005/api
```

تشغيل تطبيق الـ Frontend:
```bash
npm run dev
```

---

## 📄 License

هذا المشروع للاستخدام الداخلي لمجتمع SIC.
