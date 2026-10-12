import { unstable_update } from "@/auth";

export async function POST() {
  const session = (await unstable_update({})) as (Awaited<ReturnType<typeof unstable_update>> & {
    accessToken?: string;
    accessTokenExpires?: number | string;
    user?: unknown;
    error?: string;
  }) | null;

  if (!session?.accessToken || session.error) {
    return Response.json(
      {
        ok: false,
        message: session?.error ?? "Session refresh failed",
      },
      { status: 401 },
    );
  }

  return Response.json(
    {
      ok: true,
      accessToken: session.accessToken,
      accessTokenExpires: session.accessTokenExpires,
      user: session.user,
    },
    { status: 200 },
  );
}
