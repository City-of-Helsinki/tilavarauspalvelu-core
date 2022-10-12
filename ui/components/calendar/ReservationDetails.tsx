import { getDay } from "date-fns";
import { Button, IconCross } from "hds-react";
import React, { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { parseTimeframeLength } from "common/src/calendar/util";
import { fontMedium } from "common/src/common/typography";
import { formatDate } from "../../modules/util";

type EventEvent = {
  event: {
    state: string;
  };
  start: string;
  end: string;
};

type Props = {
  children: ReactNode;
  onClose: () => void;
  label?: string;
  event?: EventEvent;
  authComponent: ReactNode;
};

const wrapperWidth = "250px";
const wrapperHeight = "150px";

const Wrapper = styled.div`
  pointer-events: all;
`;

const Modal = styled.div<{
  $top: number;
  $height: number;
  $left: boolean;
  $day: number;
}>`
  .view-day & {
    top: ${({ $top, $height }) =>
      $top > 60
        ? `calc(${$top + $height}% - ${wrapperHeight})`
        : `${$top + 5}%`};
    left: 10%;
  }

  .view-month & {
    display: none;
  }

  width: ${wrapperWidth};
  height: ${wrapperHeight};
  border: 1px solid var(--color-black-30);
  background-color: var(--color-white);
  z-index: var(--tilavaraus-stack-order-tooltip);
  position: absolute;
  ${({ $top, $height }) =>
    $top > 80
      ? `top: calc(${$top + $height}% - ${wrapperHeight})`
      : `top: ${$top}%`};
  left: ${({ $left }) => ($left ? `calc(${wrapperWidth} * -1)` : "100%")};
  border-radius: 4px;
  padding: var(--spacing-xs);

  @media (max-width: 600px) {
    top: ${({ $top, $height }) =>
      $top > 50 ? "30%" : `calc(${$top + $height}% + ${wrapperHeight})`};
    left: ${({ $day }) =>
      $day === 0
        ? `calc(${wrapperWidth} * -0.7)`
        : `calc(${wrapperWidth} * -0.5)`};
  }
`;

const CloseButton = styled(Button).attrs({
  variant: "supplementary",
  size: "small",
  style: {
    "--color-bus-light": "transparent",
  },
})`
  &&& {
    > span {
      display: none;
    }

    > div {
      margin-right: var(--spacing-2-xs);
    }

    position: absolute;
    top: 0;
    right: 0;

    svg {
      color: var(--color-black);
    }
  }
`;

const Subtitle = styled.div``;

const Content = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  ${fontMedium};
  font-size: var(--fontsize-heading-xs);
  padding: var(--spacing-2-xs) 0;
`;

const ReservationDetails = ({
  children,
  onClose,
  label,
  event,
  authComponent,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  if (event.event.state !== "INITIAL") {
    return <>{children}</>;
  }

  return (
    <Wrapper
      onMouseDown={(e) => {
        if (
          e.target instanceof HTMLElement &&
          (e.target?.className.includes("ReservationDetails") ||
            e.target?.className.includes("login-fragment"))
        ) {
          e.stopPropagation();
        }
      }}
    >
      {React.Children.map(children, (child: ReactElement) => {
        const day = getDay(new Date(event.start));
        const timeframe = parseTimeframeLength(event.start, event.end);
        const { top, height } = child?.props?.style || {};

        return (
          <>
            {child}
            <Modal
              $top={top}
              $height={height}
              $left={day > 4 || day === 0}
              $day={day}
            >
              <CloseButton onClick={onClose} iconRight={<IconCross />}>
                &nbsp;
              </CloseButton>
              <Subtitle>
                {t(`common:weekDay.${day}`)}{" "}
                {formatDate(new Date(event.start).toISOString())}
              </Subtitle>
              <Title>
                {label} ({timeframe})
              </Title>
              <Content>{authComponent}</Content>
            </Modal>
          </>
        );
      })}
    </Wrapper>
  );
};

export default ReservationDetails;
