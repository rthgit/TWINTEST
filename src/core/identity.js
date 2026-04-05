import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createId } from "./id.js";

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function createUserRecord({ email, displayName = "", password, createdBy = "self_service" }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (!String(password || "").trim()) {
    throw new Error("Password is required.");
  }

  return {
    id: createId("user"),
    email: normalizedEmail,
    displayName: String(displayName || normalizedEmail.split("@")[0]).trim(),
    passwordHash: hashPassword(password),
    status: "active",
    createdAt: new Date().toISOString(),
    createdBy,
    lastLoginAt: null
  };
}

export function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    createdAt: user.createdAt,
    createdBy: user.createdBy,
    lastLoginAt: user.lastLoginAt
  };
}

export function verifyUserPassword(user, password) {
  const [saltHex, derivedHex] = String(user.passwordHash || "").split(":");

  if (!saltHex || !derivedHex) {
    return false;
  }

  const expected = Buffer.from(derivedHex, "hex");
  const actual = scryptSync(String(password || ""), Buffer.from(saltHex, "hex"), expected.length);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createWorkspaceMembership({
  workspaceId,
  userId,
  role = "viewer",
  createdBy = "workspace_owner"
}) {
  return {
    id: createId("membership"),
    workspaceId,
    userId,
    role,
    status: "active",
    createdAt: new Date().toISOString(),
    createdBy,
    lastUsedAt: null
  };
}

export function sanitizeWorkspaceMembership({ membership, user }) {
  return {
    id: membership.id,
    workspaceId: membership.workspaceId,
    userId: membership.userId,
    role: membership.role,
    status: membership.status,
    createdAt: membership.createdAt,
    createdBy: membership.createdBy,
    lastUsedAt: membership.lastUsedAt,
    user: user ? sanitizeUser(user) : null
  };
}

export function issueSessionToken() {
  return `ttss_${randomBytes(24).toString("hex")}`;
}

export function hashSessionToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

export function createSessionRecord({
  workspaceId,
  userId,
  role,
  membershipId,
  token,
  expiresInDays = 14
}) {
  const issuedToken = token || issueSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return {
    session: {
      id: createId("session"),
      workspaceId,
      userId,
      role,
      membershipId,
      status: "active",
      tokenHash: hashSessionToken(issuedToken),
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastUsedAt: null
    },
    sessionToken: issuedToken
  };
}

export function sanitizeSession({ session, user }) {
  return {
    id: session.id,
    workspaceId: session.workspaceId,
    userId: session.userId,
    role: session.role,
    membershipId: session.membershipId,
    status: session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    lastUsedAt: session.lastUsedAt,
    user: user ? sanitizeUser(user) : null
  };
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(String(password || ""), salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}
