import { jwtDecode } from 'jwt-decode';

// ─── MS/SOAP Claim URIs emitted by the C# backend ───────────────────────────
const CLAIM_ROLE   = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const CLAIM_NAME   = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const CLAIM_EMAIL  = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const CLAIM_ACTOR  = 'http://schemas.xmlsoap.org/ws/2009/09/identity/claims/actor';

export { CLAIM_ROLE, CLAIM_NAME, CLAIM_EMAIL, CLAIM_ACTOR };

/**
 * Shape of the decoded JWT issued by the school API backend.
 * Standard claims are typed precisely, custom/schema URI claims use the index signature.
 */
export interface JwtPayload {
  /** User ID (guid) */
  sub: string;
  /** JWT unique identifier */
  jti?: string;
  /** Whether the user must change their password on next login */
  mustChangePassword?: string | boolean;
  /** Expiry timestamp (Unix seconds) */
  exp: number;
  /** Issued-at timestamp (Unix seconds) */
  iat?: number;
  /** MS role claim — "Teacher" | "Student" etc. */
  [CLAIM_ROLE]?: string;
  /** SOAP name claim */
  [CLAIM_NAME]?: string;
  /** SOAP email claim */
  [CLAIM_EMAIL]?: string;
  /** SOAP actor claim — "Staff" | "Student" */
  [CLAIM_ACTOR]: string;
  // Allow any other claims without losing type safety on the known ones above
  [key: string]: unknown;
}

/**
 * Decodes a JWT without verifying the signature.
 * Signature verification is always done server-side.
 */
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
};

/**
 * Returns `true` when the token is within 30 seconds of expiry or already expired.
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwt(token);
  if (!payload) return true;
  return Date.now() / 1000 >= payload.exp - 30;
};
