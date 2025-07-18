import React from "react";
import { toUIDate } from "common/src/common/util";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { startOfDay } from "date-fns";
import { RejectionReadinessChoice, type ReservationToCopyFragment, UserPermissionChoice } from "@gql/gql-types";
import { Button, ButtonSize, ButtonVariant, IconCross } from "hds-react";
import { useCheckPermission } from "@/hooks";
import { NewReservationModal } from "@/component/EditTimeModal";
import { useModal } from "@/context/ModalContext";
import { H6 } from "common/styled";
import StatusLabel from "common/src/components/StatusLabel";
import { gql } from "@apollo/client";

export type NewReservationListItem = {
  date: Date;
  startTime: string;
  endTime: string;
  reason?: RejectionReadinessChoice;
  error?: string;
  reservationPk?: number;
  buttons?: React.ReactNode;
  isRemoved?: boolean;
  isCancelled?: boolean;
  isOverlapping?: boolean;
  buffers?: {
    before?: number;
    after?: number;
  };
};

// In the UI spec parent container max height is 22rem, but overflow forces us to define child max-height
// TODO can't be unlimited, because we might have a lot of reservations (like 200 - 400)
const ListWrapper = styled.div<{ $isTall?: boolean }>`
  max-height: ${({ $isTall }) => ($isTall ? "48rem" : "18.5rem")};
  overflow: hidden auto;
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

const ErrorLabel = styled(StatusLabel)`
  margin-inline: -8px;
`;

const stripTimeZeros = (time: string) => (time.startsWith("0") ? time.substring(1) : time);

// TODO this function should be refactored
// all the messages and label types should be enum -> object mapping (or similar)
// and they should be stored in a single field in the ListItem object
function getStatus(x: NewReservationListItem) {
  if (x.isOverlapping) {
    return {
      isError: true,
      msg: "overlapping",
      icon: <IconCross />,
    };
  }
  if (x.reason) {
    return {
      isError: true,
      msg: `RejectionReadinessChoice.${x.reason}`,
      icon: <IconCross />,
    };
  }
  if (x.isRemoved) {
    return {
      isError: true,
      msg: "removed",
      icon: <IconCross />,
    };
  }
  if (x.isCancelled) {
    return {
      isError: false,
      msg: "cancelled",
      icon: <IconCross />,
    };
  }
  if (x.error) {
    // TODO the error handling is really messy and it's impossible to get codes rather than the error message string
    // also the i18n map is built stupidly so we can't use strings with spaces as keys
    const intervalErrorMsg = /ApolloError: Reservation start time does not match the allowed interval/;
    const overlapErrorMsg = /Overlapping reservations are not allowed/;
    const reservationInPastErrorMsg = /ApolloError: Reservation new begin cannot be in the past/;
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
      icon: <IconCross />,
    };
  }
  return undefined;
}

function StatusElement({ item }: { item: NewReservationListItem }) {
  const { t } = useTranslation("translation", {
    keyPrefix: "MyUnits.ReservationSeries.Confirmation",
  });

  const status = getStatus(item);
  if (!status) {
    return null;
  }

  const { isError, msg, icon } = status;

  return (
    <ErrorLabel icon={icon} type={isError ? "error" : "neutral"} slim>
      {t(msg)}
    </ErrorLabel>
  );
}

type AddNewReservationButtonProps = {
  reservationToCopy: ReservationToCopyFragment;
  refetch: () => void;
};

function AddNewReservationButton({ reservationToCopy, refetch }: AddNewReservationButtonProps) {
  const unitPk = reservationToCopy?.reservationUnit?.unit?.pk;
  const { hasPermission } = useCheckPermission({
    units: unitPk ? [unitPk] : [],
    permission: UserPermissionChoice.CanManageReservations,
  });
  const { t } = useTranslation();

  const { setModalContent } = useModal();

  const handleClose = () => {
    setModalContent(null);
  };

  const handleAccept = () => {
    handleClose();
    refetch();
  };

  const handleClick = () => {
    if (reservationToCopy == null) {
      return;
    }
    setModalContent(
      <NewReservationModal onAccept={handleAccept} onClose={handleClose} reservationToCopy={reservationToCopy} />
    );
  };

  return (
    <Button size={ButtonSize.Small} variant={ButtonVariant.Secondary} disabled={!hasPermission} onClick={handleClick}>
      {t("MyUnits.ReservationSeries.addNewReservation")}
    </Button>
  );
}

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  place-content: center space-between;
`;

type Props = {
  header?: string;
  items: NewReservationListItem[];
  hasPadding?: boolean;
  isTall?: boolean;
};
type ExtendedProps = AddNewReservationButtonProps & Props;

/// Used by the ReservationSeries pages to show a list of reservations
// TODO should be renamed / moved to signify that this is only for recurring reservations
export function ReservationList(props: Props | ExtendedProps) {
  const { header, items, hasPadding, isTall } = props;
  if (items.length === 0) {
    return null;
  }

  const hasReservation = "reservationToCopy" in props && !!props.reservationToCopy;

  // NOTE this doesn't properly handle other reservation states than removed
  // should drill the actual state in the props (not just the removed flag)
  const hasReservationsInFuture = items.some((item) => !item.isRemoved && item.date >= startOfDay(new Date()));
  const showNewReservationButton = hasReservation && hasReservationsInFuture;

  const removed = items.filter((x) => x.isRemoved).length;
  const count = items.length - removed;
  return (
    <ListWrapper data-testid="reservations-list" $isTall={isTall}>
      <TitleWrapper>
        {header != null && (
          <H6 as="h3" style={{ flexGrow: 1 }}>
            {header} {`(${count})`}
          </H6>
        )}
        {showNewReservationButton && (
          <div>
            <AddNewReservationButton reservationToCopy={props.reservationToCopy} refetch={props.refetch} />
          </div>
        )}
      </TitleWrapper>
      <StyledList $hasPadding={hasPadding ?? false}>
        {items.map((item) => (
          <StyledListItem key={`${item.date}-${item.startTime}-${item.endTime}`}>
            <TextWrapper $failed={!!item.error}>
              <DateElement $isRemoved={(item.isRemoved || item.isOverlapping || item.isCancelled) ?? false}>
                {`${toUIDate(item.date, "cccccc d.M.yyyy")}, ${stripTimeZeros(
                  item.startTime
                )}-${stripTimeZeros(item.endTime)}`}
              </DateElement>
              <StatusElement item={item} />
            </TextWrapper>
            <div>{item.buttons}</div>
          </StyledListItem>
        ))}
      </StyledList>
    </ListWrapper>
  );
}

export const RESERVATION_TO_COPY_FRAGMENT = gql`
  fragment ReservationToCopy on ReservationNode {
    ...ChangeReservationTime
    reservationUnit {
      id
      unit {
        id
        pk
      }
    }
  }
`;
