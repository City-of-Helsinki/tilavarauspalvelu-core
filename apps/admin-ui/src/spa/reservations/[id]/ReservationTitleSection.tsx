import React, { forwardRef } from "react";
import {
  IconCheck,
  IconCogwheel,
  IconCross,
  IconEuroSign,
  IconPen,
  IconQuestionCircle,
} from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { fontMedium, H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  type Maybe,
  OrderStatus,
  type ReservationQuery,
  ReservationStateChoice,
  useReservationApplicationLinkQuery,
} from "@gql/gql-types";
import { getName } from "./util";
import { HorisontalFlex } from "@/styles/layout";
import { formatDateTime } from "@/common/util";
import { getApplicationUrl } from "@/common/urls";
import { gql } from "@apollo/client";
import { ExternalLink } from "@/component/ExternalLink";
import StatusLabel from "common/src/components/StatusLabel";
import { type StatusLabelType } from "common/src/tags";

const AlignVertically = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: row;
  align-items: center;
`;

const NameState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    margin-bottom: 0;
  }
`;

const Tagline = styled.div`
  font-size: var(--fontsize-body-xl);
  margin-bottom: var(--spacing-xs);
`;

const DateTime = styled.div`
  margin-bottom: var(--spacing-s);
  display: flex;
  gap: var(--spacing-xs);
  > a {
    ${fontMedium}
  }
`;

type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationType;
  tagline: string;
  overrideTitle?: string;
};

export const APPLICATION_LINK_QUERY = gql`
  query ReservationApplicationLink($id: ID!) {
    recurringReservation(id: $id) {
      id
      allocatedTimeSlot {
        id
        pk
        reservationUnitOption {
          id
          pk
          applicationSection {
            id
            pk
            application {
              id
              pk
            }
          }
        }
      }
    }
  }
`;

const getStatusLabelType = (s?: Maybe<OrderStatus>): StatusLabelType => {
  switch (s) {
    case OrderStatus.Paid:
    case OrderStatus.Refunded:
      return "success";
    case OrderStatus.Expired:
      return "error";
    case OrderStatus.PaidManually:
    case OrderStatus.Draft:
      return "alert";
    case OrderStatus.Cancelled:
    default:
      return "neutral";
  }
};

const getReservationStateLabelProps = (
  s?: Maybe<ReservationStateChoice>
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (s) {
    case ReservationStateChoice.Created:
      return { type: "draft", icon: <IconPen aria-hidden="true" /> };
    case ReservationStateChoice.WaitingForPayment:
      return { type: "alert", icon: <IconEuroSign aria-hidden="true" /> };
    case ReservationStateChoice.RequiresHandling:
      return { type: "info", icon: <IconCogwheel aria-hidden="true" /> };
    case ReservationStateChoice.Confirmed:
      return { type: "success", icon: <IconCheck aria-hidden="true" /> };
    case ReservationStateChoice.Denied:
      return { type: "error", icon: <IconCross aria-hidden="true" /> };
    case ReservationStateChoice.Cancelled:
      return { type: "neutral", icon: <IconCross aria-hidden="true" /> };
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle aria-hidden="true" />,
      };
  }
};

const ReservationTitleSection = forwardRef<HTMLDivElement, Props>(
  ({ reservation, tagline, overrideTitle }: Props, ref) => {
    const { t } = useTranslation();

    // ignore error on purpose because this is going to fail with permission error
    const { data, error: _err } = useReservationApplicationLinkQuery({
      variables: { id: reservation.recurringReservation?.id ?? "" },
      skip: !reservation.recurringReservation?.id,
    });

    const applicationPk =
      data?.recurringReservation?.allocatedTimeSlot?.reservationUnitOption
        ?.applicationSection?.application?.pk;
    const sectionPk =
      data?.recurringReservation?.allocatedTimeSlot?.reservationUnitOption
        ?.applicationSection?.pk;
    const applicationLink = getApplicationUrl(applicationPk, sectionPk);

    const order = reservation.paymentOrder[0];
    const paymentStatusLabelType = getStatusLabelType(order?.status);
    const reservationState = getReservationStateLabelProps(reservation.state);

    return (
      <div>
        <NameState ref={ref}>
          <H1 $legacy>{overrideTitle ?? getName(reservation, t)}</H1>
          <HorisontalFlex>
            {order?.status != null && (
              <AlignVertically>
                <StatusLabel
                  type={paymentStatusLabelType}
                  data-testid="reservation_title_section__order_status"
                  icon={<IconEuroSign aria-hidden="true" />}
                >
                  {t(`Payment.status.${order?.status}`)}
                </StatusLabel>
              </AlignVertically>
            )}
            <AlignVertically style={{ gap: "var(--spacing-xs)" }}>
              {reservation.state && (
                <StatusLabel
                  type={reservationState.type}
                  icon={reservationState.icon}
                  data-testid="reservation_title_section__reservation_state"
                >
                  {t(`Reservation.state.${reservation.state}`)}
                </StatusLabel>
              )}
            </AlignVertically>
          </HorisontalFlex>
        </NameState>
        <Tagline data-testid="reservation_title_section__tagline">
          {tagline}
        </Tagline>
        <DateTime>
          {t("RequestedReservation.createdAt")}{" "}
          {formatDateTime(reservation.createdAt ?? "")}
          {applicationLink !== "" && (
            <ExternalLink to={applicationLink} size="s">
              {`${t("RequestedReservation.applicationLink")}: ${applicationPk}-${sectionPk}`}
            </ExternalLink>
          )}
        </DateTime>
      </div>
    );
  }
);

export default ReservationTitleSection;
