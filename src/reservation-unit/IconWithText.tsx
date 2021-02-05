import React from 'react';
import styled from 'styled-components';

type IconWithTextProps = {
  icon: React.ReactElement;
  text?: string;
  texts?: string[][];
  className?: string;
};

const Container = styled.div`
  display: grid;
  grid-auto-rows: 1fr;
  align-items: center;
  grid-template-columns: 1fr 1fr 4fr;
  margin-top: var(--spacing-m);
`;

const SpanTwoColumns = styled.span`
  grid-column-start: 2;
  grid-column-end: 4;
`;

const IconWithText = ({
  icon,
  text = '',
  texts = [],
  className,
}: IconWithTextProps): JSX.Element => (
  <Container className={className}>
    {text && (
      <>
        {icon}
        <SpanTwoColumns>{text}</SpanTwoColumns>
      </>
    )}
    {texts.length > 0 && (
      <>
        {texts.map(([day, time], index) => {
          return (
            <React.Fragment key={`${day}${time}`}>
              {index === 0 ? icon : <div />}
              <div>{day}</div>
              <div>{time}</div>
            </React.Fragment>
          );
        })}
      </>
    )}
  </Container>
);

export default IconWithText;
