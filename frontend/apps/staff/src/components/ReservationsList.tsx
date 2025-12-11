import React from "react";
import { gql } from "@apollo/client";
import { startOfDay } from "date-fns";
import { Button, ButtonSize, ButtonVariant, IconCross } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { StatusLabel } from "ui/src/components/StatusLabel";
import { formatDate } from "ui/src/modules/date-utils";
import { H6 } from "ui/src/styled";
import { NewReservationModal } from "@/components/EditTimeModal";
import { useModal } from "@/context/ModalContext";
import { useSession } from "@/hooks";
import { hasPermission } from "@/modules/permissionHelper";
import { UserPermissionChoice } from "@gql/gql-types";
import type { ReservationToCopyFragment, RejectionReadinessChoice } from "@gql/gql-types";

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
    // NOTE the error handling is messy because impossible to get codes rather than the error message string
    const intervalErrorMsg = /ApolloError: Reservation start time does not match the allowed interval/;
    const overlapErrorMsg = /Overlapping reservations are not allowed/;
    const reservationInPastErrorMsg = /ApolloError: Reservation new begin cannot be in the past/;
    let errorCode = "default";
    if (intervalErrorMsg.test(x.error)) {
      errorCode = "interval";
    } else if (overlapErrorMsg.test(x.error)) {
      errorCode = "overlap";
    } else if (reservationInPastErrorMsg.test(x.error)) {
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
    keyPrefix: "myUnits:ReservationSeries.Confirmation",
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
  const { t } = useTranslation();
  const { setModalContent } = useModal();
  const { user } = useSession();

  const unitPk = reservationToCopy?.reservationUnit?.unit?.pk;
  const hasAccess = hasPermission(user, UserPermissionChoice.CanManageReservations, unitPk);

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
    <Button size={ButtonSize.Small} variant={ButtonVariant.Secondary} disabled={!hasAccess} onClick={handleClick}>
      {t("myUnits:ReservationSeries.addNewReservation")}
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
export function ReservationList(props: Props | ExtendedProps) {
  const { header, items, hasPadding, isTall } = props;
  if (items.length === 0) {
    return null;
  }

  const hasReservation = "reservationToCopy" in props && !!props.reservationToCopy;

  const hasReservationsInFuture = items.some((item) => !item.isRemoved && item.date >= startOfDay(new Date()));
  const showNewReservationButton = hasReservation && hasReservationsInFuture;

  const removed = items.filter((x) => x.isRemoved).length;
  const count = items.length - removed;
  const formatReservationSlot = (item: NewReservationListItem) =>
    `${formatDate(item.date, { includeWeekday: true })}, ${item.startTime}-${item.endTime}`;
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
                {formatReservationSlot(item)}
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
