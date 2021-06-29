import React from "react";
import { Card as HDSCard, CardProps } from "hds-react";

const Card = ({ ...rest }: CardProps): JSX.Element => {
  return <HDSCard {...rest} />;
};

export default Card;
