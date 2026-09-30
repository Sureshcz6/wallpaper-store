/**
 * Demo/seed data for development only. Clearly separate from production
 * content - delete or replace via the admin panel before going live.
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hash("ChangeThisPassword123!");

    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
      },
    });

    console.log(
      `Seeded admin: ${adminEmail} / ChangeThisPassword123! (change this immediately)`
    );
  }

  const category = await prisma.category.upsert({
    where: { slug: "ai-bundles" },
    update: {},
    create: {
      name: "AI Bundles",
      slug: "ai-bundles",
    },
  });

  const demoProducts = [
    {
      name: "2000+ AI Bundle (Demo)",
      slug: "2000-ai-bundle-demo",
      shortDescription: "AI prompts, tools & resources.",
      fullDescription:
        "Demo seed product. Replace or delete from the admin panel.",
      price: 9900,
      originalPrice: 99900,
    },
    {
      name: "AI Prompt Master Bundle (Demo)",
      slug: "ai-prompt-master-bundle-demo",
      shortDescription: "A curated set of high-performing prompts.",
      fullDescription:
        "Demo seed product. Replace or delete from the admin panel.",
      price: 9900,
      originalPrice: 99900,
    },
  ];

  for (const p of demoProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        categoryId: category.id,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800",
        features: [
          "Instant download",
          "Lifetime access",
          "Regularly updated",
        ],
        whatsIncluded: [
          "2000+ curated resources",
          "PDF guide",
          "Bonus templates",
        ],
        faqs: [
          {
            question: "How do I receive the product?",
            answer:
              "Instantly after payment via a secure download link.",
          },
        ],
        tags: ["ai", "bundle", "demo"],
        status: "PUBLISHED",
        isBestseller: true,
        deliveryInstructions:
          "This is demo seed data. Replace deliveryInstructions and files with real content.",
      },
    });
  }

  console.log(
    'Seed complete. Demo products are clearly marked "(Demo)" - remove them before launch.'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });