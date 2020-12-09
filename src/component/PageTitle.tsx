import React from 'react';

interface Props {
  children: React.ReactNode;
}

const style = {
  'font-size': '$fontsize-heading-l',
} as React.CSSProperties;

export const PageTitle = ({ children }: Props): JSX.Element => {
  return <h1 style={style}>{children}</h1>;
};

export const PageSubTitle = ({ children }: Props): JSX.Element => {
  return <h2 style={style}>{children}</h2>;
};
