import { PrismaClient } from "./prisma-client/client";

const prismaClientSingleton = () => {
  // @ts-expect-error - Prisma 7 type mismatch workaround
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
