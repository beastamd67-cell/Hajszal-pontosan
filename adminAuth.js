import crypto from "crypto";

export const ADMIN_COOKIE = "admin_session";

export function makeSessionToken() {
  const secret = process.env.ADMIN_PASSWORD || "change-me";
  return crypto.createHmac("sha256", secret).update("hajszal-pontosan-admin").digest("hex");
}

export function isAdminRequest(request) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return token === makeSessionToken();
}
