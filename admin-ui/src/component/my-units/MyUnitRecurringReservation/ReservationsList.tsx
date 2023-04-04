import React from "react";
import { toUIDate } from "common/src/common/util";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, IconArrowUndo, IconCrossCircle } from "hds-react";

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
};

type Props = {
  items: NewReservationListItem[];
};

// In the UI spec parent container max height is 22rem, but overflow forces us to define child max-height
const ListWrapper = styled.div`
  max-height: 18.5rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

const StyledList = styled.ul`
  list-style-type: none;
  border: none;
  padding: 0 var(--spacing-s);
`;

const StyledListItem = styled.li`
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-black-20);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 2rem;
  white-space: nowrap;
`;

const TextWrapper = styled.span<{ $failed: boolean }>`
  flex-grow: 1;
  gap: 0.5rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  ${({ $failed }) => ($failed ? "color: var(--color-black-60)" : "")};
`;

const Capitalize = styled.span`
  text-transform: capitalize;
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

const ReservationList = ({ items }: Props) => {
  const { t } = useTranslation();

  if (!items.length) return null;

  return (
    <ListWrapper>
      <StyledList>
        {items.map((item) => (
          <StyledListItem
            key={`${item.date}-${item.startTime}-${item.endTime}`}
          >
            <TextWrapper $failed={!!item.error}>
              <Capitalize>
                {`${toUIDate(item.date, "cccccc d.M.yyyy")}, ${stripTimeZeros(
                  item.startTime
                )}-${stripTimeZeros(item.endTime)}`}
              </Capitalize>
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
                  iconRight={<IconCrossCircle />}
                  size="small"
                >
                  {t("common.remove")}
                </Button>
              ) : (
                <Button
                  variant="supplementary"
                  onClick={item.button.callback}
                  iconRight={<IconArrowUndo />}
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
