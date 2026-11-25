import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { ClearSessionQueries } from "@/components/query-provider";
import { InlineAlert } from "@/components/ui/inline-alert";

interface OwnerSignInProps {
  available: boolean;
  error?: string;
}

const OwnerSignIn = ({ available, error }: OwnerSignInProps) => {
  return (
    <main className="grid min-h-dvh content-center bg-canvas px-4 pt-6 pb-24 text-ink">
      <ClearSessionQueries />
      <section
        aria-labelledby="sign-in-heading"
        className="mx-auto flex w-full max-w-sm flex-col items-start rounded-2xl border border-line bg-paper p-5 pb-12"
      >
        <Image src="/icon.svg" alt="" width={40} height={40} />
        <h1
          id="sign-in-heading"
          className="mt-5 text-2xl font-semibold tracking-tight"
        >
          Sign in to Ogma
        </h1>
        <p className="mt-3 text-sm text-muted">
          Access your private resume workspace.
        </p>
        {error && <InlineAlert className="mt-4">{error}</InlineAlert>}
        {available && (
          <form action="/api/auth/sign-in" method="post" className="mt-9">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2.5 rounded-lg border border-[#747775] bg-white px-3 text-sm font-medium text-[#1f1f1f] hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-neutral-100"
            >
              <FcGoogle aria-hidden="true" className="size-5 shrink-0" />
              Sign in with Google
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export { OwnerSignIn };
