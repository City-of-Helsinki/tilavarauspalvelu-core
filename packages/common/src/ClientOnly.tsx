import React, { useEffect, useState } from "react";

function ClientOnly({ children }: { children: React.ReactNode }): JSX.Element | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment -- return type issues
  return <>{children}</>;
}

export default ClientOnly;
