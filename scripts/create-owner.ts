import "dotenv/config";
import prisma from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const name = process.env.INITIAL_ADMIN_NAME?.trim() || "Owner";
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const shouldResetExistingOwner =
    process.env.RESET_INITIAL_OWNER_PASSWORD === "true";

  if (!email || !password) {
    throw new Error(
      "Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD before running this script.",
    );
  }

  if (password.length < 8) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const activeOwner = await prisma.user.findFirst({
    where: { role: "OWNER", isActive: true },
    select: { id: true, email: true },
  });

  if (activeOwner && !shouldResetExistingOwner) {
    console.log(`Active owner already exists: ${activeOwner.email}`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        passwordHash,
        role: "OWNER",
        isActive: true,
      },
      select: { id: true },
    });
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "OWNER",
        isActive: true,
      },
      select: { id: true },
    });
  }

  console.log(`Owner account is ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
