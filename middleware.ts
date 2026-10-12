// middleware.ts
import { auth } from "./auth";

export default auth;

export const config = {
  // EXPLICITLY EXCLUDE /api/auth along with static assets and images
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};