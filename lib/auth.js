import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "grocery_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-only-secret-change-me";
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  return getAdminEmails().includes((email || "").trim().toLowerCase());
}

export function getAdminPassword() {
  return (process.env.ADMIN_PASSWORD || "").trim();
}

export function createSessionToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: SESSION_MAX_AGE,
  });
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

function isDatabaseUnavailableError(error) {
  if (["P1001", "P1002", "P1008", "P1017"].includes(error?.code)) {
    return true;
  }

  const message = String(error?.message || error || "").toLowerCase();

  return [
    "can't reach database server",
    "timed out fetching a new connection",
    "connection error",
    "connection refused",
    "server closed the connection unexpectedly",
    "remaining connection slots are reserved",
    "enotfound",
    "econnreset",
  ].some((fragment) => message.includes(fragment));
}

export async function getCurrentUser(options = {}) {
  const { suppressDatabaseErrors = false } = options;
  const session = await getSession();

  if (!session?.id) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    return user;
  } catch (error) {
    if (suppressDatabaseErrors && isDatabaseUnavailableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  return user;
}

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
