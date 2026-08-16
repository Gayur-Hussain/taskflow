import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
    }
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
});

const db = {
    connectDB: async () => {
        try {
            await prisma.$connect();
            console.log("Database connected successfully via Prisma");
        } catch (error) {
            console.error(`Database connection error: ${error.message}`);
            process.exit(1);
        }
    },
    disconnectDB: async () => {
        await prisma.$disconnect();
        await pool.end();
    },
};

export { prisma };
export default db;