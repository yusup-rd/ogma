import { ConfirmationDialog } from "@/components/confirmation-dialog";

interface SignOutDialogProps {
  beforeSignOut?: () => Promise<number | null>;
}

const SignOutDialog = ({ beforeSignOut }: SignOutDialogProps) => {
  return (
    <ConfirmationDialog
      trigger={
        <button
          type="button"
          className="min-h-11 rounded-md px-2 text-xs font-semibold whitespace-nowrap text-muted hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-accent active:brightness-90 sm:px-3"
        >
          Sign out
        </button>
      }
      title="Sign out of Ogma?"
      description="You’ll need to sign in again to access your workspace."
      confirmLabel="Sign out"
      action={
        beforeSignOut
          ? async () => {
              if ((await beforeSignOut()) === null)
                throw new Error(
                  "Save or recover your edits before signing out.",
                );
              const response = await fetch("/api/auth/sign-out", {
                method: "POST",
              });
              if (!response.ok)
                throw new Error("Couldn’t sign out. Try again.");
              window.location.replace(new URL("/", window.location.origin));
            }
          : "/api/auth/sign-out"
      }
    />
  );
};

export { SignOutDialog };
