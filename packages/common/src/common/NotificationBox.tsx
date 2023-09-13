import React from "react";
import styled from "styled-components";
import { H6 } from "./typography";

type Props = {
  body: JSX.Element;
  heading?: string;
};

const Wrapper = styled.div`
  background-color: var(--color-silver-light);
  border-top: 8px solid var(--color-bus);
  padding: var(--spacing-xs) var(--spacing-s);
  margin-bottom: var(--spacing-m);
`;

const Heading = styled(H6)`
  margin-top: var(--spacing-3-xs);
`;

const Body = styled.p`
  margin: 0;
  font-size: var(--fontsize-body-m);
  line-height: var(--lineheight-l);
`;

const NotificationBox = ({ body, heading }: Props): JSX.Element => {
  return (
    <Wrapper>
      {heading && <Heading>{heading}</Heading>}
      <Body>{body}</Body>
    </Wrapper>
  );
};

export default NotificationBox;
