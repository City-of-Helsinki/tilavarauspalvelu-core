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
  grid-template-columns: 1fr 4fr;
`;

const IconWithText = ({
  icon,
  text = '',
  texts = [],
  className,
}: IconWithTextProps): JSX.Element => (
  <Container className={className}>
    {text && (
      <div className="align-vertically">
        {icon}
        <span className="margin-left-s">{text}</span>
      </div>
    )}
    {texts.length > 0 && (
      <div style={{}}>
        {texts.map(([day, time], index) => {
          return (
            <React.Fragment key={`${day}${time}`}>
              {index === 0 ? icon : <div />}
              <div>{day}</div>
              <div>{time}</div>
            </React.Fragment>
          );
        })}
      </div>
    )}
  </Container>
);

export default IconWithText;
