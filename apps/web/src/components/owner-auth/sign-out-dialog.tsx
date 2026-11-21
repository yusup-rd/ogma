import { notifyAfterNavigation } from "@/lib/notifications/navigation";
import { LuLogOut } from "react-icons/lu";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

interface SignOutDialogProps {
  beforeSignOut?: () => Promise<number | null>;
  sidebar?: boolean;
}

const SignOutDialog = ({
  beforeSignOut,
  sidebar = false,
}: SignOutDialogProps) => {
  return (
    <ConfirmationDialog
      trigger={
        <button
          type="button"
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-semibold whitespace-nowrap text-muted hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-accent active:brightness-90 sm:px-3 ${sidebar ? "md:w-full" : ""}`}
        >
          <LuLogOut aria-hidden="true" className="size-4 shrink-0" />
          Sign out
        </button>
      }
      title="Sign out of Ogma?"
      description="You’ll need to sign in again to access your workspace."
      confirmLabel="Sign out"
      action={async () => {
        if (beforeSignOut && (await beforeSignOut()) === null)
          throw new Error("Save or recover your edits before signing out.");
        const response = await fetch("/api/auth/sign-out", { method: "POST" });
        if (!response.ok) throw new Error("Couldn’t sign out. Try again.");
        notifyAfterNavigation("Signed out.");
        window.location.replace(new URL("/", window.location.origin));
      }}
    />
  );
};

export { SignOutDialog };
