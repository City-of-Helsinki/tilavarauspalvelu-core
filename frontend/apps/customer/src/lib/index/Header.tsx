import React from "react";
import { H1 } from "ui/src/styled";

interface HeadProps {
  heading: string;
  text: string;
}

export function Head(props: HeadProps): React.ReactElement {
  return (
    <div>
      <H1 $large $marginTop="m">
        {props.heading}
      </H1>
      <p>{props.text}</p>
    </div>
  );
}
