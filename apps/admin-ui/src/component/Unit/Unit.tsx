import { Button, IconPlusCircleFill, Notification } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { H1, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { useUnitQuery } from "@gql/gql-types";
import { parseAddress } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import { Container } from "@/styles/layout";
import { BasicLink } from "@/styles/util";
import Loader from "../Loader";
import { ExternalLink } from "@/component/ExternalLink";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { base64encode, filterNonNullable } from "common/src/helpers";
import Error404 from "@/common/Error404";
import { ReservationUnitList } from "./ReservationUnitList";

interface IProps {
  [key: string]: string;
  unitPk: string;
}

const Name = styled(H1).attrs({ $legacy: true })`
  line-height: 46px;
  margin-bottom: 0;
`;

const Links = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2em;
  flex-wrap: wrap;
  font-size: var(--fontsize-body-s);

  @media (min-width: ${breakpoints.m}) {
    flex-wrap: nowrap;
  }
`;

const Address = styled.div`
  font-size: var(--fontsize-body-s);
  line-height: 26px;
`;
const Image = styled.img`
  clip-path: circle(50% at 50% 50%);
  width: 9rem;
  height: 9rem;
`;

const Ingress = styled.div`
  display: flex;
  gap: var(--spacing-m);
`;

const Prop = styled.div<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}
`;

const HeadingLarge = styled.div`
  font-size: var(--fontsize-heading-l);
  font-family: var(--tilavaraus-admin-font-bold);
  line-height: 43px;
`;

const Info = styled.div`
  display: flex;
`;

const ResourceUnitCount = styled.div`
  padding: var(--spacing-s) 0;
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: var(--fontsize-heading-xs);
`;

const StyledButton = styled(Button)`
  padding: 0;
  span {
    color: var(--color-black);
    padding: 0;
  }
`;

const StyledBoldButton = styled(StyledButton)`
  font-family: var(--tilavaraus-admin-font-bold);
  margin-left: auto;
  span {
    color: var(--color-black);
  }
`;

const ReservationUnits = styled.div`
  background-color: var(--tilavaraus-admin-gray);
  min-height: 20rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-m);
`;

function Unit(): JSX.Element {
  const { notifyError } = useNotification();

  const { t } = useTranslation();
  const unitPk = Number(useParams<IProps>().unitPk);
  const history = useNavigate();

  const typename = "UnitNode";
  const id = base64encode(`${typename}:${unitPk}`);
  const { data, loading: isLoading } = useUnitQuery({
    variables: { id },
    fetchPolicy: "network-only",
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });

  const { unit } = data ?? {};
  const hasSpacesResources = Boolean(unit?.spaces?.length);

  if (isLoading) {
    return <Loader />;
  }

  // TODO separate invalid route and no unit found errors
  if (!unit) {
    return <Error404 />;
  }

  const reservationUnits = filterNonNullable(unit.reservationunitSet);

  const route = [
    {
      alias: t("breadcrumb.spaces-n-settings"),
      slug: "",
    },
    {
      alias: t("breadcrumb.units"),
      slug: `/premises-and-settings/units`,
    },
    {
      slug: "",
      alias: unit?.nameFi || "-",
    },
  ];

  return (
    <>
      <BreadcrumbWrapper route={route} />
      <Container>
        <Links>
          <BasicLink to={`/unit/${unitPk}/spacesResources`}>
            {t("Unit.showSpacesAndResources")}
          </BasicLink>
        </Links>
        <Ingress>
          <Image src="https://tilavaraus.hel.fi/v1/media/reservation_unit_images/liikumistila2.jfif.250x250_q85_crop.jpg" />
          <div>
            <Name>{unit?.nameFi}</Name>
            {unit?.location ? (
              <Address>{parseAddress(unit?.location)}</Address>
            ) : (
              <Prop $disabled>{t("Unit.noAddress")}</Prop>
            )}
          </div>
        </Ingress>
        {!hasSpacesResources ? (
          <Notification
            type="alert"
            label={t("Unit.noSpacesResourcesTitle")}
            size="large"
          >
            {t("Unit.noSpacesResources")}{" "}
            <BasicLink to={`/unit/${unit.pk}/spacesResources`}>
              {t("Unit.createSpaces")}
            </BasicLink>
          </Notification>
        ) : null}
        <div style={{ margin: "var(--spacing-s) 0" }}>
          <ExternalLink
            to={`https://asiointi.hel.fi/tprperhe/TPR/UI/ServicePoint/ServicePointEdit/${unit.tprekId}`}
          >
            {t("Unit.maintainOpeningHours")}
          </ExternalLink>
        </div>
        <HeadingLarge>{t("Unit.reservationUnitTitle")}</HeadingLarge>
        <Info>
          <div>
            {reservationUnits.length > 0 ? (
              <ResourceUnitCount>
                {t("Unit.reservationUnits", {
                  count: reservationUnits.length,
                })}
              </ResourceUnitCount>
            ) : null}
          </div>
          <StyledBoldButton
            disabled={!hasSpacesResources}
            variant="supplementary"
            iconLeft={<IconPlusCircleFill />}
            onClick={() => {
              history(`/unit/${unitPk}/reservationUnit/edit/`);
            }}
          >
            {t("Unit.reservationUnitCreate")}
          </StyledBoldButton>
        </Info>
        {reservationUnits.length > 0 ? (
          <ReservationUnitList
            reservationUnits={reservationUnits}
            unitId={unitPk}
          />
        ) : (
          <ReservationUnits>
            <H3 as="p">{t("Unit.noReservationUnitsTitle")}</H3>
          </ReservationUnits>
        )}
      </Container>
    </>
  );
}

export default Unit;
