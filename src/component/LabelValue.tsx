import React from 'react';
import styled from 'styled-components';

const LabelElement = styled.div`
  margin-top: var(--spacing-3-xs);
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-l);
  font-weight: bold;
`;
const ValueElement = styled.div`
  margin-top: var(--spacing-2-xs);
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-m);
`;

const LabelValue = ({
  label,
  value,
  className,
}: {
  label: string;
  value: string | undefined | null | number | JSX.Element[];
  className?: string;
}): JSX.Element | null => (
  <div className={className}>
    <LabelElement>{label}</LabelElement>
    <ValueElement>{value}</ValueElement>
  </div>
);

export default LabelValue;
