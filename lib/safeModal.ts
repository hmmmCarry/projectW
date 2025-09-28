import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";

const OPEN_DELAY_MS = 60;

function usePersistentTimeout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  return {
    set(fn: () => void, delay = OPEN_DELAY_MS) {
      clear();
      timeoutRef.current = setTimeout(fn, delay);
    },
    clear,
  } as const;
}

export function useSafeModal(initialVisible = false, delayMs = OPEN_DELAY_MS) {
  const [visible, setVisible] = useState(initialVisible);
  const timeout = usePersistentTimeout();

  const close = useCallback(() => {
    timeout.clear();
    setVisible(false);
  }, [timeout]);

  const open = useCallback(() => {
    // Ensure any other UI finishes before showing the modal again.
    close();
    InteractionManager.runAfterInteractions(() => {
      timeout.set(() => setVisible(true), delayMs);
    });
  }, [close, delayMs, timeout]);

  return { visible, open, close } as const;
}
