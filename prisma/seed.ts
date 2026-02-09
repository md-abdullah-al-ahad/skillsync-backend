import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "STUDENT" | "TUTOR";
  image?: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) return existing;

  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      id: userId,
      name: data.name,
      email: data.email,
      emailVerified: true,
      role: data.role,
      status: "ACTIVE",
      image: data.image || null,
      phone: data.phone || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return user;
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── Categories ───────────────────────────────────────────────
  const defaultCategories = [
    { name: "Mathematics", slug: "mathematics" },
    { name: "Physics", slug: "physics" },
    { name: "Chemistry", slug: "chemistry" },
    { name: "Biology", slug: "biology" },
    { name: "English", slug: "english" },
    { name: "Computer Science", slug: "computer-science" },
    { name: "History", slug: "history" },
    { name: "Music", slug: "music" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of defaultCategories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug },
    });
    categories[cat.slug] = created.id;
  }
  console.log(`✅ ${defaultCategories.length} categories seeded.`);

  // ─── Admin User ───────────────────────────────────────────────
  const admin = await createUser({
    name: "Admin",
    email: "admin@skillsync.com",
    password: "Admin@123",
    role: "ADMIN",
    image:
      "https://api.dicebear.com/9.x/initials/svg?seed=Admin&backgroundColor=1e3a5f",
  });
  console.log("✅ Admin: admin@skillsync.com / Admin@123");

  // ─── Student Users ────────────────────────────────────────────
  const studentsData = [
    {
      name: "Rahim Ahmed",
      email: "student@skillsync.com",
      password: "Student@123",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      phone: "+8801712345678",
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@gmail.com",
      password: "Student@123",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      phone: "+8801812345679",
    },
    {
      name: "Karim Hossain",
      email: "karim.hossain@gmail.com",
      password: "Student@123",
      image: "https://randomuser.me/api/portraits/men/75.jpg",
      phone: "+8801912345680",
    },
    {
      name: "Emily Chen",
      email: "emily.chen@gmail.com",
      password: "Student@123",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      phone: "+8801612345681",
    },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await createUser({ ...s, role: "STUDENT" });
    students.push(student);
  }
  console.log(
    `✅ ${students.length} students seeded. (Login: student@skillsync.com / Student@123)`,
  );

  // ─── Tutor Users + Profiles ───────────────────────────────────
  const tutorsData = [
    {
      name: "Dr. Ayesha Rahman",
      email: "tutor@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/women/26.jpg",
      phone: "+8801711111111",
      bio: "PhD in Mathematics from MIT with 12+ years of teaching experience. I specialize in calculus, linear algebra, and statistics. My teaching approach focuses on building intuition before formulas — I believe anyone can master math with the right guidance.",
      hourlyRate: 45,
      experience: 12,
      categorySlugs: ["mathematics", "physics"],
      availability: [
        { day: "MON", start: "09:00", end: "12:00" },
        { day: "MON", start: "14:00", end: "17:00" },
        { day: "WED", start: "09:00", end: "12:00" },
        { day: "WED", start: "14:00", end: "17:00" },
        { day: "FRI", start: "10:00", end: "13:00" },
        { day: "SAT", start: "09:00", end: "11:00" },
      ],
    },
    {
      name: "James Rodriguez",
      email: "james.rodriguez@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/men/52.jpg",
      phone: "+8801722222222",
      bio: "Former Google engineer turned educator. I teach Python, JavaScript, data structures, and web development. I love breaking down complex CS concepts into simple, digestible lessons with real-world projects.",
      hourlyRate: 60,
      experience: 8,
      categorySlugs: ["computer-science", "mathematics"],
      availability: [
        { day: "TUE", start: "10:00", end: "13:00" },
        { day: "TUE", start: "15:00", end: "18:00" },
        { day: "THU", start: "10:00", end: "13:00" },
        { day: "THU", start: "15:00", end: "18:00" },
        { day: "SAT", start: "10:00", end: "14:00" },
      ],
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/women/57.jpg",
      phone: "+8801733333333",
      bio: "Passionate chemistry teacher with a knack for making organic chemistry fun! I have published 15+ research papers and taught at both high school and university levels. My students consistently score in the top 10%.",
      hourlyRate: 40,
      experience: 10,
      categorySlugs: ["chemistry", "biology"],
      availability: [
        { day: "MON", start: "08:00", end: "11:00" },
        { day: "WED", start: "08:00", end: "11:00" },
        { day: "WED", start: "13:00", end: "16:00" },
        { day: "FRI", start: "08:00", end: "11:00" },
        { day: "FRI", start: "13:00", end: "16:00" },
      ],
    },
    {
      name: "Michael Thompson",
      email: "michael.thompson@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      phone: "+8801744444444",
      bio: "Native English speaker with CELTA and DELTA certifications. 7 years of experience teaching IELTS, TOEFL, and academic writing. I've helped over 500 students achieve their target band scores.",
      hourlyRate: 35,
      experience: 7,
      categorySlugs: ["english", "history"],
      availability: [
        { day: "MON", start: "11:00", end: "14:00" },
        { day: "TUE", start: "11:00", end: "14:00" },
        { day: "WED", start: "11:00", end: "14:00" },
        { day: "THU", start: "11:00", end: "14:00" },
        { day: "FRI", start: "11:00", end: "14:00" },
      ],
    },
    {
      name: "Dr. Tanvir Hasan",
      email: "tanvir.hasan@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
      phone: "+8801755555555",
      bio: "Associate Professor of Physics at BUET. I specialize in quantum mechanics, thermodynamics, and electromagnetism. My goal is to make physics accessible and exciting for every student.",
      hourlyRate: 50,
      experience: 15,
      categorySlugs: ["physics", "mathematics"],
      availability: [
        { day: "TUE", start: "08:00", end: "11:00" },
        { day: "THU", start: "08:00", end: "11:00" },
        { day: "SAT", start: "08:00", end: "12:00" },
        { day: "SUN", start: "09:00", end: "12:00" },
      ],
    },
    {
      name: "Sophia Williams",
      email: "sophia.williams@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/women/33.jpg",
      phone: "+8801766666666",
      bio: "Berklee College of Music graduate and professional pianist. I teach piano, music theory, and composition for all levels — from absolute beginners to advanced performers preparing for auditions.",
      hourlyRate: 55,
      experience: 9,
      categorySlugs: ["music"],
      availability: [
        { day: "MON", start: "15:00", end: "19:00" },
        { day: "WED", start: "15:00", end: "19:00" },
        { day: "FRI", start: "15:00", end: "19:00" },
        { day: "SAT", start: "13:00", end: "17:00" },
      ],
    },
    {
      name: "Fatima Begum",
      email: "fatima.begum@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/women/71.jpg",
      phone: "+8801777777777",
      bio: "Molecular biology researcher with 6 years of tutoring experience. I make complex biological concepts easy to understand using visual aids, animations, and real-world case studies. Perfect for HSC and university-level students.",
      hourlyRate: 30,
      experience: 6,
      categorySlugs: ["biology", "chemistry"],
      availability: [
        { day: "MON", start: "10:00", end: "13:00" },
        { day: "TUE", start: "14:00", end: "17:00" },
        { day: "THU", start: "14:00", end: "17:00" },
        { day: "SUN", start: "10:00", end: "14:00" },
      ],
    },
    {
      name: "David Park",
      email: "david.park@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
      phone: "+8801788888888",
      bio: "Full-stack developer and CS educator. I teach algorithms, system design, and machine learning. Previously mentored at Google Summer of Code and teach competitive programming at national level.",
      hourlyRate: 65,
      experience: 11,
      categorySlugs: ["computer-science"],
      availability: [
        { day: "MON", start: "18:00", end: "21:00" },
        { day: "WED", start: "18:00", end: "21:00" },
        { day: "FRI", start: "18:00", end: "21:00" },
        { day: "SAT", start: "15:00", end: "19:00" },
        { day: "SUN", start: "15:00", end: "19:00" },
      ],
    },
    {
      name: "Prof. Nadia Islam",
      email: "nadia.islam@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/women/42.jpg",
      phone: "+8801799999999",
      bio: "History professor with expertise in world civilizations, modern history, and South Asian studies. I use storytelling and primary source analysis to bring history to life. Published author of 3 history textbooks.",
      hourlyRate: 38,
      experience: 14,
      categorySlugs: ["history", "english"],
      availability: [
        { day: "TUE", start: "09:00", end: "12:00" },
        { day: "THU", start: "09:00", end: "12:00" },
        { day: "SAT", start: "10:00", end: "13:00" },
      ],
    },
    {
      name: "Alex Chen",
      email: "alex.chen@skillsync.com",
      password: "Tutor@123",
      image: "https://randomuser.me/api/portraits/men/11.jpg",
      phone: "+8801700000000",
      bio: "Mathematics olympiad gold medalist and Stanford graduate. I specialize in SAT/GRE math prep, discrete mathematics, and number theory. My structured problem-solving approach has helped 200+ students improve their scores by 20%+.",
      hourlyRate: 55,
      experience: 5,
      categorySlugs: ["mathematics"],
      availability: [
        { day: "MON", start: "08:00", end: "11:00" },
        { day: "TUE", start: "16:00", end: "19:00" },
        { day: "WED", start: "08:00", end: "11:00" },
        { day: "THU", start: "16:00", end: "19:00" },
        { day: "SAT", start: "08:00", end: "12:00" },
      ],
    },
  ];

  const tutorProfiles: {
    tutorProfileId: string;
    userId: string;
    name: string;
  }[] = [];

  for (const t of tutorsData) {
    const user = await createUser({
      name: t.name,
      email: t.email,
      password: t.password,
      role: "TUTOR",
      image: t.image,
      phone: t.phone,
    });

    // Upsert tutor profile
    const profile = await prisma.tutorProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: t.bio,
        hourlyRate: t.hourlyRate,
        experience: t.experience,
      },
      create: {
        userId: user.id,
        bio: t.bio,
        hourlyRate: t.hourlyRate,
        experience: t.experience,
      },
    });

    // Link categories
    for (const slug of t.categorySlugs) {
      const catId = categories[slug];
      if (catId) {
        await prisma.tutorCategory.upsert({
          where: {
            tutorProfileId_categoryId: {
              tutorProfileId: profile.id,
              categoryId: catId,
            },
          },
          update: {},
          create: {
            tutorProfileId: profile.id,
            categoryId: catId,
          },
        });
      }
    }

    // Create availability slots
    const existingSlots = await prisma.availabilitySlot.findMany({
      where: { tutorProfileId: profile.id },
    });
    if (existingSlots.length === 0) {
      for (const slot of t.availability) {
        await prisma.availabilitySlot.create({
          data: {
            tutorProfileId: profile.id,
            dayOfWeek: slot.day as any,
            startTime: slot.start,
            endTime: slot.end,
            isActive: true,
          },
        });
      }
    }

    tutorProfiles.push({
      tutorProfileId: profile.id,
      userId: user.id,
      name: t.name,
    });
  }

  console.log(
    `✅ ${tutorProfiles.length} tutors seeded. (Login: tutor@skillsync.com / Tutor@123)`,
  );

  // ─── Bookings ─────────────────────────────────────────────────
  // Create sample bookings between students and tutors
  const now = new Date();

  const bookingsData = [
    // Completed bookings (past) — for review demonstrations
    {
      studentIdx: 0,
      tutorIdx: 0,
      dayOffset: -14,
      startHour: 10,
      duration: 1,
      status: "COMPLETED" as const,
    },
    {
      studentIdx: 0,
      tutorIdx: 1,
      dayOffset: -10,
      startHour: 11,
      duration: 2,
      status: "COMPLETED" as const,
    },
    {
      studentIdx: 1,
      tutorIdx: 0,
      dayOffset: -7,
      startHour: 14,
      duration: 1,
      status: "COMPLETED" as const,
    },
    {
      studentIdx: 1,
      tutorIdx: 2,
      dayOffset: -5,
      startHour: 9,
      duration: 1.5,
      status: "COMPLETED" as const,
    },
    {
      studentIdx: 2,
      tutorIdx: 3,
      dayOffset: -12,
      startHour: 12,
      duration: 1,
      status: "COMPLETED" as const,
    },
    {
      studentIdx: 2,
      tutorIdx: 4,
      dayOffset: -3,
      startHour: 9,
      duration: 2,
      status: "COMPLETED" as const,
    },
    {
      studentIdx: 3,
      tutorIdx: 5,
      dayOffset: -8,
      startHour: 16,
      duration: 1,
      status: "COMPLETED" as const,
    },
    {
      studentIdx: 3,
      tutorIdx: 1,
      dayOffset: -6,
      startHour: 15,
      duration: 1.5,
      status: "COMPLETED" as const,
    },
    // Upcoming confirmed bookings
    {
      studentIdx: 0,
      tutorIdx: 2,
      dayOffset: 3,
      startHour: 9,
      duration: 1,
      status: "CONFIRMED" as const,
    },
    {
      studentIdx: 0,
      tutorIdx: 4,
      dayOffset: 5,
      startHour: 10,
      duration: 2,
      status: "CONFIRMED" as const,
    },
    {
      studentIdx: 1,
      tutorIdx: 7,
      dayOffset: 4,
      startHour: 19,
      duration: 1,
      status: "CONFIRMED" as const,
    },
    {
      studentIdx: 2,
      tutorIdx: 0,
      dayOffset: 7,
      startHour: 14,
      duration: 1,
      status: "CONFIRMED" as const,
    },
    // Cancelled booking
    {
      studentIdx: 3,
      tutorIdx: 3,
      dayOffset: -1,
      startHour: 12,
      duration: 1,
      status: "CANCELLED" as const,
    },
  ];

  const createdBookings: {
    id: string;
    studentIdx: number;
    tutorIdx: number;
    status: string;
  }[] = [];

  // Check if bookings already exist
  const existingBookingsCount = await prisma.booking.count();
  if (existingBookingsCount === 0) {
    for (const b of bookingsData) {
      const student = students[b.studentIdx];
      const tutor = tutorProfiles[b.tutorIdx];
      if (!student || !tutor) continue;

      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() + b.dayOffset);
      startTime.setHours(b.startHour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(
        startTime.getHours() + Math.floor(b.duration),
        startTime.getMinutes() + (b.duration % 1) * 60,
        0,
        0,
      );

      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { id: tutor.tutorProfileId },
      });
      const price = (tutorProfile?.hourlyRate || 40) * b.duration;

      const booking = await prisma.booking.create({
        data: {
          studentId: student.id,
          tutorProfileId: tutor.tutorProfileId,
          startTime,
          endTime,
          price,
          status: b.status,
        },
      });

      createdBookings.push({
        id: booking.id,
        studentIdx: b.studentIdx,
        tutorIdx: b.tutorIdx,
        status: b.status,
      });
    }
    console.log(`✅ ${createdBookings.length} bookings seeded.`);
  } else {
    console.log("✅ Bookings already exist, skipping.");
  }

  // ─── Reviews ──────────────────────────────────────────────────
  const reviewsData = [
    {
      bookingIdx: 0,
      rating: 5,
      comment:
        "Dr. Ayesha is an incredible math tutor! She explained calculus concepts so clearly that I finally understood limits and derivatives. Highly recommended!",
    },
    {
      bookingIdx: 1,
      rating: 5,
      comment:
        "James is amazing at teaching programming. He helped me build my first full-stack project and now I feel confident with JavaScript and React.",
    },
    {
      bookingIdx: 2,
      rating: 4,
      comment:
        "Very thorough in explaining algebra concepts. Dr. Ayesha is patient and makes sure you really understand before moving on.",
    },
    {
      bookingIdx: 3,
      rating: 5,
      comment:
        "Priya made organic chemistry so much easier to understand. Her visual explanations and real-world examples were fantastic!",
    },
    {
      bookingIdx: 4,
      rating: 4,
      comment:
        "Michael is a great English tutor. My IELTS writing score improved from 6.0 to 7.5 after just a few sessions!",
    },
    {
      bookingIdx: 5,
      rating: 5,
      comment:
        "Dr. Tanvir makes physics fascinating. His quantum mechanics explanations are out of this world. Best physics tutor I've ever had!",
    },
    {
      bookingIdx: 6,
      rating: 4,
      comment:
        "Sophia is a wonderful music teacher. Very patient with beginners and her piano teaching method is excellent.",
    },
    {
      bookingIdx: 7,
      rating: 5,
      comment:
        "James' approach to system design and algorithms is top-notch. He prepared me well for my tech interviews. Got into my dream company!",
    },
  ];

  const existingReviewsCount = await prisma.review.count();
  if (existingReviewsCount === 0 && createdBookings.length > 0) {
    for (const r of reviewsData) {
      const booking = createdBookings[r.bookingIdx];
      if (!booking || booking.status !== "COMPLETED") continue;

      const student = students[booking.studentIdx];
      const tutor = tutorProfiles[booking.tutorIdx];
      if (!student || !tutor) continue;

      await prisma.review.create({
        data: {
          bookingId: booking.id,
          studentId: student.id,
          tutorProfileId: tutor.tutorProfileId,
          rating: r.rating,
          comment: r.comment,
        },
      });

      // Update tutor's rating average
      const allReviews = await prisma.review.findMany({
        where: { tutorProfileId: tutor.tutorProfileId },
        select: { rating: true },
      });

      const avgRating =
        allReviews.reduce((sum, rev) => sum + rev.rating, 0) /
        allReviews.length;

      await prisma.tutorProfile.update({
        where: { id: tutor.tutorProfileId },
        data: {
          ratingAvg: Math.round(avgRating * 10) / 10,
          ratingCount: allReviews.length,
        },
      });
    }
    console.log(`✅ ${reviewsData.length} reviews seeded.`);
  } else {
    console.log("✅ Reviews already exist, skipping.");
  }

  // ─── Summary ──────────────────────────────────────────────────
  console.log("\n🌱 Seeding complete!\n");
  console.log("┌──────────────────────────────────────────────────┐");
  console.log("│  Login Credentials                               │");
  console.log("├──────────────────────────────────────────────────┤");
  console.log("│  👑 Admin:   admin@skillsync.com / Admin@123     │");
  console.log("│  🎓 Student: student@skillsync.com / Student@123 │");
  console.log("│  🧑‍🏫 Tutor:   tutor@skillsync.com / Tutor@123    │");
  console.log("│                                                  │");
  console.log("│  All tutor/student passwords: [Role]@123         │");
  console.log("└──────────────────────────────────────────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
