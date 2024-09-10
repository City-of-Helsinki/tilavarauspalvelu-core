import { IconArrowRight, IconEuroSign, IconGroup } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import NextImage from "next/image";
import type {
  ReservationUnitNode,
  SearchReservationUnitsQuery,
} from "@gql/gql-types";
import { format, isToday, isTomorrow } from "date-fns";
import { toUIDate } from "common/src/common/util";
import { getMainImage, getTranslation } from "@/modules/util";
import {
  getActivePricing,
  getPriceString,
  getReservationUnitName,
  getUnitName,
} from "@/modules/reservationUnit";
import { isBrowser, reservationUnitPrefix } from "@/modules/const";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import { getImageSource } from "common/src/helpers";
import Card from "common/src/components/Card";
import Tag from "common/src/components/Tag";
import { useSearchParams } from "next/navigation";

type QueryT = NonNullable<SearchReservationUnitsQuery["reservationUnits"]>;
type Edge = NonNullable<NonNullable<QueryT["edges"]>[0]>;
type Node = NonNullable<Edge["node"]>;
interface PropsT {
  reservationUnit: Node;
}

const StatusTag = ({
  data,
  id,
}: {
  data: { closed: boolean; availableAt: string };
  id: string;
}): JSX.Element => {
  const { t } = useTranslation();
  const { closed, availableAt } = data;

  if (closed) {
    return (
      <Tag ariaLabel={t("reservationUnitCard:closed")} type="error" id={id}>
        {t("reservationUnitCard:closed")}
      </Tag>
    );
  }

  if (!availableAt) {
    return (
      <Tag ariaLabel={t("reservationUnitCard:noTimes")} type="neutral" id={id}>
        {t("reservationUnitCard:noTimes")}
      </Tag>
    );
  }
  const availableAtDate = new Date(availableAt);
  let dayText = toUIDate(availableAtDate);
  if (isToday(availableAtDate)) {
    dayText = t("common:today");
  } else if (isTomorrow(availableAtDate)) {
    dayText = t("common:tomorrow");
  }
  const timeText = format(new Date(availableAt), "HH:mm");
  const ariaLabel = t("reservationUnitCard:firstAvailableTime");
  return (
    <Tag ariaLabel={ariaLabel} type="success" id={id}>
      {`${dayText} ${timeText}`}
    </Tag>
  );
};

// TODO SSR version (and remove the use hook)
function useConstructLink(
  reservationUnit: Pick<ReservationUnitNode, "pk">
): string {
  const params = useSearchParams();
  const date = params.get("startDate");
  const time = params.get("timeBegin");
  const duration = params.get("duration");

  if (!isBrowser) {
    return "";
  }
  if (reservationUnit.pk == null) {
    return "";
  }

  const linkURL = new URL(
    `${reservationUnitPrefix}/${reservationUnit.pk}`,
    document.baseURI
  );
  if (duration != null) linkURL.searchParams.set("duration", duration);
  if (date != null) linkURL.searchParams.set("date", date);
  if (time != null) linkURL.searchParams.set("time", time);

  return linkURL.toString();
}

function ReservationUnitCard({ reservationUnit }: PropsT): JSX.Element {
  const { t } = useTranslation();
  const name = getReservationUnitName(reservationUnit);

  const link = useConstructLink(reservationUnit);
  const unitName = getUnitName(reservationUnit.unit ?? undefined);

  const pricing = getActivePricing(reservationUnit);
  const unitPrice =
    pricing != null ? getPriceString({ t, pricing }) : undefined;

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslation(reservationUnit.reservationUnitType, "name")
      : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");

  const tags = [
    <StatusTag
      data={{
        closed: reservationUnit.isClosed ?? false,
        availableAt: reservationUnit.firstReservableDatetime ?? "",
      }}
      id={`status-tag-${reservationUnit.pk}`}
      key={`status-tag-${reservationUnit.pk}`}
    />,
  ];

  const infos = [];
  if (reservationUnitTypeName) {
    infos.push({
      icon: (
        <NextImage
          src="/icons/icon_premises.svg"
          alt=""
          width="24"
          height="24"
          aria-hidden="true"
        />
      ),
      value: reservationUnitTypeName,
    });
  }
  if (unitPrice) {
    infos.push({
      icon: <IconEuroSign aria-label={t("prices:reservationUnitPriceLabel")} />,
      value: unitPrice,
    });
  }
  if (reservationUnit.maxPersons) {
    infos.push({
      icon: (
        <IconGroup
          aria-label={t("reservationUnitCard:maxPersons", {
            maxPersons: reservationUnit.maxPersons,
          })}
          size="s"
        />
      ),
      value: t("reservationUnitCard:maxPersons", {
        count: reservationUnit.maxPersons,
      }),
    });
  }

  const buttons = [
    <ButtonLikeLink href={link} key={link}>
      {t("reservationUnitCard:seeMore")}
      <IconArrowRight aria-hidden="true" />
    </ButtonLikeLink>,
  ];

  return (
    <Card
      heading={name ?? ""}
      headingLevel={2}
      text={unitName ?? ""}
      link={link}
      imageSrc={imgSrc}
      tags={tags}
      infos={infos}
      buttons={buttons}
    />
  );
}

export default ReservationUnitCard;
