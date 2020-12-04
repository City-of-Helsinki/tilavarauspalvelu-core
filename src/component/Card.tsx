import React from 'react';
import { Card as HDSCard, CardProps } from 'hds-react';

const tilavarausCardStyles = {
  '--padding-horizontal': '0',
  '--fontsize-heading-m': 'var(--fontsize-heading-l)',
  '--fontsize-body-m': 'var(--fontsize-body-xl)',
} as React.CSSProperties;

const Card = ({ ...rest }: CardProps): JSX.Element => {
  return <HDSCard {...rest} style={tilavarausCardStyles} />;
};

export default Card;
