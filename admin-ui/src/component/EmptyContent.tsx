import React, { ReactNode } from "react";

interface IProps {
  children: ReactNode | React.ReactElement;
}

function EmptyContent({ children }: IProps): JSX.Element {
  return <div>{children}</div>;
}

export default EmptyContent;
