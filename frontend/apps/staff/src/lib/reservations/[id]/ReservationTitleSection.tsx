import React, { forwardRef } from "react";
import { gql } from "@apollo/client";
import { IconCheck, IconCogwheel, IconCross, IconEuroSign, IconPen, IconQuestionCircle, IconSize } from "hds-react";
import { useTranslation } from "next-i18next";
import StatusLabel, { type StatusLabelType } from "ui/src/components/StatusLabel";
import { formatDateTime, parseValidDateObject } from "ui/src/modules/date-utils";
import { Flex, TitleSection, H1 } from "ui/src/styled";
import { ExternalLink } from "@/components/ExternalLink";
import { useSession } from "@/hooks";
import { hasPermission } from "@/modules/permissionHelper";
import { getName } from "@/modules/reservation";
import { getApplicationUrl } from "@/modules/urls";
import {
  type Maybe,
  OrderStatus,
  ReservationStateChoice,
  type ReservationTitleSectionFieldsFragment,
  useReservationApplicationLinkQuery,
  UserPermissionChoice,
} from "@gql/gql-types";

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
      return { type: "draft", icon: <IconPen /> };
    case ReservationStateChoice.WaitingForPayment:
      return { type: "alert", icon: <IconEuroSign /> };
    case ReservationStateChoice.RequiresHandling:
      return { type: "info", icon: <IconCogwheel /> };
    case ReservationStateChoice.Confirmed:
      return { type: "success", icon: <IconCheck /> };
    case ReservationStateChoice.Denied:
      return { type: "error", icon: <IconCross /> };
    case ReservationStateChoice.Cancelled:
      return { type: "neutral", icon: <IconCross /> };
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle />,
      };
  }
}

type Props = Readonly<{
  reservation: ReservationTitleSectionFieldsFragment;
  tagline: string;
  overrideTitle?: string;
  noMargin?: boolean;
}>;

function useApplicationLink({ reservation }: { reservation: ReservationTitleSectionFieldsFragment }) {
  const { t } = useTranslation();

  // User can view the Reservation without access to the Application
  const { user } = useSession();
  const hasApplicationPermissions = hasPermission(
    user,
    UserPermissionChoice.CanViewApplications,
    reservation.reservationUnit.unit.pk
  );

  const isQueryEnabled = reservation.reservationSeries?.id && hasApplicationPermissions;
  const { data } = useReservationApplicationLinkQuery({
    variables: { id: reservation.reservationSeries?.id ?? "" },
    skip: !isQueryEnabled,
  });

  const applicationPk =
    data?.reservationSeries?.allocatedTimeSlot?.reservationUnitOption?.applicationSection?.application?.pk;
  const sectionPk = data?.reservationSeries?.allocatedTimeSlot?.reservationUnitOption?.applicationSection?.pk;
  const applicationLink = getApplicationUrl(applicationPk, sectionPk);

  return {
    applicationLink,
    applicationLinkLabel:
      applicationLink !== "" ? `${t("reservation:applicationLink")}: ${applicationPk}-${sectionPk}` : "",
  };
}

export const ReservationTitleSection = forwardRef<HTMLDivElement, Props>(
  ({ reservation, tagline, overrideTitle, noMargin }: Props, ref) => {
    const { t } = useTranslation();

    const { applicationLink, applicationLinkLabel } = useApplicationLink({ reservation });

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
              {applicationLinkLabel}
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
    reservationUnit {
      id
      unit {
        id
        pk
      }
    }
    reservationSeries {
      id
    }
    paymentOrder {
      id
      status
    }
  }
`;
