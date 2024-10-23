import React from "react";
import {
  IconArrowRight,
  IconLayers,
  IconHome,
  IconGroup,
  IconPen,
  IconCheck,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { ImageType, type UnitQuery } from "@gql/gql-types";
import { getImageSource } from "common/src/helpers";
import StatusLabel from "common/src/components/StatusLabel";
import { getReservationUnitUrl } from "@/common/urls";
import Card from "common/src/components/Card";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";

type UnitType = NonNullable<UnitQuery["unit"]>;
type ReservationUnitType = NonNullable<UnitType["reservationUnits"]>[0];
interface IProps {
  reservationUnit: ReservationUnitType;
  unitId: number;
}

export function ReservationUnitCard({
  reservationUnit,
  unitId,
}: Readonly<IProps>): JSX.Element {
  const { t } = useTranslation();

  const image =
    reservationUnit.images?.find((i) => i?.imageType === ImageType.Main) ??
    reservationUnit.images?.find(() => true) ??
    null;

  const hasPurposes = (reservationUnit?.purposes?.length || 0) > 0;

  const link = getReservationUnitUrl(reservationUnit.pk, unitId);
  const imgSrc = getImageSource(image, "medium");

  const infos = [];
  if (hasPurposes) {
    infos.push({
      icon: <IconLayers />,
      value: t("ReservationUnitCard.purpose", {
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
      value: `${t("ReservationUnits.headings.maxPersons")} ${reservationUnit.maxPersons}`,
    });
  }

  const tags = [];
  if (reservationUnit.isDraft) {
    tags.push(
      <StatusLabel type="draft" icon={<IconPen ariaHidden />} key="draft">
        {t("ReservationUnitCard.stateDraft")}
      </StatusLabel>
    );
  } else {
    tags.push(
      <StatusLabel type="success" icon={<IconCheck ariaHidden />} key="success">
        {t("ReservationUnitCard.statePublished")}
      </StatusLabel>
    );
  }

  const buttons = [
    <ButtonLikeLink to={link} key="seeMore">
      {t("common.view")}
      <IconArrowRight ariaHidden />
    </ButtonLikeLink>,
  ];

  return (
    <Card
      heading={reservationUnit.nameFi ?? ""}
      text={t(
        (reservationUnit?.resources?.length || 0) > 1
          ? "ReservationUnitCard.spaceAndResource"
          : "ReservationUnitCard.spaceOnly"
      )}
      link={link}
      imageSrc={imgSrc}
      infos={infos}
      tags={tags}
      buttons={buttons}
    />
  );
}
