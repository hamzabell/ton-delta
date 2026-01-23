import { PrismaClient } from '@prisma/client';

// Lazy Prisma Singleton for Build Safety
// We use a Proxy or a getter to ensure new PrismaClient() is NOT called 
// during module evaluation (which happens during Next.js build), 
// but only when functionality is actually accessed.

const prismaClientSingleton = () => {
  return new PrismaClient({});
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = global as unknown as { prisma: PrismaClientSingleton };

// Use a getter to delay instantiation
const getPrisma = (): PrismaClientSingleton => {
  if (process.env.NODE_ENV === 'production') {
    return prismaClientSingleton();
  }
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaClientSingleton();
  }
  return globalForPrisma.prisma;
};

// Export a robust object that behaves like PrismaClient but initializes lazily
export const prisma = new Proxy({} as PrismaClientSingleton, {
  get(target, prop) {
    const client = getPrisma();
    return client[prop as keyof PrismaClientSingleton];
  },
});
