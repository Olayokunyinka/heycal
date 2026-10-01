import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const database = drizzle(client, { schema });

export const db = new Proxy(database, {
  get(target, property) {
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in production");
    }

    const value = Reflect.get(target, property, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
