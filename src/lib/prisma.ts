import { PrismaClient } from '@prisma/client';

// Lazy Prisma Singleton for Build Safety
// We use a Proxy or a getter to ensure new PrismaClient() is NOT called 
// during module evaluation (which happens during Next.js build), 
// but only when functionality is actually accessed.

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  const dbHost = dbUrl.split('@')[1]?.split(':')[0] || 'unknown';
  console.log(`[Prisma] Initializing with DB Host: ${dbHost}`);
  
  if (dbHost.includes('render.com')) {
    console.warn('⚠️ WARNING: Connecting to Render.com database instead of Supabase! Check your DATABASE_URL environment variable.');
  }
  
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
