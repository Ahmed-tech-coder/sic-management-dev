import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const DEFAULT_TRACKS = [
  "Frontend Development",
  "Backend Development",
  "Artificial Intelligence",
  "Cybersecurity",
  "Data Analysis",
  "UI / UX",
  "HR",
  "Media"
];

interface SeedUser {
  email: string;
  phone: string;
  password?: string;
  name: string;
  role: 'leader' | 'head' | 'hr';
  head_type?: 'head' | 'vice_head' | null;
  track_id?: string | null;
  is_active: boolean;
}

async function ensureUserExists(user: SeedUser) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: user.email.toLowerCase().trim() },
        { phone: user.phone.trim() }
      ]
    }
  });

  const passwordHash = await bcrypt.hash(user.password || "Password123!", 10);

  if (existingUser) {
    console.log(`[UPDATE] User already exists, syncing info: ${user.name} (${user.email})`);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: user.name,
        phone: user.phone,
        email: user.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: user.role,
        head_type: user.head_type || null,
        track_id: user.track_id || null,
        is_active: user.is_active,
      }
    });
  } else {
    console.log(`[CREATE] Creating user: ${user.name} (${user.email})...`);
    await prisma.user.create({
      data: {
        name: user.name,
        phone: user.phone,
        email: user.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: user.role,
        head_type: user.head_type || null,
        track_id: user.track_id || null,
        is_active: user.is_active,
      }
    });
  }
}

async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Seed default tracks via Prisma
    const existingTracks = await prisma.track.findMany({
      select: { name: true },
    });

    const existingTrackNames = existingTracks.map((t) => t.name);
    const tracksToInsert = DEFAULT_TRACKS.filter(
      (t) => !existingTrackNames.includes(t),
    );

    if (tracksToInsert.length > 0) {
      console.log(`Inserting ${tracksToInsert.length} new tracks...`);
      await prisma.track.createMany({
        data: tracksToInsert.map((name) => ({ name })),
      });
      console.log("Tracks inserted successfully.");
    } else {
      console.log("All default tracks already exist.");
    }

    // 2. Seed Leader account
    const leaderPhone = "+201228895185";
    const leaderEmail = "leader@sic-communinty.com";
    const leaderPassword = "Password123!";
    const leaderName = "SIC Leader";

    const leaderUser: SeedUser = {
      email: leaderEmail,
      phone: leaderPhone,
      password: leaderPassword,
      name: leaderName,
      role: "leader",
      is_active: true,
    };

    await ensureUserExists(leaderUser);

    console.log("Database seeding completed successfully.");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
