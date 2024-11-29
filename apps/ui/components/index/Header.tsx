import React from "react";
import { H1 } from "common/src/common/typography";

interface HeadProps {
  heading: string;
  text: string;
}

export function Head(props: HeadProps): JSX.Element {
  return (
    <div>
      <H1 $large $marginBottom="none" $marginTop="m">
        {props.heading}
      </H1>
      <p>{props.text}</p>
    </div>
  );
}
