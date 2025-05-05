import {
  Button,
  ButtonVariant,
  IconPlusCircleFill,
  Notification,
  NotificationSize,
} from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import { useUnitPageQuery } from "@gql/gql-types";
import { parseAddress } from "@/common/util";
import { ExternalLink } from "@/component/ExternalLink";
import { base64encode, filterNonNullable } from "common/src/helpers";
import Error404 from "@/common/Error404";
import { ReservationUnitList } from "./ReservationUnitList";
import { getReservationUnitUrl, getSpacesResourcesUrl } from "@/common/urls";
import {
  CenterSpinner,
  Flex,
  fontBold,
  fontMedium,
  H1,
  H2,
  H3,
} from "common/styled";
import { gql } from "@apollo/client";

interface IProps {
  [key: string]: string;
  unitPk: string;
}

const Image = styled.img`
  clip-path: circle(50% at 50% 50%);
  width: 9rem;
  height: 9rem;
`;
const Heading = styled.div`
  flex-grow: 1;
`;

const Address = styled.div<{ $disabled?: boolean }>`
  font-size: var(--fontsize-body-s);
  line-height: 26px;
  ${fontMedium}

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}
`;

const ResourceUnitCount = styled.div`
  ${fontBold}
  padding: var(--spacing-s) 0;
  font-size: var(--fontsize-heading-xs);
`;

const StyledBoldButton = styled(Button)`
  ${fontBold}
  span {
    color: var(--color-black);
  }
`;

const EmptyContainer = styled(Flex).attrs({
  $alignItems: "center",
  $justifyContent: "center",
})`
  background-color: var(--color-silver-medium-light);
  min-height: 20rem;
`;

function Unit(): JSX.Element {
  const { t } = useTranslation();
  const unitPk = Number(useParams<IProps>().unitPk);
  const history = useNavigate();

  const typename = "UnitNode";
  const id = base64encode(`${typename}:${unitPk}`);
  const { data, loading: isLoading } = useUnitPageQuery({
    variables: { id },
    fetchPolicy: "network-only",
  });

  const { unit } = data ?? {};
  const hasSpacesResources = Boolean(unit?.spaces?.length);

  if (isLoading) {
    return <CenterSpinner />;
  }

  // TODO separate invalid route and no unit found errors
  if (!unit) {
    return <Error404 />;
  }

  const reservationUnits = filterNonNullable(unit.reservationUnits);

  const UNIT_REGISTRY_LINK = `https://asiointi.hel.fi/tprperhe/TPR/UI/ServicePoint/ServicePointEdit/`;
  return (
    <>
      <Flex $direction="row" $alignItems="center">
        <Image src="https://tilavaraus.hel.fi/v1/media/reservation_unit_images/liikumistila2.jfif.250x250_q85_crop.jpg" />
        <Heading>
          <H1 $noMargin>{unit?.nameTranslations.fi || "-"}</H1>
          {unit?.location ? (
            <Address>{parseAddress(unit?.location)}</Address>
          ) : (
            <Address $disabled>{t("Unit.noAddress")}</Address>
          )}
        </Heading>
        <Link to={getSpacesResourcesUrl(unitPk)}>
          {t("Unit.showSpacesAndResources")}
        </Link>
      </Flex>
      {!hasSpacesResources ? (
        <Notification
          type="alert"
          label={t("Unit.noSpacesResourcesTitle")}
          size={NotificationSize.Large}
        >
          {t("Unit.noSpacesResources")}{" "}
          <Link to={getSpacesResourcesUrl(unitPk)}>
            {t("Unit.createSpaces")}
          </Link>
        </Notification>
      ) : null}
      <ExternalLink to={`${UNIT_REGISTRY_LINK}${unit.tprekId}`}>
        {t("Unit.maintainOpeningHours")}
      </ExternalLink>
      <H2 $noMargin>{t("Unit.reservationUnitTitle")}</H2>
      <Flex $direction="row" $justifyContent="space-between">
        {reservationUnits.length > 0 ? (
          <ResourceUnitCount>
            {t("Unit.reservationUnits", {
              count: reservationUnits.length,
            })}
          </ResourceUnitCount>
        ) : (
          <div />
        )}
        <StyledBoldButton
          disabled={!hasSpacesResources}
          variant={ButtonVariant.Supplementary}
          iconStart={<IconPlusCircleFill />}
          onClick={() => {
            history(getReservationUnitUrl(null, unitPk));
          }}
        >
          {t("Unit.reservationUnitCreate")}
        </StyledBoldButton>
      </Flex>
      {reservationUnits.length > 0 ? (
        <ReservationUnitList
          reservationUnits={reservationUnits}
          unitId={unitPk}
        />
      ) : (
        <EmptyContainer>
          <H3 as="p">{t("Unit.noReservationUnitsTitle")}</H3>
        </EmptyContainer>
      )}
    </>
  );
}

export default Unit;

export const UNIT_PAGE_QUERY = gql`
  query UnitPage($id: ID!) {
    unit(id: $id) {
      id
      pk
      tprekId
      nameTranslations {
        fi
      }
      shortDescriptionTranslations {
        fi
      }
      reservationUnits {
        ...ReservationUnitCard
      }
      ...NewResourceUnitFields
    }
  }
`;
