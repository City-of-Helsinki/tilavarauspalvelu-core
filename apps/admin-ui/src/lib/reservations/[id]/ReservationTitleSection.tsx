import React, { forwardRef } from "react";
import { IconCheck, IconCogwheel, IconCross, IconEuroSign, IconPen, IconQuestionCircle, IconSize } from "hds-react";
import { useTranslation } from "next-i18next";
import { Flex, TitleSection, H1 } from "common/src/styled";
import {
  type Maybe,
  OrderStatus,
  ReservationStateChoice,
  type ReservationTitleSectionFieldsFragment,
  useReservationApplicationLinkQuery,
} from "@gql/gql-types";
import { getName } from "@/modules/reservation";
import { formatDateTime, parseValidDateObject } from "common/src/modules/date-utils";
import { getApplicationUrl } from "@/modules/urls";
import { gql } from "@apollo/client";
import { ExternalLink } from "@/components/ExternalLink";
import StatusLabel, { type StatusLabelType } from "common/src/components/StatusLabel";

function getStatusLabelType(s?: Maybe<OrderStatus>): StatusLabelType {
  switch (s) {
    case OrderStatus.Paid:
    case OrderStatus.Refunded:
      return "success";
    case OrderStatus.Expired:
      return "error";
    case OrderStatus.PaidByInvoice:
    case OrderStatus.PaidManually:
    case OrderStatus.Draft:
      return "alert";
    case OrderStatus.Cancelled:
    default:
      return "neutral";
  }
}

function getReservationStateLabelProps(s?: Maybe<ReservationStateChoice>): {
  type: StatusLabelType;
  icon: JSX.Element;
} {
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
}

type Props = Readonly<{
  reservation: ReservationTitleSectionFieldsFragment;
  tagline: string;
  overrideTitle?: string;
  noMargin?: boolean;
}>;

export const ReservationTitleSection = forwardRef<HTMLDivElement, Props>(
  ({ reservation, tagline, overrideTitle, noMargin }: Props, ref) => {
    const { t } = useTranslation();

    // ignore error on purpose because this is going to fail with permission error
    const { data, error: _err } = useReservationApplicationLinkQuery({
      variables: { id: reservation.reservationSeries?.id ?? "" },
      skip: !reservation.reservationSeries?.id,
    });

    const applicationPk =
      data?.reservationSeries?.allocatedTimeSlot?.reservationUnitOption?.applicationSection?.application?.pk;
    const sectionPk = data?.reservationSeries?.allocatedTimeSlot?.reservationUnitOption?.applicationSection?.pk;
    const applicationLink = getApplicationUrl(applicationPk, sectionPk);

    const paymentStatusLabelType = getStatusLabelType(reservation.paymentOrder?.status);
    const reservationState = getReservationStateLabelProps(reservation.state);

    return (
      <div>
        <TitleSection $noMargin={noMargin} ref={ref}>
          <H1 $noMargin>{overrideTitle ?? getName(reservation, t)}</H1>
          <Flex $direction="row" $alignItems="center">
            {reservation.paymentOrder?.status != null && (
              <StatusLabel
                type={paymentStatusLabelType}
                data-testid="reservation_title_section__order_status"
                icon={<IconEuroSign aria-hidden="true" />}
              >
                {t(`translation:orderStatus.${reservation.paymentOrder?.status}`)}
              </StatusLabel>
            )}
            {reservation.state && (
              <StatusLabel
                type={reservationState.type}
                icon={reservationState.icon}
                data-testid="reservation_title_section__reservation_state"
              >
                {t(`reservation:state.${reservation.state}`)}
              </StatusLabel>
            )}
          </Flex>
        </TitleSection>
        <p data-testid="reservation_title_section__tagline">{tagline}</p>
        <Flex $gap="xs" $direction="row">
          {t("reservation:createdAt")} {formatDateTime(parseValidDateObject(reservation.createdAt), { t })}
          {applicationLink !== "" && (
            <ExternalLink href={applicationLink} size={IconSize.Small} isBold>
              {`${t("reservation:applicationLink")}: ${applicationPk}-${sectionPk}`}
            </ExternalLink>
          )}
        </Flex>
      </div>
    );
  }
);

export const APPLICATION_LINK_QUERY = gql`
  query ReservationApplicationLink($id: ID!) {
    reservationSeries(id: $id) {
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

export const RESERVATION_TITLE_SECTION_FRAGMENT = gql`
  fragment ReservationTitleSectionFields on ReservationNode {
    id
    createdAt
    state
    type
    name
    pk
    reserveeName
    reservationSeries {
      id
    }
    paymentOrder {
      id
      status
    }
  }
`;
