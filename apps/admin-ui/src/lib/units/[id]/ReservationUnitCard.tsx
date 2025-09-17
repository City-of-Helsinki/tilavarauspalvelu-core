import React from "react";
import { IconArrowRight, IconLayers, IconHome, IconGroup, IconPen, IconCheck } from "hds-react";
import { useTranslation } from "next-i18next";
import type { ReservationUnitCardFragment } from "@gql/gql-types";
import { getImageSource, getMainImage } from "common/src/helpers";
import StatusLabel from "common/src/components/StatusLabel";
import { getReservationUnitUrl } from "@/common/urls";
import Card from "common/src/components/Card";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { gql } from "@apollo/client";

interface IProps {
  reservationUnit: ReservationUnitCardFragment;
  unitPk: number;
}

export function ReservationUnitCard({ reservationUnit, unitPk }: Readonly<IProps>): JSX.Element {
  const { t } = useTranslation();

  const image = getMainImage(reservationUnit);
  const hasPurposes = (reservationUnit.purposes.length ?? 0) > 0;
  const link = getReservationUnitUrl(unitPk, reservationUnit.pk);
  const imgSrc = getImageSource(image, "medium");

  const infos = [];
  if (hasPurposes) {
    infos.push({
      icon: <IconLayers />,
      value: t("reservationUnitCard:purpose", {
        count: reservationUnit.purposes?.length,
      }),
    });
  }
  if (reservationUnit.reservationUnitType) {
    infos.push({
      icon: <IconHome />,
      value: reservationUnit.reservationUnitType.nameFi ?? "",
    });
  }
  if (reservationUnit.maxPersons) {
    infos.push({
      icon: <IconGroup />,
      value: `${t("reservationUnit:headings.maxPersons")} ${reservationUnit.maxPersons}`,
    });
  }

  const tags = [];
  if (reservationUnit.isDraft) {
    tags.push(
      <StatusLabel type="draft" icon={<IconPen />} key="draft">
        {t("reservationUnitCard:stateDraft")}
      </StatusLabel>
    );
  } else {
    tags.push(
      <StatusLabel type="success" icon={<IconCheck />} key="success">
        {t("reservationUnitCard:statePublished")}
      </StatusLabel>
    );
  }

  const buttons = [
    <ButtonLikeLink href={link} key="seeMore">
      {t("common:view")}
      <IconArrowRight />
    </ButtonLikeLink>,
  ];

  return (
    <Card
      heading={reservationUnit.nameFi ?? ""}
      text={t(
        (reservationUnit?.resources?.length || 0) > 1
          ? "reservationUnitCard:spaceAndResource"
          : "reservationUnitCard:spaceOnly"
      )}
      link={link}
      imageSrc={imgSrc}
      infos={infos}
      tags={tags}
      buttons={buttons}
    />
  );
}

export const RESERVATION_UNIT_CARD_FRAGMENT = gql`
  fragment ReservationUnitCard on ReservationUnitNode {
    id
    pk
    nameFi
    maxPersons
    isDraft
    reservationUnitType {
      id
      nameFi
    }
    images {
      ...Image
    }
    purposes {
      id
    }
    resources {
      id
    }
  }
`;
