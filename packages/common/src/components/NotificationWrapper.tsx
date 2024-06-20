import React from "react";
import styled from "styled-components";
import { Notification, NotificationProps } from "hds-react";
import { breakpoints } from "../common/style";

type NotificationPropsWithCentering = NotificationProps & {
  centered?: boolean;
  "data-testid"?: string;
};

const Wrapper = styled.div<{ $centerContent?: boolean }>`
  > section > div {
    max-width: calc(${breakpoints.xl} - (2 * var(--spacing-m)));
    margin: 0 ${(props) => (props.$centerContent ? "auto" : "0")} !important;
  }
`;

function NotificationWrapper(
  props: NotificationPropsWithCentering
): JSX.Element | null {
  const [isVisible, setIsVisible] = React.useState(true);

  // data-testid passed to the HDS component is not passed to the DOM
  // pass it to the div wrapper instead
  const testId = props["data-testid"];
  if (!isVisible) {
    return null;
  }
  return (
    <Wrapper $centerContent={props.centered} data-testid={testId}>
      <Notification
        {...props}
        onClose={() => {
          setIsVisible(false);
          props.onClose?.();
        }}
      />
    </Wrapper>
  );
}

export default NotificationWrapper;
