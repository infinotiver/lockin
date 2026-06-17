// components/ui/ErrorHandler.tsx
import { ErrorText } from "./ErrorText";
import { BaseModal } from "./BaseModal";

type ErrorDisplayType = "text" | "modal";

interface ErrorHandlerProps {
  error?: string | null;
  type?: ErrorDisplayType;
  onClear?: () => void;
}

export const ErrorHandler = ({
  error,
  type = "text",
  onClear,
}: ErrorHandlerProps) => {
  if (!error) return null;

  switch (type) {
    case "modal":
      return (
        <BaseModal
          visible={!!error}
          title="An Error Occurred"
          message={error}
          onClose={() => onClear && onClear()}
        />
      );

    case "text":
    default:
      return <ErrorText error={error} />;
  }
};
