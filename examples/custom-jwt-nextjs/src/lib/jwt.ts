import { SignJWT, jwtVerify } from "jose";

const ISSUER = "custom-jwt-example";
const TOKEN_TTL = "7d";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_JWT_SECRET is missing or too short (need ≥32 chars). Copy .env.example to .env and set it.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type JwtClaims = {
  sub: string;
  email: string;
  name: string;
};

/** Sign a short-lived HS256 access token for a user. */
export async function signAccessToken(claims: JwtClaims): Promise<string> {
  return new SignJWT({ email: claims.email, name: claims.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

/** Verify a bearer token. Returns the claims, or null if invalid/expired. */
export async function verifyAccessToken(token: string): Promise<JwtClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
