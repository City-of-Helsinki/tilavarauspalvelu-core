import React, { ReactElement, ReactNode } from "react";
import styled from "styled-components";
import { OpeningHourRow } from "../../modules/openingHours";

type IconWithTextProps = {
  icon: ReactElement;
  text?: string | ReactElement | ReactNode;
  texts?: OpeningHourRow[];
  className?: string;
};

const Container = styled.div`
  display: grid;
  grid-auto-rows: 1fr;
  align-items: center;
  grid-template-columns: 1.5em 1fr 4fr;
  margin-top: var(--spacing-s);
`;

const SpanTwoColumns = styled.span`
  margin-left: var(--spacing-s);
  grid-column-start: 2;
  grid-column-end: 4;
`;

const InnerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: auto;
  margin-left: var(--spacing-s);
`;

const MultilineWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
`;

const IconWithText = ({
  icon,
  text = "",
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
        {icon}
        <InnerGrid>
          {texts.map(({ label, value, index }) => {
            return (
              <MultilineWrapper key={`${index}${label}${value}`}>
                <div>
                  {index > 0 && texts[index - 1].label === label ? "" : label}
                </div>
                <div>{value}</div>
              </MultilineWrapper>
            );
          })}
        </InnerGrid>
      </>
    )}
  </Container>
);

export default IconWithText;
