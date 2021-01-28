import React from "react";
import withMainMenu from "../../withMainMenu";

interface IProps {
  content?: string;
}

function IndividualApplicationList(props: IProps): JSX.Element {
  return (
    <div>
      <span>{props.content || "foo"}</span>
    </div>
  );
}

export default withMainMenu(IndividualApplicationList);
