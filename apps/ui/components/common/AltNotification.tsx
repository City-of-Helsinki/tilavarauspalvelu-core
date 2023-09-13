import React from "react";
import styled from "styled-components";

export type NotificationType = "alert";

type Props = {
  text: string;
  type: NotificationType;
};

const Wrapper = styled.div<{ $type: NotificationType }>`
  background-color: ${({ $type }) =>
    $type === "alert" ? "var(--color-engel-light)" : "transparent"};
  font-size: var(--fontsize-body-l);
  padding: var(--spacing-s);
  display: inline-block;
`;

const AltNotification = ({ text, type, ...rest }: Props): JSX.Element => {
  return (
    <Wrapper $type={type} {...rest}>
      {text}
    </Wrapper>
  );
};

export default AltNotification;
