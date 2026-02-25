import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const openId = (opts.req.header("x-open-id") ?? "").trim();
  const name = (opts.req.header("x-name") ?? "").trim();

  let user: User | null = null;

  if (openId) {
    await db.upsertUser({
      openId,
      name: name || undefined,
      loginMethod: "local_header",
      lastSignedIn: new Date(),
    });
    user = (await db.getUserByOpenId(openId)) ?? null;
  }

  return { req: opts.req, res: opts.res, user };
}