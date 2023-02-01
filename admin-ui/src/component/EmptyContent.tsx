import React, { ReactNode } from "react";
import withMainMenu from "./withMainMenu";

interface IProps {
  children: ReactNode | React.ReactElement;
}

function EmptyContent({ children }: IProps): JSX.Element {
  return <div>{children}</div>;
}

export default withMainMenu(EmptyContent);
