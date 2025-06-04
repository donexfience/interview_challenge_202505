import { createCookieSessionStorage } from "@remix-run/node";

// Session configuration
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session", // use unique name for better security
    httpOnly: true, // prevents JavaScript access to cookie
    path: "/", // cookie is available for all routes
    sameSite: "lax", // CSRF protection
    secrets: [process.env.SESSION_SECRET || "default-secret-please-change"], // used to sign the cookie
    secure: process.env.NODE_ENV === "production", // only use HTTPS in production
  },
});

// Get the session from the request
export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

// Create a new session
export async function createUserSession(userId: number, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  console.log(
    session,
    "session after setting useridssssssssssssssssssssssssssssssssssssssssssss"
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

// Get the logged-in user's ID from the session
export async function getUserId(request: Request): Promise<number | null> {
  const session = await getSession(request);
  const userId = session.get("userId");
  return userId || null;
}

// Require user to be logged in
export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw new Response(null, {
      status: 302,
      headers: {
        Location: `/login?${searchParams}`,
      },
    });
  }
  return userId;
}

export async function logout(request: Request) {
  const session = await getSession(request);
  console.log(session.data.userId);
  return new Response(null, {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
