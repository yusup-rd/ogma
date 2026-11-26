import { SignOutDialog } from "@/components/owner-auth/sign-out-dialog";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LuFileText, LuLibrary } from "react-icons/lu";

interface WorkspaceShellProps {
  active: "resumes" | "library";
  children: ReactNode;
  beforeSignOut?: () => Promise<number | null>;
}

const pages = [
  { id: "resumes", href: "/", label: "Resumes", Icon: LuFileText },
  { id: "library", href: "/library", label: "Library", Icon: LuLibrary },
] as const;

const WorkspaceShell = ({
  active,
  children,
  beforeSignOut,
}: WorkspaceShellProps) => {
  return (
    <div className="min-h-dvh bg-canvas text-ink md:grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
      <aside className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line bg-paper px-4 py-3 md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:items-stretch md:border-r md:border-b-0 md:px-5 md:py-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold"
        >
          <Image src="/icon.svg" alt="" width={32} height={32} />
          Ogma
        </Link>
        <nav
          aria-label="Workspace"
          className="col-span-2 row-start-2 flex gap-1 border-t border-line pt-2 md:mt-2 md:flex-col md:pt-5"
        >
          {pages.map(({ id, href, label, Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={id === active ? "page" : undefined}
              className={
                "flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold " +
                (id === active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-canvas hover:text-ink")
              }
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="col-start-2 row-start-1 md:mt-auto md:border-t md:border-line md:pt-3">
          <SignOutDialog sidebar beforeSignOut={beforeSignOut} />
        </div>
      </aside>
      <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-7 px-4 py-7 md:gap-8 md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
};

export { WorkspaceShell };
