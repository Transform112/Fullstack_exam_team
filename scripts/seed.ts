// Seed script (docs/02 SECTION 13). Safe to run repeatedly: every write is an upsert,
// no unrelated data is touched and the counts stay consistent with the seeded analytics.
// Run with: npm run seed
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { connectDB } from "../lib/db";
import { cld } from "../lib/cloudinary-url";
import { DEFAULT_DECORATIONS } from "../lib/occasion";
import { User } from "../models/User";
import { Template } from "../models/Template";
import { Page } from "../models/Page";
import { Wish } from "../models/Wish";
import { PageView } from "../models/PageView";
import { PageVisitor } from "../models/PageVisitor";
import { DailyStat } from "../models/DailyStat";
import { RateLimit } from "../models/RateLimit";

const id8 = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const ALL_OCCASIONS = [
  "BIRTHDAY",
  "ANNIVERSARY",
  "WEDDING",
  "FAREWELL",
  "CONGRATS",
  "FRIENDSHIP",
  "CUSTOM",
];

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Demo Cloudinary fixtures (docs/02 SECTION 13 step 5). They are development fixtures
// from Cloudinary's public demo cloud, not the team's upload pipeline.
const IMG = (name: string) => `https://res.cloudinary.com/demo/image/upload/${name}.jpg`;
const DEMO_IMAGES = [
  "sample",
  "cld-sample",
  "cld-sample-2",
  "cld-sample-3",
  "cld-sample-4",
  "cld-sample-5",
];
const DEMO_VIDEO = "https://res.cloudinary.com/demo/video/upload/dog.mp4";

const SIZES: Record<string, { w: number; h: number }> = {
  "sample.jpg": { w: 864, h: 576 },
  "cld-sample.jpg": { w: 1870, h: 1250 },
  "cld-sample-2.jpg": { w: 1870, h: 1250 },
  "cld-sample-3.jpg": { w: 1870, h: 1250 },
  "cld-sample-4.jpg": { w: 1870, h: 1250 },
  "cld-sample-5.jpg": { w: 1870, h: 1250 },
  "dog.mp4": { w: 640, h: 360 },
};

// Media item shape shared by the seeded images and the seeded video.
type SeedMediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  publicId: string;
  w: number;
  h: number;
  duration: number | null;
  caption: string;
  order: number;
};

// Builds image media items with real dimensions, stable ids and an explicit order.
function buildMedia(count: number, prefix = "seed"): SeedMediaItem[] {
  return DEMO_IMAGES.slice(0, count).map((name, index) => {
    const file = `${name}.jpg`;
    return {
      id: id8(),
      type: "image" as const,
      url: IMG(name),
      publicId: `${prefix}/${file}`,
      w: SIZES[file].w,
      h: SIZES[file].h,
      duration: null as number | null,
      caption: "",
      order: index,
    };
  });
}

function videoItem(order: number): SeedMediaItem {
  return {
    id: id8(),
    type: "video" as const,
    url: DEMO_VIDEO,
    publicId: "seed/dog.mp4",
    w: SIZES["dog.mp4"].w,
    h: SIZES["dog.mp4"].h,
    duration: 20,
    caption: "",
    order,
  };
}

function thumbnailOf(media: { type: string; url: string; order: number }[]) {
  const first = media.filter((m) => m.type === "image").sort((a, b) => a.order - b.order)[0];
  return first ? cld(first.url, "w_400,h_500,c_fill,g_auto,f_auto,q_auto") : "";
}

// Deterministic daily view distribution summing to `total` over the last 30 UTC days.
function dailyDistribution(total: number) {
  const today = new Date();
  const days: { date: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i),
    );
    days.push({ date: d.toISOString().slice(0, 10), views: 0 });
  }
  let left = total;
  let cursor = 0;
  while (left > 0) {
    days[cursor % days.length].views += 1;
    left -= 1;
    cursor += 3; // spreads the views over the whole window instead of one day
  }
  return days;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await connectDB();
  const db = mongoose.connection.db;
  console.log(`Connected to database: ${db?.databaseName}`);

  // Indexes are created explicitly instead of relying on first-use creation.
  await Promise.all([
    User.init(),
    Template.init(),
    Page.init(),
    Wish.init(),
    PageView.init(),
    PageVisitor.init(),
    DailyStat.init(),
    RateLimit.init(),
  ]);

  // 1. Users
  const [adminHash, creatorHash] = await Promise.all([
    bcrypt.hash("Admin@123", 10),
    bcrypt.hash("Creator@123", 10),
  ]);
  await User.updateOne(
    { email: "admin@demo.com" },
    { $set: { name: "Admin", role: "ADMIN", passwordHash: adminHash, isActive: true } },
    { upsert: true },
  );
  await User.updateOne(
    { email: "creator@demo.com" },
    { $set: { name: "Demo Creator", role: "USER", passwordHash: creatorHash, isActive: true } },
    { upsert: true },
  );
  const creator = await User.findOne({ email: "creator@demo.com" }).lean();
  if (!creator) throw new Error("Seed failed: creator user missing");
  console.log("Users ready: admin@demo.com, creator@demo.com");

  // Optional operator admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. It is created in
  // addition to the documented demo accounts, so the credentials in the README keep working.
  const operatorEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const operatorPassword = process.env.SEED_ADMIN_PASSWORD;
  if (operatorEmail && operatorPassword && operatorEmail !== "admin@demo.com") {
    await User.updateOne(
      { email: operatorEmail },
      {
        $set: {
          name: "Operator Admin",
          role: "ADMIN",
          passwordHash: await bcrypt.hash(operatorPassword, 10),
          isActive: true,
        },
      },
      { upsert: true },
    );
    console.log(`Operator admin ready: ${operatorEmail}`);
  }

  // 2. Templates
  const templates = [
    {
      id: "neon-night",
      name: "Neon Night",
      description:
        "Party and Gen-Z. Glowing neon text, starfield parallax, glitch reveal, confetti cannon.",
      defaultPalette: { accent: "#FF4FA3", colors: ["#0B0420", "#FF4FA3", "#22D3EE", "#A78BFA"] },
      fonts: ["Space Grotesk", "Caveat"],
    },
    {
      id: "pastel-dream",
      name: "Pastel Dream",
      description:
        "Soft and cute. Floating balloons, polaroid gallery, hand-drawn doodles, petals.",
      defaultPalette: { accent: "#F472B6", colors: ["#FFF1F5", "#FBCFE8", "#C4B5FD", "#FDE68A"] },
      fonts: ["Fredoka", "Quicksand", "Caveat"],
    },
    {
      id: "royal-gold",
      name: "Royal Gold",
      description: "Elegant. Gold foil shimmer, slow parallax, rose petals, letter-opening intro.",
      defaultPalette: { accent: "#D4AF37", colors: ["#0E0E10", "#D4AF37", "#F5E6C8", "#7F1D1D"] },
      fonts: ["Playfair Display", "Cormorant"],
    },
  ];
  for (const template of templates) {
    await Template.updateOne(
      { id: template.id },
      {
        $set: {
          name: template.name,
          description: template.description,
          supportedOccasions: ALL_OCCASIONS,
          defaultPalette: template.defaultPalette,
          fonts: template.fonts,
          isActive: true,
        },
      },
      { upsert: true },
    );
  }
  console.log(`Templates upserted: ${templates.map((t) => t.id).join(", ")}`);

  // 3. Pages
  const riyaMedia = buildMedia(5);
  riyaMedia.push(videoItem(riyaMedia.length));
  const kavyaMedia = buildMedia(5);
  const meeraMedia = buildMedia(5);
  const devMedia = buildMedia(4);
  const sanaMedia = buildMedia(4);
  const memoryIds = riyaMedia.slice(0, 3).map((m) => m.id);

  type SeedPage = {
    slug: string;
    occasion: string;
    language: string;
    templateId: string;
    accent: string;
    recipient: { name: string; nickname: string; relation: string };
    from: string;
    messages: string[];
    memories: { id: string; title: string; date: string; description: string; mediaId: string }[];
    media: SeedMediaItem[];
    music: string;
    status: string;
    revealAt?: Date | null;
    passwordHash?: string;
    settings: { wishesWall: boolean; showViews: boolean };
    stats: { views: number; uniqueViews: number; wishes: number };
  };

  const sanaPasswordHash = await bcrypt.hash("friends123", 10);
  const revealAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const seedPages: SeedPage[] = [
    {
      slug: "riya-birthday-7f3a",
      occasion: "BIRTHDAY",
      language: "HINGLISH",
      templateId: "neon-night",
      accent: "#FF4FA3",
      recipient: { name: "Riya", nickname: "Riyu", relation: "Best friend" },
      from: "Arjun & gang",
      messages: ["Tu best hai yaar, har din tere bina boring hai"],
      memories: [
        {
          id: id8(),
          title: "First day of college",
          date: "2024-07-01",
          description: "",
          mediaId: memoryIds[0],
        },
        {
          id: id8(),
          title: "Goa trip",
          date: "2025-12-20",
          description: "",
          mediaId: memoryIds[1],
        },
        {
          id: id8(),
          title: "Farewell",
          date: "2026-05-10",
          description: "",
          mediaId: memoryIds[2],
        },
      ],
      media: riyaMedia,
      music: "soft-piano",
      status: "PUBLISHED",
      revealAt: null,
      settings: { wishesWall: true, showViews: true },
      stats: { views: 47, uniqueViews: 31, wishes: 3 },
    },
    {
      slug: "kavya-anniversary-2k4m",
      occasion: "ANNIVERSARY",
      language: "ENGLISH",
      templateId: "royal-gold",
      accent: "#D4AF37",
      recipient: { name: "Kavya", nickname: "", relation: "Wife" },
      from: "Rohan",
      messages: ["Five years, a thousand memories, and I would still choose you every time."],
      memories: [
        {
          id: id8(),
          title: "The day we met",
          date: "2020-02-14",
          description: "",
          mediaId: kavyaMedia[0].id,
        },
        {
          id: id8(),
          title: "Our first trip",
          date: "2021-11-02",
          description: "",
          mediaId: kavyaMedia[1].id,
        },
      ],
      media: kavyaMedia,
      music: "romantic-strings",
      status: "PUBLISHED",
      revealAt: null,
      settings: { wishesWall: true, showViews: true },
      stats: { views: 0, uniqueViews: 0, wishes: 0 },
    },
    {
      slug: "meera-birthday-9p1x",
      occasion: "BIRTHDAY",
      language: "HINDI",
      templateId: "pastel-dream",
      accent: "#F472B6",
      recipient: { name: "\u092E\u0940\u0930\u093E", nickname: "", relation: "Sister" },
      from: "\u0906\u092a\u0915\u093e \u092a\u0930\u093f\u0935\u093E\u0930",
      messages: [
        "\u091c\u0928\u094d\u092e\u0926\u093f\u0928 \u092e\u0941\u092c\u093e\u0930\u0915 \u092e\u0940\u0930\u093e! \u0924\u0941\u092e \u0939\u092e\u0947\u0936\u093e \u0916\u0941\u0936 \u0930\u0939\u094b\u0964",
      ],
      memories: [],
      media: meeraMedia,
      music: "happy-pop",
      status: "PUBLISHED",
      revealAt: null,
      settings: { wishesWall: true, showViews: true },
      stats: { views: 0, uniqueViews: 0, wishes: 0 },
    },
    {
      slug: "dev-farewell-3c8z",
      occasion: "FAREWELL",
      language: "ENGLISH",
      templateId: "royal-gold",
      accent: "#D4AF37",
      recipient: { name: "Dev", nickname: "", relation: "Colleague" },
      from: "The platform team",
      messages: ["Go do great things. We will keep your seat warm and your coffee mug safe."],
      memories: [],
      media: devMedia,
      music: "soft-piano",
      status: "SCHEDULED",
      revealAt,
      settings: { wishesWall: true, showViews: false },
      stats: { views: 0, uniqueViews: 0, wishes: 0 },
    },
    {
      slug: "sana-friendship-5h2q",
      occasion: "FRIENDSHIP",
      language: "HINGLISH",
      templateId: "pastel-dream",
      accent: "#F472B6",
      recipient: { name: "Sana", nickname: "Sanu", relation: "Best friend" },
      from: "Neha",
      messages: ["Tere jaisa dost milna lucky hai. Happy Friendship Day!"],
      memories: [],
      media: sanaMedia,
      music: "party-beat",
      status: "PUBLISHED",
      revealAt: null,
      passwordHash: sanaPasswordHash,
      settings: { wishesWall: true, showViews: false },
      stats: { views: 0, uniqueViews: 0, wishes: 0 },
    },
  ];

  for (const seed of seedPages) {
    const thumbnailUrl = thumbnailOf(seed.media);
    await Page.updateOne(
      { slug: seed.slug },
      {
        $set: {
          ownerId: creator._id,
          status: seed.status,
          occasion: seed.occasion,
          customOccasionLabel: "",
          occasionDate: null,
          revealAt: seed.revealAt ?? null,
          recipient: seed.recipient,
          from: seed.from,
          language: seed.language,
          messages: seed.messages,
          memories: seed.memories,
          media: seed.media,
          theme: {
            templateId: seed.templateId,
            accent: seed.accent,
            font: "default",
            music: seed.music,
            decorations: DEFAULT_DECORATIONS[seed.occasion] ?? ["sparkles"],
          },
          "settings.wishesWall": seed.settings.wishesWall,
          "settings.showViews": seed.settings.showViews,
          ...(seed.passwordHash ? { "settings.passwordHash": seed.passwordHash } : {}),
          ogImageUrl: `${APP_URL}/api/og/${seed.slug}`,
          thumbnailUrl,
          stats: seed.stats,
          draftStep: 6,
        },
        ...(seed.passwordHash ? {} : { $unset: { "settings.passwordHash": "" } }),
      },
      { upsert: true },
    );
  }
  console.log(`Pages upserted: ${seedPages.map((p) => p.slug).join(", ")}`);

  // 4. Wishes for the Riya seed page (idempotent, and stats.wishes stays at 3).
  const riya = await Page.findOne({ slug: "riya-birthday-7f3a" }).lean();
  if (!riya) throw new Error("Seed failed: riya page missing");
  const wishes = [
    { name: "Aarav", message: "Happy birthday Riya! Have the best year.", emoji: "" },
    { name: "Meera", message: "Best day for the best person.", emoji: "\u2728" },
    { name: "Kabir", message: "Party kab hai? Count me in.", emoji: "\u{1F389}" },
  ];
  for (const wish of wishes) {
    await Wish.updateOne(
      { pageId: riya._id, name: wish.name, message: wish.message },
      { $set: { emoji: wish.emoji, isHidden: false, visitorId: "seed", ipHash: "" } },
      { upsert: true },
    );
  }
  await Page.updateOne({ _id: riya._id }, { $set: { "stats.wishes": 3 } });
  console.log(`Wishes ready for riya-birthday-7f3a: ${wishes.length}`);

  // 5. Analytics that agree with the seeded counters (31 lifetime uniques, 47 views).
  const visitorIds = Array.from({ length: 31 }, (_, i) => `seed-visitor-${i + 1}`);
  for (const visitorId of visitorIds) {
    await PageVisitor.updateOne(
      { pageId: riya._id, visitorId },
      { $setOnInsert: { pageId: riya._id, visitorId } },
      { upsert: true },
    );
  }
  for (const day of dailyDistribution(47)) {
    await DailyStat.updateOne(
      { pageId: riya._id, date: day.date },
      { $set: { views: day.views }, $setOnInsert: { pageId: riya._id, date: day.date } },
      { upsert: true },
    );
  }
  console.log("Analytics fixtures ready: 31 unique visitors, 47 views over 30 days");

  // 6. Summary
  console.log("\nSeed complete. Open these links:");
  for (const seed of seedPages) {
    const extra =
      seed.slug === "sana-friendship-5h2q"
        ? "  (password: friends123)"
        : seed.slug === "dev-farewell-3c8z"
          ? `  (unlocks ${revealAt.toISOString()})`
          : "";
    console.log(`  ${APP_URL}/w/${seed.slug}${extra}`);
  }
  console.log("\nLogins: admin@demo.com / Admin@123  |  creator@demo.com / Creator@123");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
