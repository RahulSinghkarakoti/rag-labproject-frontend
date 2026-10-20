import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { ThemeAccentSelector } from "@/components/theme-accent-selector";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.78-2.11-6.72-4.95H1.27v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.27 6.61l4.01 3.09C6.22 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method. Use the provider you signed up with.",
  AccessDenied: "Access denied. You don't have permission to sign in.",
  Configuration: "Auth is misconfigured. Check your environment variables.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl = "/", error } = await searchParams;

  const session = await auth();
  const isAuthenticated =
    Boolean(session?.user) && !(session as { error?: string } | null)?.error;
  if (isAuthenticated) redirect(callbackUrl);

  async function loginWith(provider: "google" | "github") {
    "use server";
    await signIn(provider, { redirectTo: callbackUrl });
  }

  const buttonClass =
    "flex w-full items-center justify-center gap-3 cyber-chamfer-sm border border-accent bg-transparent px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-accent transition-none hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <main className="flex min-h-full items-center justify-center bg-[#0a0a0f] p-4 text-[#e0e0e0]">
      <div className="w-full max-w-md cyber-chamfer border border-[#2a2a3a] bg-[#12121a] p-8 shadow-2xl font-mono">
        <div className="mb-6 border-b border-[#2a2a3a] pb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block size-2 bg-accent animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                SYS.AUTH // TERMINAL_V4
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">
              SYSTEM ACCESS
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              &gt; Authenticate credentials to access RAG Lab node
            </p>
          </div>
          {/* <ThemeAccentSelector /> */}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 cyber-chamfer-sm border border-destructive bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive"
          >
            [ERROR]: {errorMessages[error] ?? "Authentication failed. Retry sequence."}
          </div>
        )}

        <div className="space-y-4">
          <form action={loginWith.bind(null, "google")}>
            <button type="submit" className={buttonClass}>
              <GoogleIcon />
              AUTHENTICATE VIA GOOGLE
            </button>
          </form>
        </div>

        <div className="mt-8 border-t border-[#2a2a3a] pt-4 text-center text-[10px] text-muted-foreground uppercase tracking-wider">
          &gt; SECURE PROTOCOL ENFORCED  
        </div>
      </div>
    </main>
  );
}