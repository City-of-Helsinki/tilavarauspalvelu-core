import React from "react";
import { toUIDate } from "common/src/common/util";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, IconArrowUndo, IconCross } from "hds-react";

type CallbackButton = {
  callback: () => void;
  type: "remove" | "restore";
};
type NewReservationListItem = {
  date: Date;
  startTime: string;
  endTime: string;
  error?: string;
  reservationPk?: number;
  button?: CallbackButton;
  isRemoved?: boolean;
};

type Props = {
  items: NewReservationListItem[];
  hasPadding?: boolean;
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

const stripTimeZeros = (time: string) =>
  time.substring(0, 1) === "0" ? time.substring(1) : time;

const ReservationList = ({ items, hasPadding }: Props) => {
  const { t } = useTranslation();

  if (!items.length) return null;

  return (
    <ListWrapper>
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
            {item.button != null &&
              (item.button.type === "remove" ? (
                <Button
                  variant="supplementary"
                  onClick={item.button.callback}
                  iconLeft={<IconCross />}
                  size="small"
                >
                  {t("common.remove")}
                </Button>
              ) : (
                <Button
                  variant="supplementary"
                  onClick={item.button.callback}
                  iconLeft={<IconArrowUndo />}
                  size="small"
                >
                  {t("common.restore")}
                </Button>
              ))}
          </StyledListItem>
        ))}
      </StyledList>
    </ListWrapper>
  );
};

export default ReservationList;
export type { NewReservationListItem };
