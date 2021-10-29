import React, { ReactNode, useEffect, useState } from "react";

interface IProps {
  children: ReactNode;
}

const ClientOnly = ({ children, ...rest }: IProps): JSX.Element | null => {
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return <div {...rest}>{children}</div>;
};

export default ClientOnly;
