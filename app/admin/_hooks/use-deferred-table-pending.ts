"use client";

import { useEffect, useRef, useState } from "react";

type UseDeferredTablePendingOptions = {
  delayMs?: number;
};

export function useDeferredTablePending(
  options: UseDeferredTablePendingOptions = {},
) {
  const delayMs = options.delayMs ?? 160;
  const timerRef = useRef<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  function runDeferred(update: () => void) {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    setIsPending(true);
    timerRef.current = window.setTimeout(() => {
      update();
      setIsPending(false);
      timerRef.current = null;
    }, delayMs);
  }

  return {
    isPending,
    runDeferred,
  };
}
