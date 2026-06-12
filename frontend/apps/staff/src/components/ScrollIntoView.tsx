import React, { useEffect, useRef } from "react";

interface Props {
  hash: string;
  children: React.ReactElement;
}

export function ScrollIntoView({ hash, children }: Props): React.ReactElement {
  const selfRef = useRef<HTMLDivElement | null>(null);

  const isMatch = hash === document.location.hash?.slice(1);

  useEffect(() => {
    if (isMatch && selfRef.current?.scrollIntoView) {
      selfRef.current?.scrollIntoView(true);
    }
  }, [isMatch]);

  return isMatch ? (
    <>
      <div ref={selfRef} />
      {children}
    </>
  ) : (
    children
  );
}
