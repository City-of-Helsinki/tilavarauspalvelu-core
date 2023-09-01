import React from "react";
import { toUIDate } from "common/src/common/util";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button } from "hds-react";

type NewReservationListItem = {
  date: Date;
  startTime: string;
  endTime: string;
  error?: string;
  reservationPk?: number;
  buttons?: React.ReactNode;
  isRemoved?: boolean;
  isOverlapping?: boolean;
  buffers?: {
    before?: number;
    after?: number;
  };
};

type Props = {
  header?: React.ReactNode;
  items: NewReservationListItem[];
  hasPadding?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

// In the UI spec parent container max height is 22rem, but overflow forces us to define child max-height
const ListWrapper = styled.div`
  max-height: 18.5rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

const StyledList = styled.ul<{ $hasPadding: boolean }>`
  list-style-type: none;
  border: none;
  padding: ${({ $hasPadding }) => ($hasPadding ? "0 var(--spacing-s)" : "0")};
`;

const StyledListItem = styled.li`
  border-bottom: 1px solid var(--color-black-20);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 2rem;
  white-space: nowrap;
`;

const TextWrapper = styled.div<{ $failed: boolean }>`
  display: flex;
  padding: var(--spacing-xs) 0;
  flex-grow: 1;
  gap: 0.5rem 2rem;
  ${({ $failed }) => ($failed ? "color: var(--color-black-60)" : "")};
`;

// min-width because some dates have less characters and font-width varries
// magic number 19 works for longer dates while not adding too much white-space on mobile
const DateElement = styled.div<{ $isRemoved: boolean }>`
  min-width: 19ch;
  text-transform: capitalize;
  ${({ $isRemoved }) => ($isRemoved ? "color: var(--color-black-50)" : "")};
`;

const ErrorLabel = styled.div<{ $isError: boolean }>`
  & > span {
    color: var(--color-black);
    background: ${({ $isError }) =>
      $isError ? "var(--color-metro-medium-light)" : "var(--color-black-10)"};
    padding: 0.5rem;
  }
`;

const CenterContent = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem 0;
`;

const stripTimeZeros = (time: string) =>
  time.substring(0, 1) === "0" ? time.substring(1) : time;

const getStatus = (x: NewReservationListItem) => {
  if (x.isOverlapping) {
    return {
      isError: true,
      msg: "overlapping",
    };
  }
  if (x.isRemoved) {
    return {
      isError: false,
      msg: "removed",
    };
  }
  if (x.error) {
    // TODO the error handling is really messy and it's impossible to get codes rather than the error message string
    // also the i18n map is built stupidly so we can't use strings with spaces as keys
    const intervalErrorMsg =
      /ApolloError: Reservation start time does not match the allowed interval/;
    const overlapErrorMsg = /Overlapping reservations are not allowed/;
    const reservationInPastErrorMsg =
      /ApolloError: Reservation new begin cannot be in the past/;
    let errorCode = "default";
    if (x.error.match(intervalErrorMsg)) {
      errorCode = "interval";
    } else if (x.error.match(overlapErrorMsg)) {
      errorCode = "overlap";
    } else if (x.error.match(reservationInPastErrorMsg)) {
      errorCode = "reservationInPast";
    }

    return {
      isError: true,
      msg: `failureMessages.${errorCode}`,
    };
  }
  return undefined;
};

const StatusElement = ({ item }: { item: NewReservationListItem }) => {
  const { t } = useTranslation("translation", {
    keyPrefix: "MyUnits.RecurringReservation.Confirmation",
  });

  const status = getStatus(item);
  if (!status) {
    return null;
  }

  const { isError, msg } = status;

  return (
    <ErrorLabel $isError={isError}>
      <span>{t(msg)}</span>
    </ErrorLabel>
  );
};

const ReservationList = ({
  header,
  items,
  hasPadding,
  onLoadMore,
  hasMore,
}: Props) => {
  const { t } = useTranslation();

  if (!items.length) return null;

  return (
    <ListWrapper data-testid="reservations-list">
      {header}
      <StyledList $hasPadding={hasPadding ?? false}>
        {items.map((item) => (
          <StyledListItem
            key={`${item.date}-${item.startTime}-${item.endTime}`}
          >
            <TextWrapper $failed={!!item.error}>
              <DateElement
                $isRemoved={(item.isRemoved || item.isOverlapping) ?? false}
              >
                {`${toUIDate(item.date, "cccccc d.M.yyyy")}, ${stripTimeZeros(
                  item.startTime
                )}-${stripTimeZeros(item.endTime)}`}
              </DateElement>
              <StatusElement item={item} />
            </TextWrapper>
            <div>{item.buttons}</div>
          </StyledListItem>
        ))}
        {hasMore && onLoadMore && (
          <CenterContent>
            <Button
              variant="secondary"
              size="small"
              type="button"
              onClick={onLoadMore}
            >
              {t("common.showMore")}
            </Button>
          </CenterContent>
        )}
      </StyledList>
    </ListWrapper>
  );
};

export default ReservationList;
export type { NewReservationListItem };
