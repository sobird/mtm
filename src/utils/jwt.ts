/**
 * JSON Web Token
 *
 * sobird<i@sobird.me> at 2021/11/15 15:25:21 created.
 */

import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { nanoid } from "nanoid";

const JWT_SECRET_KEY = "JWT_SECRET_KEY";

/**
 *
 * iss, JWT Issuer: 签发人
 * exp, JWT Expiration Time: 过期时间
 * sub, JWT Subject: 主题
 * aud, JWT Audience: 受众
 * nbf, JWT Not Before: 生效时间
 * iat, JWT Issued At: 签发时间
 * jti, JWT ID: 编号
 * 
 * @returns Promise<string>
 */
export async function signJWT(payload: JWTPayload = {}) {
  const token = await new SignJWT(payload)
    // Sets the JWS Protected Header on the SignJWT object.
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .setJti(nanoid())
    // Signs and returns the JWT.
    .sign(new TextEncoder().encode(JWT_SECRET_KEY));

  return token;
}

export async function verifyJWT(token: string) {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(JWT_SECRET_KEY)
  )
  return verified.payload
}




