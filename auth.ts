import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
// import GitHub from "next-auth/providers/github";

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const AUTH_ERROR_CODES = new Set([
    "RefreshAccessTokenError",
    "NoRefreshToken",
    "OAuthFailed",
    "OAuthExchangeError",
    "InvalidTokenPayload",
]);

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: {
                params: { prompt: "login" },
            },
        }),
        // GitHub({
        //   clientId: process.env.AUTH_GITHUB_ID!,
        //   clientSecret: process.env.AUTH_GITHUB_SECRET!,
        // }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user, account, trigger }) {
            /* * FIRST LOGIN*/
            if (account && user) {
                try {
                    const response = await fetch(
                        `${NEXT_PUBLIC_API_BASE_URL}/api/auth/oauth`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-Internal-Auth":
                                    process.env.FASTAPI_AUTH_SECRET!,
                            },
                            body: JSON.stringify({
                                provider: account.provider,
                                provider_user_id: account.providerAccountId,
                                email: user.email,
                                name: user.name,
                                avatar_url: user.image,
                            }),
                        }
                    );
                    if (!response.ok) {
                        // Returning null clears the JWT cookie (no sticky error session).
                        return null;
                    }
                    const parsedResponse = await response.json();
                    const data = parsedResponse.data ?? parsedResponse;
                    if (!data.access_token || !data.refresh_token) {
                        return null;
                    }
                    return {
                        ...token,
                        user: data.user,
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token,
                        accessTokenExpires:
                            Date.now() + 15 * 60 * 1000,
                        error: undefined,
                    };
                } catch (err) {
                    console.error("OAuth Exchange Error:", err);
                    return null;
                }
            }

            // Keep auth refresh failures as explicit session errors so we can
            // retry refresh once and then sign the user out if the refresh token
            // is no longer valid. Drop only unknown legacy errors to avoid
            // infinite sign-out loops from older sessions.
            if (token.error && !AUTH_ERROR_CODES.has(String(token.error))) {
                return null;
            }

            /* * MANUAL SESSION UPDATE*/
            if (trigger === "update") {
                return refreshAccessToken(token);
            }
            /* * ACCESS TOKEN STILL VALID*/
            if (token.accessTokenExpires && Date.now() < Number(token.accessTokenExpires)) {
                return token;
            }
            /* * ACCESS TOKEN EXPIRED*/
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            /*
             * Expose only the access token needed by browser API requests.
             * Never expose the refresh token.
             */
            if (!token || token.error || !token.accessToken) {
                return {
                    ...session,
                    user: undefined as any,
                    accessToken: undefined,
                    error: (token?.error as string | undefined) ?? "SessionInvalid",
                };
            }
            session.user = token.user as typeof session.user;
            (session as any).accessToken = token.accessToken;
            (session as any).accessTokenExpires = token.accessTokenExpires;
            (session as any).error = undefined;

            return session;
        },
        authorized({ auth, request }) {
            const pathname = request.nextUrl.pathname;
            const hasError = Boolean((auth as any)?.error);
            const isAuthenticated = Boolean(auth?.user) && !hasError;
            const isLoginPage = pathname === "/login";
            const isAuthApi = pathname.startsWith("/api/auth");

            if (isAuthApi) return true;

            if (isLoginPage) {
                if (isAuthenticated) {
                    return Response.redirect(new URL("/", request.nextUrl));
                }
                return true;
            }

            if (!isAuthenticated) {
                return Response.redirect(new URL("/login", request.nextUrl));
            }

            return true;
        }

    }
});



async function refreshAccessToken(token: any) {
    try {
        if (!token.refreshToken) {
            console.error("❌ No refresh token available");
            return {
                ...token,
                error: "NoRefreshToken",
            };
        }

        const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Internal-Auth": process.env.FASTAPI_AUTH_SECRET!,
            },
            body: JSON.stringify({
                refresh_token: token.refreshToken,
            }),
        });

        if (!response.ok) {
            return {
                ...token,
                error: "RefreshAccessTokenError",
            };
        }

        const parsedResponse = await response.json();
        // Backend wraps payload in APIResponse { data: AuthResponse }
        const data = parsedResponse.data ?? parsedResponse;

        if (!data?.access_token) {
            return {
                ...token,
                error: "RefreshAccessTokenError",
            };
        }

        return {
            ...token,
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? token.refreshToken,
            accessTokenExpires: Date.now() + 15 * 60 * 1000,
            user: data.user ?? token.user,
            error: undefined,
        };
    } catch (error) {
        console.error("Refresh token error:", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}
