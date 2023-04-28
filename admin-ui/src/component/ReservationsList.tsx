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

const TextWrapper = styled.span<{ $failed: boolean }>`
  padding: var(--spacing-xs) 0;
  flex-grow: 1;
  gap: 0.5rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  ${({ $failed }) => ($failed ? "color: var(--color-black-60)" : "")};
`;

const DateElement = styled.div<{ $isRemoved: boolean }>`
  text-transform: capitalize;
  ${({ $isRemoved }) => ($isRemoved ? "color: var(--color-black-50)" : "")};
`;

const ErrorLabel = styled.div`
  & > span {
    color: var(--color-black);
    background: var(--color-metro-medium-light);
    padding: 0.5rem 0.5rem;
  }
`;

const CenterContent = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem 0;
`;

const stripTimeZeros = (time: string) =>
  time.substring(0, 1) === "0" ? time.substring(1) : time;

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
    <ListWrapper>
      {header}
      <StyledList $hasPadding={hasPadding ?? false}>
        {items.map((item) => (
          <StyledListItem
            key={`${item.date}-${item.startTime}-${item.endTime}`}
          >
            <TextWrapper $failed={!!item.error}>
              <DateElement $isRemoved={item.isRemoved ?? false}>
                {`${toUIDate(item.date, "cccccc d.M.yyyy")}, ${stripTimeZeros(
                  item.startTime
                )}-${stripTimeZeros(item.endTime)}`}
              </DateElement>
              {item.isRemoved && (
                <ErrorLabel>
                  <span>
                    {t("MyUnits.RecurringReservation.Confirmation.removed")}
                  </span>
                </ErrorLabel>
              )}
              {item.error && (
                <ErrorLabel>
                  <span>
                    {t(
                      `MyUnits.RecurringReservation.Confirmation.failureMessages.${item.error}`
                    )}
                  </span>
                </ErrorLabel>
              )}
            </TextWrapper>
            {item.buttons}
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
