import { useState, useCallback } from "react";
import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard"; // Adjust based on your clipboard package

export interface UseShareOrCopyOptions {
  timeoutDuration?: number;
  onCopyTimeout?: () => void;
  onError?: (error: unknown) => void;
}

export const useShareOrCopy = (options: UseShareOrCopyOptions = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const timeoutDuration = options.timeoutDuration || 2000;

  // Specify textToShare as a string
  const shareOrCopy = useCallback(
    async (textToShare: string) => {
      if (!textToShare) return;

      try {
        if (Platform.OS !== "web") {
          await Share.share({ message: textToShare });
        } else if (navigator?.share) {
          await navigator.share({ text: textToShare });
        } else {
          await Clipboard.setStringAsync(textToShare);
          setIsCopied(true);

          setTimeout(() => {
            setIsCopied(false);
            if (options.onCopyTimeout) options.onCopyTimeout();
          }, timeoutDuration);
        }
      } catch (error) {
        if (options.onError) options.onError(error);
      }
    },
    [timeoutDuration, options],
  );

  return { shareOrCopy, isCopied };
};
