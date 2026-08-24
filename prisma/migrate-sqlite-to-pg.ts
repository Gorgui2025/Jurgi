/**
 * Migration SQLite → PostgreSQL
 * Usage: npx tsx prisma/migrate-sqlite-to-pg.ts
 *
 * 1. Exporte les données SQLite en JSON via sqlite3 CLI
 * 2. Importe dans PostgreSQL via Prisma
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, readFileSync } from "fs";
import { resolve } from "path";

const SQLITE_DB = resolve(__dirname, "dev.db");
const TMP_DIR = resolve(__dirname, ".migration-tmp");

function sqliteQuery(sql: string): string {
  const escaped = sql.replace(/'/g, "'\\''");
  const raw = execSync(`sqlite3 -json "${SQLITE_DB}" '${escaped}'`, { encoding: "utf-8" });
  return raw;
}

function readTable(table: string): any[] {
  try {
    const raw = sqliteQuery(`SELECT * FROM "${table}"`);
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function main() {
  console.log("📂 Lecture de SQLite...");
  console.log("🐘 Écriture vers PostgreSQL...\n");

  const pg = new PrismaClient();

  try {
    // 1. SiteConfig
    const siteConfigs = readTable("SiteConfig");
    console.log(`  SiteConfig: ${siteConfigs.length}`);
    for (const sc of siteConfigs) {
      await pg.siteConfig.upsert({
        where: { key: sc.key },
        create: { key: sc.key, value: sc.value },
        update: { value: sc.value },
      });
    }

    // 2. Users
    const users = readTable("User");
    console.log(`  Users: ${users.length}`);
    for (const u of users) {
      await pg.user.upsert({
        where: { id: u.id },
        create: {
          id: u.id, phone: u.phone, phoneVerified: !!u.phoneVerified, name: u.name,
          email: u.email, emailVerified: !!u.emailVerified, passwordHash: u.passwordHash,
          avatar: u.avatar, bio: u.bio, location: u.location, region: u.region,
          commune: u.commune, zones: u.zones || "[]", roles: u.roles || '["eleveur"]',
          accountStatus: u.accountStatus || "active", isVerified: !!u.isVerified,
          verifiedLevel: u.verifiedLevel || "none", isOnline: !!u.isOnline,
          lastSeen: u.lastSeen ? new Date(u.lastSeen) : null, phoneVisible: !!u.phoneVisible,
          whatsapp: u.whatsapp, resetToken: u.resetToken,
          resetTokenExpiry: u.resetTokenExpiry ? new Date(u.resetTokenExpiry) : null,
          createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt),
        },
        update: {
          phone: u.phone, name: u.name, email: u.email, passwordHash: u.passwordHash,
          avatar: u.avatar, roles: u.roles, accountStatus: u.accountStatus, whatsapp: u.whatsapp,
        },
      });
    }

    // 3. Categories
    const categories = readTable("Category");
    console.log(`  Categories: ${categories.length}`);
    for (const c of categories) {
      await pg.category.upsert({
        where: { id: c.id },
        create: {
          id: c.id, name: c.name, slug: c.slug, icon: c.icon,
          description: c.description, domain: c.domain, parent_id: c.parent_id,
          sortOrder: c.sortOrder || 0, isActive: !!c.isActive,
          createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt),
        },
        update: { name: c.name, slug: c.slug, icon: c.icon, sortOrder: c.sortOrder || 0 },
      });
    }

    // 4. FarmProfiles
    const farms = readTable("FarmProfile");
    console.log(`  FarmProfiles: ${farms.length}`);
    for (const f of farms) {
      await pg.farmProfile.upsert({
        where: { id: f.id },
        create: {
          id: f.id, userId: f.userId, name: f.name, description: f.description,
          farmType: f.farmType, species: f.species || "[]", size: f.size,
          location: f.location, region: f.region, commune: f.commune,
          latitude: f.latitude, longitude: f.longitude, photos: f.photos || "[]",
          videos: f.videos || "[]", createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt),
        },
        update: { name: f.name },
      });
    }

    // 5. Listings
    const listings = readTable("Listing");
    console.log(`  Listings: ${listings.length}`);
    for (const l of listings) {
      await pg.listing.upsert({
        where: { id: l.id },
        create: {
          id: l.id, userId: l.userId, categoryId: l.categoryId,
          farmProfileId: l.farmProfileId, title: l.title, description: l.description,
          price: l.price, priceType: l.priceType || "fixed", currency: l.currency || "FCFA",
          priceOnDemand: !!l.priceOnDemand, photos: l.photos || "[]",
          videos: l.videos || "[]", location: l.location, region: l.region,
          commune: l.commune, latitude: l.latitude, longitude: l.longitude,
          status: l.status || "active", availability: l.availability || "available",
          contactMode: l.contactMode || "phone_whatsapp",
          expiresAt: l.expiresAt ? new Date(l.expiresAt) : null,
          views: l.views || 0, featured: !!l.featured, species: l.species,
          breed: l.breed, age: l.age, weight: l.weight, sex: l.sex,
          quantity: l.quantity, healthInfo: l.healthInfo,
          deliveryOptions: l.deliveryOptions || "[]",
          createdAt: new Date(l.createdAt), updatedAt: new Date(l.updatedAt),
        },
        update: { title: l.title, price: l.price, status: l.status, photos: l.photos, videos: l.videos },
      });
    }

    // 6. Requests
    const requests = readTable("Request");
    console.log(`  Requests: ${requests.length}`);
    for (const r of requests) {
      await pg.request.upsert({
        where: { id: r.id },
        create: {
          id: r.id, userId: r.userId, categoryId: r.categoryId, title: r.title,
          description: r.description, quantity: r.quantity, budget: r.budget,
          location: r.location, region: r.region, commune: r.commune,
          deadline: r.deadline, urgency: r.urgency || "normal",
          photos: r.photos || "[]", status: r.status || "active",
          visibility: r.visibility || "public", contactMode: r.contactMode || "phone_whatsapp",
          views: r.views || 0, expiresAt: r.expiresAt ? new Date(r.expiresAt) : null,
          createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt),
        },
        update: { title: r.title, status: r.status },
      });
    }

    // 7. RequestResponses
    const responses = readTable("RequestResponse");
    console.log(`  RequestResponses: ${responses.length}`);
    for (const rr of responses) {
      await pg.requestResponse.upsert({
        where: { id: rr.id },
        create: {
          id: rr.id, requestId: rr.requestId, userId: rr.userId,
          listingId: rr.listingId, message: rr.message, price: rr.price,
          status: rr.status || "pending",
          createdAt: new Date(rr.createdAt), updatedAt: new Date(rr.updatedAt),
        },
        update: { status: rr.status, message: rr.message },
      });
    }

    // 8. Conversations + Participants
    const conversations = readTable("Conversation");
    console.log(`  Conversations: ${conversations.length}`);
    for (const c of conversations) {
      await pg.conversation.upsert({
        where: { id: c.id },
        create: {
          id: c.id, name: c.name, isGroup: !!c.isGroup,
          createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt),
        },
        update: { name: c.name },
      });
    }

    const convParticipants = readTable("_conversationsParticipant");
    console.log(`  ConversationParticipants: ${convParticipants.length}`);
    for (const cp of convParticipants) {
      try {
        await pg.conversation.update({
          where: { id: cp.A },
          data: { participants: { connect: { id: cp.B } } },
        });
      } catch (e: any) {
        if (!e.message?.includes("Record to update not found")) {
          console.error(`    ⚠️ ConvParticipant error: ${e.message?.slice(0, 80)}`);
        }
      }
    }

    // 9. Messages
    const messages = readTable("Message");
    console.log(`  Messages: ${messages.length}`);
    for (const m of messages) {
      await pg.message.upsert({
        where: { id: m.id },
        create: {
          id: m.id, conversationId: m.conversationId, senderId: m.senderId,
          content: m.content, read: !!m.read, createdAt: new Date(m.createdAt),
        },
        update: { content: m.content, read: !!m.read },
      });
    }

    // 10. Reviews
    const reviews = readTable("Review");
    console.log(`  Reviews: ${reviews.length}`);
    for (const r of reviews) {
      await pg.review.upsert({
        where: { id: r.id },
        create: {
          id: r.id, reviewerId: r.reviewerId, userId: r.userId,
          rating: r.rating, comment: r.comment,
          createdAt: new Date(r.createdAt),
        },
        update: { rating: r.rating, comment: r.comment },
      });
    }

    // 11. Reports
    const reports = readTable("Report");
    console.log(`  Reports: ${reports.length}`);
    for (const r of reports) {
      await pg.report.upsert({
        where: { id: r.id },
        create: {
          id: r.id, reporterId: r.reporterId, targetType: r.targetType,
          targetId: r.targetId, reason: r.reason, description: r.description,
          status: r.status || "pending", resolution: r.resolution,
          createdAt: new Date(r.createdAt),
          resolvedAt: r.resolvedAt ? new Date(r.resolvedAt) : null,
        },
        update: { status: r.status },
      });
    }

    // 12. Notifications
    const notifications = readTable("Notification");
    console.log(`  Notifications: ${notifications.length}`);
    for (const n of notifications) {
      await pg.notification.upsert({
        where: { id: n.id },
        create: {
          id: n.id, userId: n.userId, type: n.type, title: n.title,
          message: n.message, data: n.data || "{}", read: !!n.read,
          createdAt: new Date(n.createdAt),
        },
        update: { read: !!n.read },
      });
    }

    // 13. AuditLogs
    const auditLogs = readTable("AuditLog");
    console.log(`  AuditLogs: ${auditLogs.length}`);
    for (const a of auditLogs) {
      await pg.auditLog.create({
        data: {
          id: a.id, userId: a.userId, action: a.action, entityType: a.entityType,
          entityId: a.entityId, details: a.details || "{}", ipAddress: a.ipAddress,
          createdAt: new Date(a.createdAt),
        },
      });
    }

    // 14. Subscriptions
    const subs = readTable("Subscription");
    console.log(`  Subscriptions: ${subs.length}`);
    for (const s of subs) {
      await pg.subscription.upsert({
        where: { id: s.id },
        create: {
          id: s.id, userId: s.userId, planId: s.planId || "", status: s.status || "active",
          startDate: new Date(s.startDate),
          endDate: s.endDate ? new Date(s.endDate) : null,
          createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt),
        },
        update: { status: s.status },
      });
    }

    // 15. Trainings
    const trainings = readTable("Training");
    console.log(`  Trainings: ${trainings.length}`);
    for (const t of trainings) {
      await pg.training.upsert({
        where: { id: t.id },
        create: {
          id: t.id, title: t.title, provider: t.provider, type: t.type,
          level: t.level, duration: t.duration, format: t.format,
          price: t.price, location: t.location, date: t.date,
          maxParticipants: t.maxParticipants || 50, description: t.description,
          tags: t.tags || "[]",
          createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt),
        },
        update: { title: t.title },
      });
    }

    // 16. TrainingEnrollments
    const enrollments = readTable("TrainingEnrollment");
    console.log(`  TrainingEnrollments: ${enrollments.length}`);
    for (const e of enrollments) {
      try {
        await pg.trainingEnrollment.upsert({
          where: { trainingId_phone: { trainingId: e.trainingId, phone: e.phone } },
          create: {
            id: e.id, trainingId: e.trainingId, userId: e.userId,
            name: e.name, phone: e.phone, createdAt: new Date(e.createdAt),
          },
          update: { name: e.name },
        });
      } catch {
        // skip duplicates
      }
    }

    // 17. ContactMessages
    const contacts = readTable("ContactMessage");
    console.log(`  ContactMessages: ${contacts.length}`);
    for (const c of contacts) {
      await pg.contactMessage.upsert({
        where: { id: c.id },
        create: {
          id: c.id, name: c.name, email: c.email, subject: c.subject,
          message: c.message, read: !!c.read, createdAt: new Date(c.createdAt),
        },
        update: { read: !!c.read },
      });
    }

    console.log("\n🎉 Migration terminée avec succès !");
  } finally {
    await pg.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Erreur:", e);
  process.exit(1);
});
