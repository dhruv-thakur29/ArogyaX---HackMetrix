# ArogyaX — Database Design

## 1. Overview

This document describes the PostgreSQL + Prisma database layer for ArogyaX,
revised to match the **current** application architecture: UI → Server
Action/API → Service Layer → Repository Layer → Mock Repository **or**
Prisma Repository → PostgreSQL. The Prisma repository implementation plugs
into the existing repository interface; no frontend changes are required.

## 2. Technology

- **Database:** PostgreSQL
- **ORM:** Prisma
- **IDs:** UUID (`@default(uuid())`) on all major entities
- **Timestamps:** `createdAt` / `updatedAt` on all mutable entities
- **Password storage:** bcrypt hashes only, and only for `authProvider = EMAIL` accounts (see §9)

## 3. Entity List

| Model | Purpose |
|---|---|
| `User` | Login identity + role, shared by all four roles |
| `Patient` | Patient profile, owns all downstream health data |
| `Doctor` | Doctor profile |
| `HealthWorker` | Community health worker profile |
| `SymptomAssessment` | AI triage output (informational only) |
| `Consultation` | Patient ↔ Doctor consultation workflow |
| `Vital` | A single vitals reading for a patient |
| `Vaccination` | A vaccination record/schedule entry |
| `Medicine` | Shared medicine catalog |
| `Prescription` | A prescription issued during a consultation |
| `PrescriptionItem` | One medicine line-item on a prescription |
| `Hospital` | Demo referral-destination directory |
| `EmergencyReferral` | A referral from a patient to a hospital |
| `FollowUp` | A scheduled follow-up tied to a consultation |
| `OfflineAction` | Server-side landing/audit record for a synced offline action |

### Entities intentionally **not** created

- **`HealthRecord`** — the "Health Records" patient page is an *aggregate
  view* (vitals + vaccinations + prescriptions + consultation history), not
  distinct data. It's composed at the Service Layer from the existing
  tables rather than duplicated into its own model.
- **Separate `EmergencyContact` table** — kept as two denormalized fields
  on `Patient` since only one emergency contact per patient is needed.

## 4. What changed in this revision, and why

| # | Change | Reason |
|---|---|---|
| 1 | **Removed medicine substitution** (`substituteMedicineId`, `substitutionStatus`, `substitutionApprovedByDoctorId/At`, and the `SubstitutionApprovalStatus` enum) from `PrescriptionItem` | Not part of the current MVP; kept the schema unnecessarily complex. If reintroduced later, add the fields back onto `PrescriptionItem` directly. |
| 2 | **`EmergencyReferral.createdByUserId` (required, → `User`) added**; `createdByWorkerId` (optional, → `HealthWorker`) retained | The current app lets both a Patient and a Health Worker create a referral. `createdByUserId` always identifies the creator regardless of role; `createdByWorkerId` is kept only as a denormalized convenience for health-worker-specific reporting, and is `null` when a patient self-creates a referral. |
| 3 | **`Vital.recordedByWorkerId` is now required** (was optional) | The current MVP has no patient self-recorded vitals workflow — every vitals row is created by a Health Worker. |
| 4 | **`Vaccination.recordedByWorkerId` is now required** (was optional) | Same reasoning as #3 — no patient self-recording workflow exists today. |
| 5 | **`User.passwordHash` is now optional**; added `authProvider` enum (`EMAIL`/`GOOGLE`/`APPLE`, default `EMAIL`) | Prepares for Google/Apple sign-in without implementing OAuth in Prisma. OAuth accounts have no local password; `authProvider` records which method was used so the app layer knows when a password is expected. |
| 6 | **Documented (not enforced in SQL) the role↔profile invariant** | Prisma/PostgreSQL can't declaratively express "exactly one optional relation matches `role`" without triggers, which is disproportionate for this MVP. This is now an explicit Service/Auth-layer responsibility — see §8. |
| 7 | **Seed rewritten**: no `Math.random()`, fixed synthetic phone numbers, `upsert` on natural unique keys (`User.email`, `Medicine.name`, `Hospital.name`, `Patient/Doctor/HealthWorker.userId`) for identity/catalog data, and a deterministic wipe-and-rebuild for transactional/clinical demo data | The seed must produce identical output on every run and be safe to re-run against the same demo database. |
| 8 | **`OfflineAction.clientActionId` added (`String @unique`)** | Offline sync retries the same queued action if a submission is interrupted; without an idempotency key, a retry would create duplicate Vitals/Vaccinations/Referrals/Patients. The sync endpoint should `upsert` on `clientActionId`. |
| 9 | **`Hospital.name` made unique** | Needed so seed data can `upsert` hospitals idempotently; a reasonable constraint for a small demo directory. |
| 10 | Indexes reviewed and extended (`Prescription.consultationId`, `FollowUp.consultationId`, `EmergencyReferral.createdByUserId/createdByWorkerId`, `Vital/Vaccination.recordedByWorkerId`, `Patient/Doctor/HealthWorker.userId`) | Match the actual query patterns of the current MVP workflows (see §7). |

## 5. Relationships

- `User` 1–1 `Patient` / `Doctor` / `HealthWorker` (at most one, matching `role`; `ADMIN` has none)
- `Patient` 1–N `Consultation`, `Vital`, `Vaccination`, `SymptomAssessment`,
  `EmergencyReferral`, `FollowUp`, `Prescription`
- `Doctor` 1–N `Consultation`, `Prescription`
- `HealthWorker` 1–N `Vital` (recorded), `Vaccination` (recorded),
  `EmergencyReferral` (as `createdByWorker`), `OfflineAction`, and
  optionally `Patient` (registered)
- `User` 1–N `EmergencyReferral` (as `createdByUser` — always set, patient or worker)
- `Consultation` 1–1 `SymptomAssessment` (optional), 1–N `Prescription`, 1–N `FollowUp`
- `Prescription` 1–N `PrescriptionItem`
- `PrescriptionItem` N–1 `Medicine`
- `EmergencyReferral` N–1 `Hospital`

No genuine many-to-many relationships exist — the "many doctors see many
patients" relationship resolves through `Consultation`, which already
carries its own status and timestamps.

## 6. Primary Keys

All models use a UUID primary key (`id String @id @default(uuid())`),
generated by Prisma/PostgreSQL.

## 7. Foreign Keys, Constraints & Indexes

| Model | Foreign keys | Delete behavior | Indexes |
|---|---|---|---|
| `Patient` | `userId → User` (cascade), `registeredByWorkerId → HealthWorker` (restrict, optional) | Cascade on `User` delete | `userId`, `district` |
| `Doctor` | `userId → User` (cascade) | Cascade on `User` delete | `userId`, `specialization` |
| `HealthWorker` | `userId → User` (cascade) | Cascade on `User` delete | `userId`, `assignedArea` |
| `Consultation` | `patientId → Patient` (cascade), `doctorId → Doctor` (restrict, optional) | Cascade on `Patient` delete | `patientId`, `doctorId`, `status` |
| `SymptomAssessment` | `patientId → Patient` (cascade), `consultationId → Consultation` (restrict, optional, unique) | Cascade on `Patient` delete | `patientId`, `triageLevel` |
| `Vital` | `patientId → Patient` (cascade), `recordedByWorkerId → HealthWorker` (restrict, **required**) | Cascade on `Patient` delete | `(patientId, recordedAt)`, `recordedByWorkerId` |
| `Vaccination` | `patientId → Patient` (cascade), `recordedByWorkerId → HealthWorker` (restrict, **required**) | Cascade on `Patient` delete | `(patientId, status)`, `recordedByWorkerId` |
| `Prescription` | `consultationId → Consultation` (cascade), `patientId → Patient` (cascade), `doctorId → Doctor` (restrict) | Cascade on `Consultation`/`Patient` delete | `patientId`, `doctorId`, `consultationId` |
| `PrescriptionItem` | `prescriptionId → Prescription` (cascade), `medicineId → Medicine` (restrict) | Cascade on `Prescription` delete; **restrict** on `Medicine` delete | `prescriptionId`, `medicineId` |
| `EmergencyReferral` | `patientId → Patient` (cascade), `createdByUserId → User` (restrict), `createdByWorkerId → HealthWorker` (restrict, optional), `hospitalId → Hospital` (restrict) | Cascade on `Patient` delete; **restrict** on `Hospital`/`User`/`HealthWorker` delete | `patientId`, `status`, `createdByUserId`, `createdByWorkerId` |
| `FollowUp` | `consultationId → Consultation` (cascade), `patientId → Patient` (cascade) | Cascade on either parent delete | `(patientId, scheduledFor)`, `consultationId`, `status` |
| `OfflineAction` | `healthWorkerId → HealthWorker` (restrict) | Restrict | `clientActionId` (unique), `(healthWorkerId, status)` |

**Delete-behavior rationale (Change 16):** patient-owned clinical data
(`Consultation`, `Vital`, `Vaccination`, `Prescription`, `FollowUp`,
`EmergencyReferral`, `SymptomAssessment`) cascades when the owning
`Patient`/`User` row is removed — acceptable for a development/demo
database where synthetic profiles get cleaned up. Shared reference data
(`Medicine`, `Hospital`) and role profiles referenced by clinical rows
(`Doctor`, `HealthWorker` on records they authored) use the Prisma default
(**Restrict**) so a catalog row or profile can never be deleted out from
under historical records — the delete would simply fail until the
dependent rows are reassigned or removed first.

Other constraints:

- `User.email`, `Doctor.registrationNumber`, `Medicine.name`,
  `Hospital.name` — unique.
- `SymptomAssessment.consultationId` — unique when set (a consultation has
  at most one linked triage record).
- `OfflineAction.clientActionId` — unique (idempotency key, see §4 row 8).

## 8. Role-Based Access & Profile-Consistency Considerations

- A **Patient** should only ever query rows where `patientId` matches their
  own `Patient.id`.
- A **Doctor** should only see `Consultation`/`Prescription` rows where
  `doctorId` matches their own `Doctor.id`.
- A **Health Worker** should only see patients/records they registered or
  recorded, optionally scoped further by `assignedArea`.
- An **Admin** has read access across all tables for analytics, but should
  not get write access to clinical fields via the database layer — that
  stays a Doctor-only service-layer rule.
- **Role↔profile invariant (Change 6):** the database cannot enforce that
  a `DOCTOR`-role user only ever gets a `Doctor` profile (and not a
  `Patient`/`HealthWorker` one) without triggers. This is enforced in the
  Service/Auth layer: user + profile creation happens in one transaction,
  using the profile type that matches `role`, and no repository method
  should ever attach a second profile type to an existing user.

## 9. Authentication Fields

`User.passwordHash` is nullable and `User.authProvider` defaults to
`EMAIL`. The intent:

- `authProvider = EMAIL` → `passwordHash` should be set (enforced by the
  app layer, e.g. a Zod refinement on the signup Server Action).
- `authProvider = GOOGLE` / `APPLE` → `passwordHash` stays `null`; identity
  is established by the OAuth provider, not a local credential.

Prisma/PostgreSQL intentionally does not implement OAuth itself — that
belongs to the application's auth layer (e.g. NextAuth or a custom
provider), which only needs to upsert a `User` row with the right
`authProvider` and `email`.

## 10. Healthcare Data Safety Considerations

- **AI triage is never a diagnosis.** `SymptomAssessment` remains a
  separate model from `Consultation`/`Prescription`, with only
  `aiSummary` and `recommendedAction` — both explicitly informational.
- **No medicine substitution in the current MVP** (Change 1) — removed
  rather than left as unused complexity.
- **Sensitive data minimization** — no ID numbers, no payment details, no
  free-text diagnosis field on `Patient`.
- **Synthetic data only** — `Hospital.isDemo` defaults to `true`; every
  seeded record is documented as fictional in `prisma/seed.ts`.
- **Password hashing** — bcrypt only, and only stored where relevant (§9).

## 11. Seed Data Explanation

`prisma/seed.ts`:

- 1 admin, 3 doctors, 3 health workers, 12 patients — the four README demo
  accounts (`admin@arogyax.demo`, `doctor@arogyax.demo`,
  `healthworker@arogyax.demo`, `patient@arogyax.demo`, all password
  `demo1234`) plus additional synthetic accounts for a fuller demo.
- Identity/catalog data (`User`, `Patient`, `Doctor`, `HealthWorker`,
  `Medicine`, `Hospital`) is `upsert`ed on natural unique keys, so
  re-running the seed never duplicates them.
- Transactional/clinical demo data (`Consultation`, `Vital`,
  `Vaccination`, `SymptomAssessment`, `Prescription`,
  `PrescriptionItem`, `FollowUp`, `EmergencyReferral`, `OfflineAction`) is
  deleted and deterministically rebuilt on every run — safe because this
  is a demo-only database seeded with synthetic data.
- Fixed dates and fixed phone numbers everywhere — **no `Math.random()`**.
- Demonstrates every current MVP workflow: Patient → Consultation,
  Doctor → Consultation/Prescription/FollowUp, Health Worker →
  Vitals/Vaccination, both Patient-created and Health-Worker-created
  Emergency Referrals, AI triage, and one synced + one pending
  `OfflineAction`.

## 12. How the Backend Should Interact with the Database

See `docs/database/backend-integration.md`.

## 13. Migration Instructions

```bash
npx prisma generate
npx prisma migrate dev --name init
```

**Migration not generated because DATABASE_URL/PostgreSQL was unavailable
in this environment.** Run the command above against a real PostgreSQL
connection to generate `prisma/migrations/<timestamp>_init/migration.sql`,
then commit the generated migration folder.

## 14. Seed Instructions

```bash
npx prisma db seed
```

Requires the `prisma.seed` entry in `package.json` — see
`backend-integration.md` §5 for the exact snippet.

## 15. Environment Variable Requirements

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/arogyax?schema=public"
```

Never commit a real `DATABASE_URL` — only `.env.example` with a placeholder
should be committed.
