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
    // `litter_id` ditambahkan pada Fase 3 bersama tabel `litters`.
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
// Relasi
// ============================================================

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  cats: many(cats),
  subscriptions: many(subscriptions),
  reminders: many(reminders),
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
