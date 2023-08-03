import { useEffect, useState } from "react";

const ClietOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null;
  }

  if (mounted) {
    return children;
  }
  return null;
};

export default ClietOnly;
