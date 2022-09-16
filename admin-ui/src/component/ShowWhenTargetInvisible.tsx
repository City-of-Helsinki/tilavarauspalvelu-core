import React, { ReactNode, RefObject, useEffect, useState } from "react";

type Props = {
  target: RefObject<HTMLElement>;
  children: ReactNode;
};

const ShowWhenTargetInvisible = ({ target, children }: Props): JSX.Element => {
  const [visible, setVisible] = useState(false);

  const onScroll = () => {
    const element = target?.current;
    setVisible(!!(element && element.getBoundingClientRect().bottom < 0));
  };

  useEffect(() => {
    window.removeEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{visible && children}</>;
};

export default ShowWhenTargetInvisible;
