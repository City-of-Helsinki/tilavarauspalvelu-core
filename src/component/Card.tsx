import React from 'react';
import { Card as HDSCard, CardProps } from 'hds-react';

const tilavarausCardStyles = {
  // '--padding-horizontal': '0',
} as React.CSSProperties;

const Card = ({ ...rest }: CardProps): JSX.Element => {
  return <HDSCard {...rest} style={tilavarausCardStyles} />;
};

export default Card;
