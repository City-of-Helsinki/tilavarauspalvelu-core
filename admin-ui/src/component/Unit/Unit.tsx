import { useQuery } from "@apollo/client";
import {
  Button,
  IconClock,
  IconGlobe,
  IconInfoCircleFill,
  IconLocate,
  IconMap,
  IconPlusCircleFill,
  Notification,
} from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import { UNIT_QUERY } from "../../common/queries";
import { parseAddress } from "../../common/util";
import { useModal } from "../../context/ModalContext";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { H1 } from "../../styles/new-typography";
import { BasicLink, breakpoints } from "../../styles/util";
import Loader from "../Loader";
import ReservationUnitList from "./ReservationUnitList";
import withMainMenu from "../withMainMenu";
import ExternalLink from "./ExternalLink";
import InfoModalContent from "./InfoModalContent";
import { publicUrl } from "../../common/const";
import {
  Query,
  QueryUnitByPkArgs,
  ReservationUnitType,
  UnitByPkType,
} from "../../common/gql-types";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { useNotification } from "../../context/NotificationContext";

interface IProps {
  unitPk: string;
}

const Wrapper = styled.div``;
const Name = styled(H1)`
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

const Props = styled.div`
  padding: var(--spacing-xs) 0;
  @media (min-width: ${breakpoints.s}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-m);
  }
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

const StyledNotification = styled(Notification)`
  margin: var(--spacing-xs) var(--spacing-layout-2-xs);
  width: auto;
  @media (min-width: ${breakpoints.xl}) {
    margin: var(--spacing-s) var(--spacing-layout-xl);
  }
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

const NoReservationUnitsTitle = styled.p`
  font-family: var(--tilavaraus-admin-font-bold);
  text-align: center;
`;

const NoReservationUnitsInfo = styled.p`
  font-size: var(--fontsize-body-s);
  text-align: center;
`;

const NoReservationUnits = styled.div``;

const Unit = (): JSX.Element | null => {
  const { notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [unit, setUnit] = useState<UnitByPkType>();
  const [hasSpacesResources, setSpacesResources] = useState(true);

  const { t } = useTranslation();
  const unitPk = Number(useParams<IProps>().unitPk);
  const history = useHistory();

  useQuery<Query, QueryUnitByPkArgs>(UNIT_QUERY, {
    variables: { pk: unitPk },
    fetchPolicy: "network-only",
    onCompleted: ({ unitByPk }) => {
      if (unitByPk) {
        setUnit(unitByPk);
        setSpacesResources(Boolean(unitByPk?.spaces?.length));
      }
      setIsLoading(false);
    },
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
      setIsLoading(false);
    },
  });

  const { setModalContent } = useModal();

  if (isLoading) {
    return <Loader />;
  }

  if (!unit) {
    return null;
  }

  return (
    <Wrapper>
      <BreadcrumbWrapper
        route={["spaces-n-settings", `${publicUrl}/units`, "route"]}
        aliases={[{ slug: "route", title: unit?.nameFi || "" }]}
      />
      <ContentContainer>
        <Links>
          <BasicLink to={`/unit/${unitPk}/map`}>
            <IconMap style={{ marginTop: "-2px" }} /> {t("Unit.showOnMap")}
          </BasicLink>
          <BasicLink to={`/unit/${unitPk}/openingHours`}>
            <IconClock style={{ marginTop: "-2px" }} />{" "}
            {t("Unit.showOpeningHours")}
          </BasicLink>
          <BasicLink to={`/unit/${unitPk}/spacesResources`}>
            {t("Unit.showSpacesAndResources")}
          </BasicLink>
          <BasicLink to={`/unit/${unitPk}/configuration`}>
            {t("Unit.showConfiguration")}
          </BasicLink>
        </Links>
      </ContentContainer>
      <IngressContainer>
        <Ingress>
          <Image src="https://tilavaraus.hel.fi/v1/media/reservation_unit_images/liikumistila2.jfif.250x250_q85_crop.jpg" />
          <div>
            <Name>{unit?.nameFi}</Name>
            {unit?.location ? (
              <Address>{parseAddress(unit?.location)}</Address>
            ) : (
              <Prop $disabled>{t("Unit.noAddress")}</Prop>
            )}
            <Props>
              <Prop $disabled>
                <IconGlobe /> {t("Unit.noArea")}
              </Prop>
              <Prop $disabled>
                <IconLocate />
                {t("Unit.noService")}
              </Prop>
            </Props>
          </div>
        </Ingress>
        {!hasSpacesResources ? (
          <StyledNotification
            type="alert"
            label={t("Unit.noSpacesResourcesTitle")}
            size="large"
          >
            {t("Unit.noSpacesResources")}{" "}
            <BasicLink to={`/unit/${unit.pk}/spacesResources`}>
              {t("Unit.createSpaces")}
            </BasicLink>
          </StyledNotification>
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
            <StyledButton
              variant="supplementary"
              iconRight={<IconInfoCircleFill />}
              onClick={() =>
                setModalContent && setModalContent(<InfoModalContent />)
              }
            >
              {t("Unit.reservationUnitReadMore")}
            </StyledButton>
            {unit?.reservationUnits && unit?.reservationUnits.length > 0 ? (
              <ResourceUnitCount>
                {t("Unit.reservationUnits", {
                  count: unit?.reservationUnits.length,
                })}
              </ResourceUnitCount>
            ) : null}
          </div>
          <StyledBoldButton
            disabled={!hasSpacesResources}
            variant="supplementary"
            iconLeft={<IconPlusCircleFill />}
            onClick={() => {
              history.push(`/unit/${unitPk}/reservationUnit/edit/`);
            }}
          >
            {t("Unit.reservationUnitCreate")}
          </StyledBoldButton>
        </Info>
      </IngressContainer>
      {unit?.reservationUnits && unit?.reservationUnits.length > 0 ? (
        <ReservationUnitList
          reservationUnits={
            (unit?.reservationUnits as ReservationUnitType[]) || []
          }
          unitId={unitPk}
        />
      ) : (
        <ContentContainer>
          <ReservationUnits>
            <NoReservationUnits>
              <div>
                <NoReservationUnitsTitle>
                  {t("Unit.noReservationUnitsTitle")}
                </NoReservationUnitsTitle>
                <NoReservationUnitsInfo>
                  {t("Unit.noReservationUnitsInfo")}
                </NoReservationUnitsInfo>
              </div>
            </NoReservationUnits>
          </ReservationUnits>
        </ContentContainer>
      )}
    </Wrapper>
  );
};

export default withMainMenu(Unit);
