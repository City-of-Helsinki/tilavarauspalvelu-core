import { IconClock, IconGroup, IconEuroSign } from "hds-react";
import React from "react";
import NextImage from "next/image";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { formatDuration } from "common/src/common/util";
import { fontRegular, H1, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ReservationKind, type ReservationUnitPageQuery } from "@gql/gql-types";
import { formatDate, getTranslation, orderImages } from "@/modules/util";
import IconWithText from "../common/IconWithText";
import { Images } from "./Images";
import {
  getActivePricing,
  getPriceString,
  getReservationUnitName,
  getUnitName,
  isReservationUnitPaid,
} from "@/modules/reservationUnit";
import BreadcrumbWrapper from "../common/BreadcrumbWrapper";
import { isReservationStartInFuture } from "@/modules/reservation";
import { filterNonNullable } from "common/src/helpers";
import { getSingleSearchPath } from "@/modules/urls";
import { Flex } from "common/styles/util";

type QueryT = NonNullable<ReservationUnitPageQuery["reservationUnit"]>;
interface Props {
  reservationUnit: QueryT;
  reservationUnitIsReservable?: boolean;
  subventionSuffix?: JSX.Element;
}

// FIXME this breaks on 768px
const RightContainer = styled.div`
  font-size: var(--fontsize-body-m);
  display: grid;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: auto 465px;
    gap: var(--spacing-layout-2-xl);
  }
`;

const NotificationWrapper = styled.div`
  background-color: var(--color-engel-light);
  font-size: var(--fontsize-body-l);
  padding: var(--spacing-s);
  display: inline-block;
`;

function NonReservableNotification({
  reservationUnit,
}: {
  reservationUnit: Pick<QueryT, "reservationKind" | "reservationBegins">;
}) {
  const { t } = useTranslation();

  let returnText = t("reservationUnit:notifications.notReservable");
  if (reservationUnit.reservationKind === ReservationKind.Season) {
    returnText = t("reservationUnit:notifications.onlyRecurring");
  } else if (isReservationStartInFuture(reservationUnit)) {
    const futureOpeningText = t("reservationUnit:notifications.futureOpening", {
      date: reservationUnit.reservationBegins
        ? formatDate(reservationUnit.reservationBegins, "d.M.yyyy")
        : "",
      time: reservationUnit.reservationBegins
        ? formatDate(reservationUnit.reservationBegins, "H.mm")
        : "",
    });
    returnText = futureOpeningText;
  }

  return (
    <NotificationWrapper data-testid="reservation-unit--notification__reservation-start">
      {returnText}
    </NotificationWrapper>
  );
}

export function Head({
  reservationUnit,
  reservationUnitIsReservable,
  subventionSuffix,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const reservationUnitName = getReservationUnitName(reservationUnit);
  const unitName = getUnitName(reservationUnit.unit ?? undefined);
  const searchUrl = getSingleSearchPath();

  const routes = [
    { slug: searchUrl, title: t("breadcrumb:search") },
    // NOTE Don't set slug. It hides the mobile breadcrumb
    { title: reservationUnitName ?? "-" },
  ];
  return (
    <>
      <BreadcrumbWrapper route={routes} />
      <RightContainer>
        <Flex>
          <H1 $noMargin>{reservationUnitName}</H1>
          <H3 as="h2" $noMargin>
            {unitName}
          </H3>
          <IconList
            reservationUnit={reservationUnit}
            subventionSuffix={subventionSuffix}
          />
          {!reservationUnitIsReservable && (
            <NonReservableNotification reservationUnit={reservationUnit} />
          )}
        </Flex>
        <Images
          images={orderImages(reservationUnit.images)}
          contextName={reservationUnitName}
        />
      </RightContainer>
    </>
  );
}

// FIXME this should have spacing-m margin on the bottom (but I'd prefer it to be gap on the layout)
// (visible as an error on mobile)
const IconListWrapper = styled.div`
  & > div:empty {
    display: none;
  }
  width: 100%;

  ${fontRegular};
  font-size: var(--fontsize-body-s);
  display: grid;
  gap: var(--spacing-m) var(--spacing-s);
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

const StyledIconWithText = styled(IconWithText)`
  display: grid;
  align-items: flex-start;
  white-space: pre-line;
  line-height: var(--lineheight-l);
  margin-top: unset;
`;

function IconList({
  reservationUnit,
  subventionSuffix,
}: Pick<Props, "reservationUnit" | "subventionSuffix">): JSX.Element {
  const { t } = useTranslation();

  const minDur = reservationUnit.minReservationDuration ?? 0;
  const maxDur = reservationUnit.maxReservationDuration ?? 0;
  const minReservationDuration = formatDuration(minDur / 60, t, true);
  const maxReservationDuration = formatDuration(maxDur / 60, t, true);
  const pricing = getActivePricing(reservationUnit);
  const isPaid = isReservationUnitPaid(reservationUnit.pricings);
  const unitPrice = pricing ? getPriceString({ t, pricing }) : undefined;
  const hasSubventionSuffix = pricing && isPaid && subventionSuffix != null;

  const iconsTexts = filterNonNullable([
    reservationUnit.reservationUnitType != null
      ? {
          key: "reservationUnitType",
          icon: (
            <NextImage
              src="/icons/icon_premises.svg"
              alt=""
              width="24"
              height="24"
              aria-hidden="true"
            />
          ),
          text: getTranslation(reservationUnit.reservationUnitType, "name"),
        }
      : null,
    reservationUnit.maxPersons != null
      ? {
          key: "maxPersons",
          icon: <IconGroup aria-label={t("reservationUnit:maxPersons")} />,
          text: t("reservationUnitCard:personRange", {
            count: reservationUnit.maxPersons,
            value:
              reservationUnit.minPersons !== reservationUnit.maxPersons &&
              reservationUnit.minPersons != null &&
              reservationUnit.minPersons > 1
                ? `${reservationUnit.minPersons} - ${reservationUnit.maxPersons}`
                : reservationUnit.maxPersons,
          }),
        }
      : null,
    reservationUnit.minReservationDuration ||
    reservationUnit.maxReservationDuration
      ? {
          key: "eventDuration",
          icon: (
            <IconClock aria-label={t("reservationCalendar:eventDuration")} />
          ),
          text: t(`reservationCalendar:eventDurationLiteral`, {
            min: minReservationDuration,
            max: maxReservationDuration,
          }),
        }
      : null,
    unitPrice != null
      ? {
          key: "unitPrice",
          icon: (
            <IconEuroSign aria-label={t("prices:reservationUnitPriceLabel")} />
          ),
          text: (
            <>
              {unitPrice}
              {hasSubventionSuffix ? subventionSuffix : null}
            </>
          ),
        }
      : null,
  ] as const);

  return (
    <IconListWrapper>
      {iconsTexts.map(({ icon, key, text }) => (
        <StyledIconWithText key={key} icon={icon} text={text} />
      ))}
    </IconListWrapper>
  );
}
