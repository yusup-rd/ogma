import { ActionButton } from "@/components/ui/action-button";
import { InlineAlert } from "@/components/ui/inline-alert";

interface RetryNoticeProps {
  message: string;
  actionLabel: string;
  disabled?: boolean;
  onRetry: () => void;
}

const RetryNotice = ({
  message,
  actionLabel,
  disabled = false,
  onRetry,
}: RetryNoticeProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper p-3">
      <InlineAlert>{message}</InlineAlert>
      <ActionButton type="button" disabled={disabled} onClick={onRetry}>
        {actionLabel}
      </ActionButton>
    </div>
  );
};

export { RetryNotice };
