import React, { useEffect, useState } from "react";

export function ClientOnly({ children }: { children: React.ReactNode }): React.ReactNode {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- hydration bypass
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return children;
}
