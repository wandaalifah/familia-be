import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { passwordSchema } from '../src/common/dto/password.dto';

const BCRYPT_ROUNDS = 10;

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to seed the first admin`);
  }
  return value;
};

// Creates the first admin account. Credentials come from env, never from source.
// Idempotent: does nothing when an account with that email already exists.
async function main() {
  const email = requireEnv('SEED_ADMIN_EMAIL');
  const phone = requireEnv('SEED_ADMIN_PHONE');
  const password = passwordSchema.parse(requireEnv('SEED_ADMIN_PASSWORD'));
  const firstName = process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Admin';
  const lastName = process.env.SEED_ADMIN_LAST_NAME?.trim() || 'Familia';

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const existing = await prisma.users.findFirst({
      where: { OR: [{ email }, { phone }] },
      select: { id: true, email: true, role: true },
    });

    if (existing) {
      console.log(`Seed skipped: user ${existing.email} already exists (role ${existing.role})`);
      return;
    }

    await prisma.users.create({
      data: {
        email,
        phone,
        password: await bcrypt.hash(password, BCRYPT_ROUNDS),
        first_name: firstName,
        last_name: lastName,
        role: Role.ADMIN,
      },
    });
    console.log(`Seed complete: admin ${email} created`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
