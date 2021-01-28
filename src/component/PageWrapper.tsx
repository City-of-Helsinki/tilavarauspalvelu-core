import React from "react";
import Navigation from "./Navigation";

interface IProps {
  children: React.ReactNode;
}

export default function PageWrapper(props: IProps): JSX.Element {
  return (
    <>
      <Navigation />
      {props.children}
    </>
  );
}
