import React, { useEffect, useRef } from "react";

interface Props {
  hash: string;
  children: JSX.Element;
}

export function ScrollIntoView({ hash, children }: Props): JSX.Element {
  const selfRef = useRef<HTMLDivElement | null>(null);

  const isMatch = hash === document.location.hash?.substring(1);

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
