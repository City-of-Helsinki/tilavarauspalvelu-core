import React from "react";
import styled from "styled-components";
import { Notification, NotificationProps } from "hds-react";
import { breakpoints } from "../common/style";

type NotificationPropsWithCentering = NotificationProps & {
  centered?: boolean;
};

const Wrapper = styled.div<{ $centerContent?: boolean }>`
  > section > div {
    max-width: calc(${breakpoints.xl} - (2 * var(--spacing-m)));
    margin: 0 ${(props) => (props.$centerContent ? "auto" : "0")} !important;
  }
`;

const NotificationWrapper = (
  props: NotificationPropsWithCentering
): JSX.Element | null => {
  const [isVisible, setIsVisible] = React.useState(true);

  return isVisible ? (
    <Wrapper $centerContent={props.centered}>
      <Notification
        {...props}
        onClose={() => {
          setIsVisible(false);
          if (props.onClose) props.onClose();
        }}
      />
    </Wrapper>
  ) : null;
};

export default NotificationWrapper;
