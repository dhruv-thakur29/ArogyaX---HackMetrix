# ArogyaX — ER Diagram

This diagram mirrors `prisma/schema.prisma` exactly. If the schema changes,
update this diagram in the same commit.

```mermaid
erDiagram
    USER ||--o| PATIENT : has
    USER ||--o| DOCTOR : has
    USER ||--o| HEALTH_WORKER : has

    HEALTH_WORKER ||--o{ PATIENT : registers
    PATIENT ||--o{ CONSULTATION : requests
    DOCTOR ||--o{ CONSULTATION : handles

    CONSULTATION ||--o| SYMPTOM_ASSESSMENT : "linked to"
    PATIENT ||--o{ SYMPTOM_ASSESSMENT : undergoes

    CONSULTATION ||--o{ PRESCRIPTION : produces
    PATIENT ||--o{ PRESCRIPTION : receives
    DOCTOR ||--o{ PRESCRIPTION : issues

    PRESCRIPTION ||--o{ PRESCRIPTION_ITEM : contains
    MEDICINE ||--o{ PRESCRIPTION_ITEM : "prescribed as"

    CONSULTATION ||--o{ FOLLOW_UP : schedules
    PATIENT ||--o{ FOLLOW_UP : has

    PATIENT ||--o{ VITAL : has
    HEALTH_WORKER ||--o{ VITAL : records

    PATIENT ||--o{ VACCINATION : has
    HEALTH_WORKER ||--o{ VACCINATION : records

    PATIENT ||--o{ EMERGENCY_REFERRAL : "referred via"
    USER ||--o{ EMERGENCY_REFERRAL : creates
    HEALTH_WORKER ||--o{ EMERGENCY_REFERRAL : "creates (worker reporting)"
    HOSPITAL ||--o{ EMERGENCY_REFERRAL : receives

    HEALTH_WORKER ||--o{ OFFLINE_ACTION : queues

    USER {
        uuid id PK
        string email UK
        string passwordHash "nullable — OAuth accounts have none"
        enum authProvider "EMAIL | GOOGLE | APPLE"
        enum role
        string fullName
        string phone
        boolean isActive
    }

    PATIENT {
        uuid id PK
        uuid userId FK "unique"
        uuid registeredByWorkerId FK "nullable"
        date dateOfBirth
        string gender
        string village
        string district
        string bloodGroup
    }

    DOCTOR {
        uuid id PK
        uuid userId FK "unique"
        string specialization
        string registrationNumber UK
        int yearsOfExperience
    }

    HEALTH_WORKER {
        uuid id PK
        uuid userId FK "unique"
        string assignedArea
    }

    SYMPTOM_ASSESSMENT {
        uuid id PK
        uuid patientId FK
        uuid consultationId FK "unique, nullable"
        string symptomsText
        enum triageLevel "LOW | MODERATE | URGENT"
        string aiSummary
        string recommendedAction
        string providerName
    }

    CONSULTATION {
        uuid id PK
        uuid patientId FK
        uuid doctorId FK "nullable until a doctor claims it"
        enum status "REQUESTED..CANCELLED"
        string reason
        string doctorNotes
        datetime requestedAt
        datetime acceptedAt
        datetime completedAt
    }

    VITAL {
        uuid id PK
        uuid patientId FK
        uuid recordedByWorkerId FK "required"
        int systolicBP
        int diastolicBP
        int heartRateBpm
        decimal temperatureC
        int spo2Percent
        datetime recordedAt
    }

    VACCINATION {
        uuid id PK
        uuid patientId FK
        uuid recordedByWorkerId FK "required"
        string vaccineName
        int doseNumber
        enum status "SCHEDULED | COMPLETED | MISSED"
        datetime scheduledDate
        datetime administeredDate
    }

    MEDICINE {
        uuid id PK
        string name UK
        string genericName
        string form
        string strength
    }

    PRESCRIPTION {
        uuid id PK
        uuid consultationId FK
        uuid patientId FK
        uuid doctorId FK
        enum status "ACTIVE | COMPLETED | CANCELLED"
        string carePlan
    }

    PRESCRIPTION_ITEM {
        uuid id PK
        uuid prescriptionId FK
        uuid medicineId FK
        string dosage
        string frequency
        int durationDays
        string instructions
    }

    HOSPITAL {
        uuid id PK
        string name UK
        string district
        string phone
        boolean isDemo
    }

    EMERGENCY_REFERRAL {
        uuid id PK
        uuid patientId FK
        uuid createdByUserId FK "required — patient OR health worker"
        uuid createdByWorkerId FK "nullable — set only if creator was a Health Worker"
        uuid hospitalId FK
        string reason
        enum status "PENDING..CLOSED"
        enum triageLevelAtReferral "nullable"
    }

    FOLLOW_UP {
        uuid id PK
        uuid consultationId FK
        uuid patientId FK
        datetime scheduledFor
        enum status "SCHEDULED..CANCELLED"
        string notes
    }

    OFFLINE_ACTION {
        uuid id PK
        string clientActionId UK "idempotency key"
        uuid healthWorkerId FK
        enum actionType
        enum status "PENDING | SYNCED | FAILED"
        json payload
        datetime clientCreatedAt
        datetime syncedAt
    }
```

## Notes on this revision

- Medicine substitution fields on `PRESCRIPTION_ITEM` have been removed —
  they are not part of the current MVP.
- `EMERGENCY_REFERRAL` now has two possible creator relationships:
  `createdByUserId` (always populated, works for Patient or Health Worker)
  and `createdByWorkerId` (populated only when a Health Worker was the
  creator, kept for worker-specific reporting).
- `VITAL.recordedByWorkerId` and `VACCINATION.recordedByWorkerId` are now
  required (solid line, not optional) — the current MVP has no patient
  self-recording workflow for either.
