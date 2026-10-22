import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/**
 * Tabel auth — mengikuti skema resmi Better Auth (provider PostgreSQL).
 * Jangan menambah/mengganti nama tabel tanpa mengubah konfigurasi adapter.
 * Nama kolom di DB `snake_case`, properti kode `camelCase`.
 */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ============================================================
// Fase 1 — profil, paket, kucing, kepemilikan
// ============================================================

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  priceIdr: integer("price_idr").notNull(),
  durationDays: integer("duration_days").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_ends_at_idx").on(table.endsAt),
  ],
);

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  whatsapp: text("whatsapp"),
  kennelName: text("kennel_name"),
  avatarPath: text("avatar_path"),
  isBreeder: boolean("is_breeder").default(false).notNull(),
  isStudProvider: boolean("is_stud_provider").default(false).notNull(),
  emailRemindersEnabled: boolean("email_reminders_enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cats = pgTable(
  "cats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sex: text("sex", { enum: ["male", "female"] }).notNull(),
    breed: text("breed"),
    color: text("color"),
    birthDate: date("birth_date"),
    photoPath: text("photo_path"),
    isNeutered: boolean("is_neutered").default(false).notNull(),
    microchipNo: text("microchip_no"),
    pedigreeNo: text("pedigree_no"),
    // Hanya boleh merujuk kucing milik pemilik yang sama (dijaga di lapisan API).
    sireId: uuid("sire_id").references((): AnyPgColumn => cats.id, {
      onDelete: "set null",
    }),
    sireNameManual: text("sire_name_manual"),
    damId: uuid("dam_id").references((): AnyPgColumn => cats.id, {
      onDelete: "set null",
    }),
    damNameManual: text("dam_name_manual"),
    // Diisi saat anak kucing didaftarkan dari sebuah litter (Fase 3).
    litterId: uuid("litter_id").references((): AnyPgColumn => litters.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: ["active", "sold", "deceased"] })
      .default("active")
      .notNull(),
    trackingStatus: text("tracking_status", { enum: ["tracked", "frozen"] })
      .default("tracked")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("cats_owner_id_idx").on(table.ownerId),
    index("cats_status_idx").on(table.status),
  ],
);

export const catOwnershipHistory = pgTable(
  "cat_ownership_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catId: uuid("cat_id").references(() => cats.id, { onDelete: "set null" }),
    catName: text("cat_name").notNull(),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
    ownerDisplayName: text("owner_display_name").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    acquiredVia: text("acquired_via", { enum: ["created", "transfer"] }).notNull(),
    // `transfer_id` ditambahkan pada Fase 5 bersama tabel `cat_transfers`.
  },
  (table) => [
    index("cat_ownership_history_cat_id_idx").on(table.catId),
    index("cat_ownership_history_owner_id_idx").on(table.ownerId),
    // Satu baris kepemilikan aktif (ended_at kosong) per kucing.
    uniqueIndex("cat_ownership_history_current_uidx")
      .on(table.catId)
      .where(sql`${table.endedAt} is null`),
  ],
);

// ============================================================
// Fase 2 — kesehatan, berat, pengingat, pakan, dokumen
// ============================================================

/** Kesehatan dan berat badan digabung (PRD §6): type = 'weight' memakai weight_kg. */
export const healthRecords = pgTable(
  "health_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catId: uuid("cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["vaccine", "deworming", "flea", "vet_visit", "medication", "weight", "other"],
    }).notNull(),
    title: text("title"),
    recordDate: date("record_date").notNull(),
    nextDueDate: date("next_due_date"),
    weightKg: numeric("weight_kg", { precision: 4, scale: 2, mode: "number" }),
    vetName: text("vet_name"),
    cost: integer("cost"),
    photoPath: text("photo_path"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("health_records_cat_id_idx").on(table.catId),
    index("health_records_cat_date_idx").on(table.catId, table.recordDate),
    index("health_records_type_idx").on(table.type),
  ],
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    catId: uuid("cat_id").references(() => cats.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueDate: date("due_date").notNull(),
    sourceType: text("source_type", {
      enum: ["health", "pregnancy", "booking_planned", "booking_due", "manual"],
    }).notNull(),
    sourceId: uuid("source_id"),
    doneAt: timestamp("done_at", { withTimezone: true }),
    notifiedH3At: timestamp("notified_h3_at", { withTimezone: true }),
    notifiedD0At: timestamp("notified_d0_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("reminders_user_id_idx").on(table.userId),
    index("reminders_due_date_idx").on(table.dueDate),
    index("reminders_source_idx").on(table.sourceType, table.sourceId),
  ],
);

/** Jadwal pakan harian per kucing (pendukung halaman Pakan). */
export const feedingSchedules = pgTable(
  "feeding_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catId: uuid("cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    scheduleTime: text("schedule_time").notNull(),
    portionGrams: integer("portion_grams").notNull(),
    foodType: text("food_type").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("feeding_schedules_cat_id_idx").on(table.catId)],
);

/** Brankas dokumen digital per kucing. */
export const catDocuments = pgTable(
  "cat_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catId: uuid("cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category", {
      enum: ["pedigree", "vaccine_book", "lab", "registration", "other"],
    })
      .default("other")
      .notNull(),
    filePath: text("file_path"),
    fileType: text("file_type", { enum: ["pdf", "image"] })
      .default("pdf")
      .notNull(),
    sizeBytes: integer("size_bytes"),
    uploadedAt: date("uploaded_at").notNull(),
    source: text("source"),
    notes: text("notes"),
    verified: boolean("verified").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("cat_documents_cat_id_idx").on(table.catId),
    index("cat_documents_uploaded_at_idx").on(table.uploadedAt),
  ],
);

// ============================================================
// Fase 3 — breeding & penjualan
// ============================================================

/** Siklus birahi betina (FR-08). */
export const heatCycles = pgTable(
  "heat_cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catId: uuid("cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("heat_cycles_cat_id_idx").on(table.catId),
    index("heat_cycles_start_date_idx").on(table.startDate),
  ],
);

/** Catatan kawin & kehamilan kucing milik breeder (FR-09). */
export const matings = pgTable(
  "matings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    queenId: uuid("queen_id").references(() => cats.id, { onDelete: "set null" }),
    queenNameManual: text("queen_name_manual"),
    sireId: uuid("sire_id").references(() => cats.id, { onDelete: "set null" }),
    sireNameManual: text("sire_name_manual"),
    matingDate: date("mating_date").notNull(),
    outcome: text("outcome", {
      enum: ["pending", "pregnant", "not_pregnant", "delivered"],
    })
      .default("pending")
      .notNull(),
    expectedDueDate: date("expected_due_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("matings_owner_id_idx").on(table.ownerId),
    index("matings_mating_date_idx").on(table.matingDate),
    index("matings_outcome_idx").on(table.outcome),
  ],
);

/** Kelahiran; satu catatan kawin hanya boleh punya satu litter (FR-10). */
export const litters = pgTable(
  "litters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matingId: uuid("mating_id")
      .notNull()
      .references(() => matings.id, { onDelete: "cascade" }),
    birthDate: date("birth_date").notNull(),
    totalBorn: integer("total_born").notNull(),
    totalAlive: integer("total_alive").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("litters_mating_id_uidx").on(table.matingId),
    index("litters_birth_date_idx").on(table.birthDate),
  ],
);

/** Penjualan kucing oleh breeder (FR-19). */
export const catSales = pgTable(
  "cat_sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    catId: uuid("cat_id").references(() => cats.id, { onDelete: "set null" }),
    catName: text("cat_name").notNull(),
    status: text("status", {
      enum: ["listed", "reserved", "sold", "cancelled"],
    })
      .default("listed")
      .notNull(),
    askingPrice: integer("asking_price"),
    buyerName: text("buyer_name"),
    buyerWhatsapp: text("buyer_whatsapp"),
    finalPrice: integer("final_price"),
    depositAmount: integer("deposit_amount"),
    depositPaid: boolean("deposit_paid").default(false).notNull(),
    saleDate: date("sale_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("cat_sales_owner_id_idx").on(table.ownerId),
    index("cat_sales_status_idx").on(table.status),
    index("cat_sales_sale_date_idx").on(table.saleDate),
    // Satu penjualan aktif (dijual/dipesan) per kucing.
    uniqueIndex("cat_sales_active_cat_uidx")
      .on(table.catId)
      .where(sql`${table.status} in ('listed', 'reserved')`),
  ],
);

// ============================================================
// Fase 4 — jasa pacak
// ============================================================

/** Profil pejantan yang ditawarkan untuk jasa pacak (FR-11). */
export const studServices = pgTable(
  "stud_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catId: uuid("cat_id").references(() => cats.id, { onDelete: "set null" }),
    catName: text("cat_name").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feeAmount: integer("fee_amount"),
    feeDescription: text("fee_description"),
    notes: text("notes"),
    isAvailable: boolean("is_available").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("stud_services_owner_id_idx").on(table.ownerId),
    // Satu profil pacak per kucing; null diperbolehkan setelah transfer.
    uniqueIndex("stud_services_cat_id_uidx").on(table.catId),
  ],
);

/** Booking klien jasa pacak (FR-12, FR-13). */
export const studBookings = pgTable(
  "stud_bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    studServiceId: uuid("stud_service_id")
      .notNull()
      .references(() => studServices.id, { onDelete: "restrict" }),
    clientName: text("client_name").notNull(),
    clientWhatsapp: text("client_whatsapp").notNull(),
    queenName: text("queen_name").notNull(),
    queenBreed: text("queen_breed"),
    queenAgeText: text("queen_age_text"),
    plannedDate: date("planned_date"),
    status: text("status", {
      enum: ["requested", "approved", "ongoing", "completed", "rejected", "cancelled"],
    })
      .default("requested")
      .notNull(),
    feeAgreed: integer("fee_agreed"),
    depositAmount: integer("deposit_amount"),
    depositPaid: boolean("deposit_paid").default(false).notNull(),
    expectedDueDate: date("expected_due_date"),
    expectedDueDateManual: boolean("expected_due_date_manual")
      .default(false)
      .notNull(),
    queenPregnancyStatus: text("queen_pregnancy_status", {
      enum: ["unknown", "pregnant", "not_pregnant", "delivered"],
    })
      .default("unknown")
      .notNull(),
    notes: text("notes"),
    // Dipakai untuk tahu apakah pembatalan kawin kembali ke Disetujui
    // atau Diminta (PRD FR-13).
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("stud_bookings_owner_id_idx").on(table.ownerId),
    index("stud_bookings_stud_service_id_idx").on(table.studServiceId),
    index("stud_bookings_status_idx").on(table.status),
    index("stud_bookings_planned_date_idx").on(table.plannedDate),
  ],
);

/** Catatan kawin per booking pacak (FR-13). */
export const studBookingMatings = pgTable(
  "stud_booking_matings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => studBookings.id, { onDelete: "cascade" }),
    matingDate: date("mating_date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("stud_booking_matings_booking_id_idx").on(table.bookingId),
    index("stud_booking_matings_mating_date_idx").on(table.matingDate),
  ],
);

// ============================================================
// Relasi
// ============================================================

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  cats: many(cats),
  subscriptions: many(subscriptions),
  reminders: many(reminders),
  matings: many(matings),
  catSales: many(catSales),
  studServices: many(studServices),
  studBookings: many(studBookings),
  profile: one(profiles, {
    fields: [user.id],
    references: [profiles.userId],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(user, {
    fields: [profiles.userId],
    references: [user.id],
  }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

export const catsRelations = relations(cats, ({ one, many }) => ({
  owner: one(user, {
    fields: [cats.ownerId],
    references: [user.id],
  }),
  sire: one(cats, {
    fields: [cats.sireId],
    references: [cats.id],
    relationName: "cat_sire",
  }),
  dam: one(cats, {
    fields: [cats.damId],
    references: [cats.id],
    relationName: "cat_dam",
  }),
  ownershipHistory: many(catOwnershipHistory),
  healthRecords: many(healthRecords),
  reminders: many(reminders),
  feedingSchedules: many(feedingSchedules),
  documents: many(catDocuments),
  heatCycles: many(heatCycles),
  litter: one(litters, {
    fields: [cats.litterId],
    references: [litters.id],
  }),
  queenMatings: many(matings, { relationName: "mating_queen" }),
  sireMatings: many(matings, { relationName: "mating_sire" }),
  sales: many(catSales),
  studService: one(studServices, {
    fields: [cats.id],
    references: [studServices.catId],
  }),
}));

export const catOwnershipHistoryRelations = relations(
  catOwnershipHistory,
  ({ one }) => ({
    cat: one(cats, {
      fields: [catOwnershipHistory.catId],
      references: [cats.id],
    }),
    owner: one(user, {
      fields: [catOwnershipHistory.ownerId],
      references: [user.id],
    }),
  }),
);

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  cat: one(cats, {
    fields: [healthRecords.catId],
    references: [cats.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(user, {
    fields: [reminders.userId],
    references: [user.id],
  }),
  cat: one(cats, {
    fields: [reminders.catId],
    references: [cats.id],
  }),
}));

export const feedingSchedulesRelations = relations(feedingSchedules, ({ one }) => ({
  cat: one(cats, {
    fields: [feedingSchedules.catId],
    references: [cats.id],
  }),
}));

export const catDocumentsRelations = relations(catDocuments, ({ one }) => ({
  cat: one(cats, {
    fields: [catDocuments.catId],
    references: [cats.id],
  }),
}));

export const heatCyclesRelations = relations(heatCycles, ({ one }) => ({
  cat: one(cats, {
    fields: [heatCycles.catId],
    references: [cats.id],
  }),
}));

export const matingsRelations = relations(matings, ({ one }) => ({
  owner: one(user, {
    fields: [matings.ownerId],
    references: [user.id],
  }),
  queen: one(cats, {
    fields: [matings.queenId],
    references: [cats.id],
    relationName: "mating_queen",
  }),
  sire: one(cats, {
    fields: [matings.sireId],
    references: [cats.id],
    relationName: "mating_sire",
  }),
  litter: one(litters, {
    fields: [matings.id],
    references: [litters.matingId],
  }),
}));

export const littersRelations = relations(litters, ({ one, many }) => ({
  mating: one(matings, {
    fields: [litters.matingId],
    references: [matings.id],
  }),
  kittens: many(cats),
}));

export const catSalesRelations = relations(catSales, ({ one }) => ({
  owner: one(user, {
    fields: [catSales.ownerId],
    references: [user.id],
  }),
  cat: one(cats, {
    fields: [catSales.catId],
    references: [cats.id],
  }),
}));

export const studServicesRelations = relations(studServices, ({ one, many }) => ({
  owner: one(user, {
    fields: [studServices.ownerId],
    references: [user.id],
  }),
  cat: one(cats, {
    fields: [studServices.catId],
    references: [cats.id],
  }),
  bookings: many(studBookings),
}));

export const studBookingsRelations = relations(studBookings, ({ one, many }) => ({
  owner: one(user, {
    fields: [studBookings.ownerId],
    references: [user.id],
  }),
  service: one(studServices, {
    fields: [studBookings.studServiceId],
    references: [studServices.id],
  }),
  matings: many(studBookingMatings),
}));

export const studBookingMatingsRelations = relations(
  studBookingMatings,
  ({ one }) => ({
    booking: one(studBookings, {
      fields: [studBookingMatings.bookingId],
      references: [studBookings.id],
    }),
  }),
);
