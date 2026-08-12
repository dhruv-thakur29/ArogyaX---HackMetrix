// prisma/seed.ts
//
// ArogyaX synthetic seed data — REVISED for determinism + idempotency.
//
// Everything in this file is 100% fictional demo data created for a
// hackathon prototype. No real patient, doctor, or medical
// information is used anywhere in this script.
//
// Determinism: no Math.random() anywhere — every id-lookup, phone
// number, and date is a fixed value, so re-running this script always
// produces the same data.
//
// Idempotency strategy:
//   - Users, Medicines, and Hospitals are `upsert`ed on their natural
//     unique keys (email / name), so re-running never creates
//     duplicate identity or catalog rows.
//   - Transactional/clinical demo records (Consultations, Vitals,
//     Vaccinations, SymptomAssessments, Prescriptions, FollowUps,
//     EmergencyReferrals, OfflineActions) are wiped and recreated on
//     every run. This is a demo/dev-only database, so "safe to
//     reseed" is implemented as "deterministically rebuild the demo
//     story" rather than tracking synthetic stable IDs for every
//     clinical row, which would add complexity with no real benefit
//     here.
//
// Run with: npx prisma db seed

import { PrismaClient, TriageLevel, ReferralStatus } from "../lib/db/generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Fixed demo password for ALL seeded accounts (matches README demo
// accounts). Development/demo use only — never use for real users.
const DEMO_PASSWORD = "demo1234";

// Fixed synthetic phone numbers — no Math.random().
const PHONES = {
  admin: "9000000001",
  doctors: ["9000000101", "9000000102", "9000000103"],
  healthWorkers: ["9000001101", "9000001102", "9000001103"],
  patients: [
    "9111000001", "9111000002", "9111000003", "9111000004",
    "9111000005", "9111000006", "9111000007", "9111000008",
    "9111000009", "9111000010", "9111000011", "9111000012",
  ],
};

async function hashDemoPassword() {
  return bcrypt.hash(DEMO_PASSWORD, 10);
}

async function main() {
  console.log("Seeding ArogyaX synthetic demo data...");
  const passwordHash = await hashDemoPassword();

  // -------------------------------------------------------------
  // 1. Admin (README demo account) — upsert on email
  // -------------------------------------------------------------
  await prisma.user.upsert({
    where: { email: "admin@arogyax.demo" },
    update: {},
    create: {
      email: "admin@arogyax.demo",
      passwordHash,
      authProvider: "EMAIL",
      role: "ADMIN",
      fullName: "ArogyaX Admin",
      phone: PHONES.admin,
    },
  });

  // -------------------------------------------------------------
  // 2. Doctors (README demo account + 2 additional) — upsert
  // -------------------------------------------------------------
  const doctorSeedData = [
    {
      email: "doctor@arogyax.demo",
      fullName: "Dr. Ananya Sharma",
      phone: PHONES.doctors[0],
      specialization: "General Medicine",
      registrationNumber: "MH-RMP-10234",
      yearsOfExperience: 9,
    },
    {
      email: "doctor2@arogyax.demo",
      fullName: "Dr. Rohan Deshmukh",
      phone: PHONES.doctors[1],
      specialization: "Pediatrics",
      registrationNumber: "MH-RMP-10891",
      yearsOfExperience: 6,
    },
    {
      email: "doctor3@arogyax.demo",
      fullName: "Dr. Fatima Sheikh",
      phone: PHONES.doctors[2],
      specialization: "Gynecology",
      registrationNumber: "MH-RMP-11340",
      yearsOfExperience: 12,
    },
  ];

  const doctors = [];
  for (const d of doctorSeedData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash,
        authProvider: "EMAIL",
        role: "DOCTOR",
        fullName: d.fullName,
        phone: d.phone,
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialization: d.specialization,
        registrationNumber: d.registrationNumber,
        yearsOfExperience: d.yearsOfExperience,
      },
    });
    doctors.push(doctor);
  }

  // -------------------------------------------------------------
  // 3. Health Workers (README demo account + 2 additional) — upsert
  // -------------------------------------------------------------
  const healthWorkerSeedData = [
    { email: "healthworker@arogyax.demo", fullName: "Meera Kulkarni", phone: PHONES.healthWorkers[0], assignedArea: "Nashik Rural - Sector 4" },
    { email: "healthworker2@arogyax.demo", fullName: "Suresh Pawar", phone: PHONES.healthWorkers[1], assignedArea: "Igatpuri Block" },
    { email: "healthworker3@arogyax.demo", fullName: "Anita Bhosale", phone: PHONES.healthWorkers[2], assignedArea: "Trimbakeshwar Block" },
  ];

  const healthWorkers = [];
  for (const hw of healthWorkerSeedData) {
    const user = await prisma.user.upsert({
      where: { email: hw.email },
      update: {},
      create: {
        email: hw.email,
        passwordHash,
        authProvider: "EMAIL",
        role: "HEALTH_WORKER",
        fullName: hw.fullName,
        phone: hw.phone,
      },
    });

    const healthWorker = await prisma.healthWorker.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        assignedArea: hw.assignedArea,
      },
    });
    healthWorkers.push(healthWorker);
  }

  // -------------------------------------------------------------
  // 4. Patients (README demo account + 11 additional) — upsert
  // -------------------------------------------------------------
  const patientNames = [
    "Demo Patient", "Ramesh Gaikwad", "Sita Jadhav", "Vikas Chavan", "Pooja More",
    "Ganesh Shinde", "Lata Kale", "Arjun Patil", "Kavita Wagh",
    "Nitin Sonawane", "Rekha Waghmare", "Sanjay Dhage",
  ];
  const patientEmails = [
    "patient@arogyax.demo", "patient1@arogyax.demo", "patient2@arogyax.demo",
    "patient3@arogyax.demo", "patient4@arogyax.demo", "patient5@arogyax.demo",
    "patient6@arogyax.demo", "patient7@arogyax.demo", "patient8@arogyax.demo",
    "patient9@arogyax.demo", "patient10@arogyax.demo", "patient11@arogyax.demo",
  ];
  const villages = ["Deolali", "Sinnar", "Igatpuri", "Trimbak", "Dindori", "Peth"];
  const genders = ["female", "male"];
  const bloodGroups = ["O+", "A+", "B+", "O+", "AB+", "O-", "A+", "B+", "O+", "A-", "AB-", "O+"];
  const birthDates = [
    "1990-05-14", "1962-01-10", "1978-06-22", "1985-11-03", "1995-03-19",
    "1970-09-08", "1988-12-25", "2001-04-17", "1966-07-30",
    "1993-02-11", "1975-10-05", "1958-08-27",
  ];

  const patients = [];
  for (let i = 0; i < patientNames.length; i++) {
    const user = await prisma.user.upsert({
      where: { email: patientEmails[i] },
      update: {},
      create: {
        email: patientEmails[i],
        passwordHash,
        authProvider: "EMAIL",
        role: "PATIENT",
        fullName: patientNames[i],
        phone: PHONES.patients[i],
      },
    });

    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        dateOfBirth: new Date(birthDates[i]),
        gender: genders[i % 2],
        village: villages[i % villages.length],
        district: "Nashik",
        state: "Maharashtra",
        bloodGroup: bloodGroups[i],
        emergencyContactName: `${patientNames[i].split(" ")[0]}'s Family Contact`,
        emergencyContactPhone: "9111009" + String(100 + i),
        registeredByWorkerId: healthWorkers[i % healthWorkers.length].id,
      },
    });
    patients.push(patient);
  }

  // -------------------------------------------------------------
  // 5. Medicines — upsert on unique name
  // -------------------------------------------------------------
  const medicineData = [
    { name: "Paracetamol", genericName: "Paracetamol", form: "tablet", strength: "500mg" },
    { name: "Amoxicillin", genericName: "Amoxicillin", form: "capsule", strength: "250mg" },
    { name: "ORS Sachet", genericName: "Oral Rehydration Salts", form: "sachet", strength: "21g" },
    { name: "Iron + Folic Acid", genericName: "Ferrous Sulphate + Folic Acid", form: "tablet", strength: "100mg" },
    { name: "Cetirizine", genericName: "Cetirizine Hydrochloride", form: "tablet", strength: "10mg" },
    { name: "Metformin", genericName: "Metformin Hydrochloride", form: "tablet", strength: "500mg" },
    { name: "Azithromycin", genericName: "Azithromycin", form: "tablet", strength: "500mg" },
    { name: "Cough Syrup", genericName: "Dextromethorphan", form: "syrup", strength: "100ml" },
  ];
  const medicines = [];
  for (const m of medicineData) {
    medicines.push(
      await prisma.medicine.upsert({
        where: { name: m.name },
        update: {},
        create: m,
      })
    );
  }

  // -------------------------------------------------------------
  // 6. Hospitals (demo referral destinations) — upsert on unique name
  // -------------------------------------------------------------
  const hospitalData = [
    { name: "Nashik Civil Hospital", district: "Nashik", address: "Sharanpur Road, Nashik", phone: "0253-2570000" },
    { name: "Igatpuri Rural Hospital", district: "Nashik", address: "Igatpuri Town", phone: "02553-244000" },
    { name: "Trimbakeshwar Primary Health Centre", district: "Nashik", address: "Trimbak Road", phone: "02594-233000" },
  ];
  const hospitals = [];
  for (const h of hospitalData) {
    hospitals.push(
      await prisma.hospital.upsert({
        where: { name: h.name },
        update: {},
        create: { ...h, isDemo: true },
      })
    );
  }

  // -------------------------------------------------------------
  // 7. Clean slate for transactional/clinical demo data.
  //
  // These entities have no natural unique key to upsert on safely
  // (their content, not their id, defines "sameness"), so we
  // deterministically rebuild them on every seed run instead. This is
  // safe ONLY because this is a demo/dev database seeded with
  // synthetic data — never run this against a database containing
  // real records.
  // -------------------------------------------------------------
  await prisma.offlineAction.deleteMany({});
  await prisma.emergencyReferral.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.symptomAssessment.deleteMany({});
  await prisma.vaccination.deleteMany({});
  await prisma.vital.deleteMany({});
  await prisma.consultation.deleteMany({});

  // -------------------------------------------------------------
  // 8. Symptom Assessments (AI triage — informational only)
  // -------------------------------------------------------------
  const triagePresets: {
    symptomsText: string;
    triageLevel: TriageLevel;
    aiSummary: string;
    recommendedAction: string;
  }[] = [
    {
      symptomsText: "Mild headache and fatigue for 2 days",
      triageLevel: "LOW",
      aiSummary: "Symptoms are consistent with mild, self-limiting causes such as fatigue or dehydration.",
      recommendedAction: "Rest, stay hydrated, and monitor. Consult a doctor if symptoms persist beyond 3 days.",
    },
    {
      symptomsText: "Fever, body ache, and mild cough for 3 days",
      triageLevel: "MODERATE",
      aiSummary: "Symptoms may indicate a viral infection requiring clinical evaluation.",
      recommendedAction: "Book a consultation with a doctor within 24 hours.",
    },
    {
      symptomsText: "Severe chest pain and shortness of breath",
      triageLevel: "URGENT",
      aiSummary: "Symptoms may indicate a serious cardiac or respiratory condition.",
      recommendedAction: "Seek emergency care immediately. Do not wait for a scheduled consultation.",
    },
  ];

  const symptomAssessments = [];
  for (let i = 0; i < 6; i++) {
    const preset = triagePresets[i % triagePresets.length];
    symptomAssessments.push(
      await prisma.symptomAssessment.create({
        data: {
          patientId: patients[i % patients.length].id,
          symptomsText: preset.symptomsText,
          triageLevel: preset.triageLevel,
          aiSummary: preset.aiSummary,
          recommendedAction: preset.recommendedAction,
          providerName: "mock",
        },
      })
    );
  }

  // -------------------------------------------------------------
  // 9. Consultations -> Prescriptions -> PrescriptionItems -> FollowUps
  // -------------------------------------------------------------
  const consultationReasons = ["Fever and cough", "Routine checkup", "Follow-up on medication", "Stomach ache"];
  const statusCycle: Array<"COMPLETED" | "ACCEPTED" | "REQUESTED"> = ["COMPLETED", "ACCEPTED", "REQUESTED", "COMPLETED"];

  for (let i = 0; i < 8; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const status = statusCycle[i % statusCycle.length];

    const consultation = await prisma.consultation.create({
      data: {
        patientId: patient.id,
        // A REQUESTED consultation has not yet been claimed by a doctor.
        doctorId: status === "REQUESTED" ? null : doctor.id,
        status,
        reason: consultationReasons[i % consultationReasons.length],
        doctorNotes: status === "COMPLETED" ? "Patient advised rest and prescribed medication." : null,
        acceptedAt: status !== "REQUESTED" ? new Date("2026-07-01T09:00:00Z") : null,
        completedAt: status === "COMPLETED" ? new Date("2026-07-01T09:30:00Z") : null,
      },
    });

    if (i < symptomAssessments.length) {
      await prisma.symptomAssessment.update({
        where: { id: symptomAssessments[i].id },
        data: { consultationId: consultation.id },
      });
    }

    if (status === "COMPLETED") {
      const prescription = await prisma.prescription.create({
        data: {
          consultationId: consultation.id,
          patientId: patient.id,
          doctorId: doctor.id,
          status: "ACTIVE",
          carePlan: "Complete the full course. Increase fluid intake. Return if symptoms worsen.",
        },
      });

      const med1 = medicines[i % medicines.length];
      const med2 = medicines[(i + 3) % medicines.length];

      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          medicineId: med1.id,
          dosage: "1 tablet",
          frequency: "twice daily",
          durationDays: 5,
          instructions: "Take after food.",
        },
      });

      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          medicineId: med2.id,
          dosage: "1 unit",
          frequency: "once daily",
          durationDays: 3,
          instructions: "Take before bed.",
        },
      });

      await prisma.followUp.create({
        data: {
          consultationId: consultation.id,
          patientId: patient.id,
          scheduledFor: new Date("2026-07-08T09:00:00Z"),
          status: "SCHEDULED",
          notes: "Review response to medication.",
        },
      });
    }
  }

  // -------------------------------------------------------------
  // 10. Vitals — always recorded by a Health Worker
  // -------------------------------------------------------------
  for (let i = 0; i < patients.length; i++) {
    await prisma.vital.create({
      data: {
        patientId: patients[i].id,
        recordedByWorkerId: healthWorkers[i % healthWorkers.length].id,
        systolicBP: 110 + (i % 6) * 4,
        diastolicBP: 70 + (i % 5) * 2,
        heartRateBpm: 68 + (i % 10) * 2,
        temperatureC: 36.5 + (i % 4) * 0.3,
        spo2Percent: 96 + (i % 4),
        weightKg: 55 + (i % 15) * 1.5,
        heightCm: 150 + (i % 10) * 2,
        notes: "Routine field vitals check.",
        recordedAt: new Date("2026-07-01T08:00:00Z"),
      },
    });
  }

  // -------------------------------------------------------------
  // 11. Vaccinations — always recorded by a Health Worker
  // -------------------------------------------------------------
  const vaccineNames = ["BCG", "Measles-Rubella", "Tetanus Toxoid", "Hepatitis B", "COVID-19 Booster"];
  for (let i = 0; i < patients.length; i++) {
    const isScheduled = i % 3 === 0;
    await prisma.vaccination.create({
      data: {
        patientId: patients[i].id,
        recordedByWorkerId: healthWorkers[i % healthWorkers.length].id,
        vaccineName: vaccineNames[i % vaccineNames.length],
        doseNumber: (i % 3) + 1,
        status: isScheduled ? "SCHEDULED" : "COMPLETED",
        scheduledDate: isScheduled ? new Date("2026-07-24T00:00:00Z") : null,
        administeredDate: isScheduled ? null : new Date("2026-06-01T00:00:00Z"),
      },
    });
  }

  // -------------------------------------------------------------
  // 12. Emergency Referrals — creator can be a Patient OR a Health
  //     Worker; createdByUserId is always set, createdByWorkerId only
  //     when the creator is a Health Worker.
  // -------------------------------------------------------------
  const referralStatuses: ReferralStatus[] = ["PENDING", "ACCEPTED", "IN_TRANSIT", "ADMITTED", "CLOSED"];
  const referralReasons = [
    "Suspected fracture after fall",
    "High fever with convulsion risk",
    "Severe dehydration",
    "Chest pain",
    "Self-reported severe abdominal pain",
  ];

  // First two referrals: created by a Health Worker in the field.
  for (let i = 0; i < 2; i++) {
    const patient = patients[i];
    const worker = healthWorkers[i % healthWorkers.length];
    // Resolve the health worker's own User row for createdByUserId.
    const workerRow = await prisma.healthWorker.findUniqueOrThrow({ where: { id: worker.id } });

    await prisma.emergencyReferral.create({
      data: {
        patientId: patient.id,
        createdByUserId: workerRow.userId,
        createdByWorkerId: worker.id,
        hospitalId: hospitals[i % hospitals.length].id,
        reason: referralReasons[i],
        status: referralStatuses[i % referralStatuses.length],
        triageLevelAtReferral: "URGENT",
      },
    });
  }

  // Next two referrals: self-created by the Patient directly from the app.
  for (let i = 2; i < 4; i++) {
    const patient = patients[i];
    await prisma.emergencyReferral.create({
      data: {
        patientId: patient.id,
        createdByUserId: patient.userId,
        createdByWorkerId: null,
        hospitalId: hospitals[i % hospitals.length].id,
        reason: referralReasons[i],
        status: referralStatuses[i % referralStatuses.length],
        triageLevelAtReferral: "MODERATE",
      },
    });
  }

  // -------------------------------------------------------------
  // 13. Offline Actions (server-side sync audit trail)
  //     clientActionId values are fixed, deterministic strings —
  //     this also demonstrates the idempotency key in action.
  // -------------------------------------------------------------
  const workerForOfflineSync = healthWorkers[0];
  const workerForOfflineSyncRow = await prisma.healthWorker.findUniqueOrThrow({ where: { id: workerForOfflineSync.id } });

  await prisma.offlineAction.create({
    data: {
      clientActionId: "seed-offline-action-vitals-001",
      healthWorkerId: workerForOfflineSyncRow.id,
      actionType: "RECORD_VITALS",
      status: "SYNCED",
      payload: {
        patientId: patients[2].id,
        systolicBP: 118,
        diastolicBP: 76,
        heartRateBpm: 74,
      },
      clientCreatedAt: new Date("2026-07-01T06:00:00Z"),
      syncedAt: new Date("2026-07-01T08:00:00Z"),
    },
  });

  const workerForPendingSync = healthWorkers[1];
  await prisma.offlineAction.create({
    data: {
      clientActionId: "seed-offline-action-referral-001",
      healthWorkerId: workerForPendingSync.id,
      actionType: "CREATE_EMERGENCY_REFERRAL",
      status: "PENDING",
      payload: {
        patientId: patients[4].id,
        reason: "Suspected snake bite, captured offline in the field",
        hospitalId: hospitals[1].id,
      },
      clientCreatedAt: new Date("2026-07-01T07:30:00Z"),
    },
  });

  console.log("Seed complete:");
  console.log(`  Users: 1 admin, ${doctors.length} doctors, ${healthWorkers.length} health workers, ${patients.length} patients`);
  console.log(`  Medicines: ${medicines.length}, Hospitals: ${hospitals.length}`);
  console.log("  Demo login password for all seeded accounts: demo1234");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
