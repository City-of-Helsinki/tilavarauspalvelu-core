import type { ReactNode, RefObject } from "react";
import React, { useEffect, useState } from "react";

type Props = {
  target: RefObject<HTMLElement>;
  children: ReactNode;
};

export function ShowWhenTargetInvisible({ target, children }: Props): JSX.Element {
  const [visible, setVisible] = useState(false);

  const onScroll = () => {
    const element = target?.current;
    setVisible(!!(element && element.getBoundingClientRect().bottom < 0));
  };

  useEffect(() => {
    // oxlint-disable react/exhaustive-deps -- only on page load
    window.removeEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
    // oxlint-enable react/exhaustive-deps -- only on page load
  }, []);

  if (!visible) return <> </>;

  return <> {children} </>;
}
