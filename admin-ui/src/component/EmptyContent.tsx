import React, { ReactNode } from "react";
import withMainMenu from "./withMainMenu";

interface IProps {
  children: ReactNode;
}

function EmptyContent({ children }: IProps): JSX.Element {
  return <>{children}</>;
}

export default withMainMenu(EmptyContent);
