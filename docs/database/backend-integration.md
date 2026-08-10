# ArogyaX — Backend Integration Contract

Tells the backend developer(s) how to use the Prisma/PostgreSQL layer
inside the existing Service Layer / Repository Pattern architecture. This
does not implement API routes beyond the patterns shown below.

## 1. Request flow

```text
UI
   ↓
Server Action / API Route
   ↓
Service Layer (existing: patientService, consultationService, ...)
   ↓
Repository Interface
   ↓
Mock Repository  OR  Prisma Repository   <-- Prisma Repository is new
   ↓
lib/db/prisma.ts (PrismaClient singleton)
   ↓
PostgreSQL
```

The Mock Repository and the new Prisma Repository implement the **same**
repository interface. Existing services do not change — only which
repository implementation they're constructed with changes (e.g. an
environment flag or a dependency-injection point).

## 2. Per-entity operations

```text
Patient
- Create   (Health Worker registration; self-registration via signup)
- Read     (by id, by userId, list/search by name or district)
- Update   (profile fields)

Consultation
- Create        (Patient requests — doctorId starts null)
- List          (by patient, by doctor queue, by status)
- Claim/Accept   (Doctor sets doctorId + status ACCEPTED)
- Update status  (ACCEPTED → IN_PROGRESS → COMPLETED/CANCELLED)
- Complete       (sets completedAt, attaches doctorNotes)

SymptomAssessment
- Create  (from the AI symptom-checker abstraction layer)
- Read    (by patient, optionally linked to a Consultation)

Vital
- Create  (Health Worker only — recordedByWorkerId is required)
- List    (by patient, most recent first)

Vaccination
- Create  (Health Worker only — recordedByWorkerId is required)
- Read    (by patient)
- Update  (status transitions: SCHEDULED → COMPLETED/MISSED)

Prescription
- Create  (Doctor, tied to a Consultation)
- Read    (by patient, by consultation)

PrescriptionItem
- Create  (as part of Prescription creation — no substitution workflow)

EmergencyReferral
- Create        (Patient OR Health Worker — see §3)
- Read
- Update status  (PENDING → ACCEPTED → IN_TRANSIT → ADMITTED → CLOSED)

FollowUp
- Create  (Doctor, tied to a Consultation)
- Read    (by patient)
- Update status (SCHEDULED → COMPLETED/MISSED/CANCELLED)

OfflineAction
- Upsert on clientActionId  (landing point when the client replays a
  queued offline action — see §4)
- Update status (PENDING → SYNCED/FAILED)
```

## 3. Creating an Emergency Referral (Patient vs. Health Worker)

Both roles call the same repository method; the service layer decides
which fields to populate based on the authenticated session:

```ts
// Patient self-creates a referral
emergencyReferralRepository.create({
  patientId: session.patient.id,
  createdByUserId: session.user.id,
  createdByWorkerId: null,
  hospitalId,
  reason,
});

// Health Worker creates a referral on a patient's behalf
emergencyReferralRepository.create({
  patientId,
  createdByUserId: session.user.id,       // the worker's own User.id
  createdByWorkerId: session.healthWorker.id,
  hospitalId,
  reason,
});
```

`createdByUserId` is always populated and always identifies who actually
created the row. `createdByWorkerId` is populated only in the second case,
so Health-Worker-specific reporting queries can filter on it directly
without joining through `User`.

## 4. Offline-first: client ↔ server separation, and idempotency

```text
Browser
   ↓
IndexedDB / Local Storage        (client-side, existing lib/offline/*)
   ↓
Offline Action Queue             (existing lib/offline/syncQueue.ts)
   ↓
Connection Restored
   ↓
Backend API  (e.g. POST /api/sync)
   ↓
Prisma       (creates domain row AND an OfflineAction audit row)
   ↓
PostgreSQL
```

**PostgreSQL is never the offline store.** `OfflineAction` is a
server-side landing/audit record for actions captured offline and later
synced.

**Idempotency:** each action queued offline should be assigned a
`clientActionId` (e.g. a UUID generated at queue-time in
`lib/offline/syncQueue.ts`). The sync endpoint should `upsert` on it:

```ts
await prisma.offlineAction.upsert({
  where: { clientActionId: action.clientActionId },
  update: {}, // already processed — no-op, prevents duplicate domain rows
  create: {
    clientActionId: action.clientActionId,
    healthWorkerId: session.healthWorker.id,
    actionType: action.type,
    payload: action.payload,
    clientCreatedAt: action.capturedAt,
    status: "PENDING",
  },
});
```

Only create the underlying domain row (Vital / Vaccination / Patient /
EmergencyReferral) the *first* time an `OfflineAction` for that
`clientActionId` is created — wrap both in a single
`prisma.$transaction` so a retry of the same offline action never
double-creates a Vital, Vaccination, Patient, or EmergencyReferral.

Actions worth syncing, per the current Health Worker workflow:

- `RECORD_VITALS` → creates a `Vital` row
- `RECORD_VACCINATION` → creates a `Vaccination` row
- `REGISTER_PATIENT` → creates a `User` + `Patient` row
- `CREATE_EMERGENCY_REFERRAL` → creates an `EmergencyReferral` row

## 5. package.json changes for `prisma db seed`

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

And ensure these are present in `dependencies`/`devDependencies`:

```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "bcryptjs": "^2.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "ts-node": "^10.x",
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/bcryptjs": "^2.x"
  }
}
```

## 6. Role-aware access — enforcement point

The database does not enforce role logic. Every query must be scoped in
the Service Layer using the authenticated session:

- Resolve `session.user.id` → look up the matching `Patient` / `Doctor` /
  `HealthWorker` row.
- Scope every query by that id (`WHERE patientId = session.patient.id`,
  etc.) rather than trusting an id passed in the request body.
- User/profile creation must happen in one transaction using the profile
  type matching `role` — see `database-design.md` §8 for the invariant
  this protects.

## 7. What NOT to do

- Do not call `prisma` directly from a page or component — always go
  through the Service Layer.
- Do not add medicine-substitution fields back onto `PrescriptionItem`
  unless the application actually implements that workflow.
- Do not skip the `clientActionId` idempotency check when building the
  sync endpoint — offline retries are expected, not an edge case.
- Do not store AI triage results as if they were confirmed diagnoses
  anywhere in the UI layer — `SymptomAssessment` is informational only.
