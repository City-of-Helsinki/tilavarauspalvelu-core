import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
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
import { ContentContainer, IngressContainer } from "../../styles/layout";
import withMainMenu from "../withMainMenu";
import { H1 } from "../../styles/typography";
import { UnitWIP } from "../../common/types";
import Loader from "../Loader";
import { getUnit } from "../../common/api";
import LinkPrev from "../LinkPrev";
import { BasicLink, breakpoints } from "../../styles/util";
import ExternalLink from "./ExternalLink";
import { useModal } from "../../context/UIContext";
import InfoModalContent from "./InfoModalContent";
import SecondaryNavigation from "../SecondaryNavigation";

interface IProps {
  unitId: string;
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
  margin: var(--spacing-s) var(--spacing-layout-m);
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

const StyledButton = styled(Button)`
  color: var(--color-black);
  padding: 0;
  span {
    padding: 0;
  }
`;

const StyledBoldButton = styled(StyledButton)`
  font-family: var(--tilavaraus-admin-font-bold);
  margin-left: auto;
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

const Unit = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(true);
  const [unit, setUnit] = useState<UnitWIP>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasOpeningHours, setOpeningHours] = useState(true);
  const [hasSpacesResources, setSpacesResources] = useState(true);
  const [hasReservationUnits, setReservationUnits] = useState(true);

  const { t } = useTranslation();
  const { unitId } = useParams<IProps>();
  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const result = await getUnit(Number(unitId));
        setUnit(result);
        setOpeningHours(Boolean(result.openingHours.length));
        setSpacesResources(
          Boolean(result.resources.length || result.spaces.length)
        );
        setReservationUnits(Boolean(result.reservationUnits));
      } catch (error) {
        setErrorMsg("errors.errorFetchingData");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnit();
  }, [unitId]);

  const { setModalContent } = useModal();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev route="/units" />
        <Links>
          <SecondaryNavigation items={[]} />
          <BasicLink to={`/unit/${unitId}/map`}>
            <IconMap style={{ marginTop: "-2px" }} /> {t("Unit.showOnMap")}
          </BasicLink>
          <BasicLink to={`/unit/${unitId}/openingHours`}>
            <IconClock style={{ marginTop: "-2px" }} />{" "}
            {t("Unit.showOpeningHours")}
          </BasicLink>
          <BasicLink to={`/unit/${unitId}/spacesAndResources`}>
            {t("Unit.showSpacesAndResources")}
          </BasicLink>
          <BasicLink to={`/unit/${unitId}/configuration`}>
            {t("Unit.showConfiguration")}
          </BasicLink>
        </Links>
      </ContentContainer>
      <IngressContainer>
        <Ingress>
          <Image src="https://tilavaraus.hel.fi/v1/media/reservation_unit_images/liikumistila2.jfif.250x250_q85_crop.jpg" />
          <div>
            <Name>{unit?.name}</Name>
            <Address>Katuosoite 13, 00234 Helsinki</Address>
            <Props>
              <Prop $disabled={!unit?.area}>
                <IconGlobe /> {unit?.area || t("Unit.noArea")}
              </Prop>
              <Prop $disabled={!unit?.service}>
                <IconLocate /> {unit?.service || t("Unit.noService")}
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
            <BasicLink to="/create">{t("Unit.createSpaces")}</BasicLink>
          </StyledNotification>
        ) : null}
        {!hasOpeningHours ? (
          <StyledNotification
            type="alert"
            label={t("Unit.noOpeningHoursTitle")}
            size="large"
          >
            {t("Unit.noOpeningHours")}{" "}
            <ExternalLink to="https://palvelukartta.hel.fi/fi/">
              {t("Unit.maintainOpeningHours")}
            </ExternalLink>
          </StyledNotification>
        ) : null}
        <HeadingLarge>{t("Unit.reservationUnitTitle")}</HeadingLarge>
        <Info>
          <StyledButton
            variant="supplementary"
            iconRight={<IconInfoCircleFill />}
            onClick={() =>
              setModalContent && setModalContent(<InfoModalContent />)
            }
          >
            {t("Unit.reservationUnitReadMore")}
          </StyledButton>
          <StyledBoldButton
            variant="supplementary"
            iconLeft={<IconPlusCircleFill />}
          >
            {t("Unit.reservationUnitCreate")}
          </StyledBoldButton>
        </Info>
      </IngressContainer>
      <ContentContainer>
        <ReservationUnits>
          {hasReservationUnits ? (
            "todo lista varausyksiköitä"
          ) : (
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
          )}
        </ReservationUnits>
      </ContentContainer>
      {errorMsg && (
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
        >
          {t(errorMsg)}
        </Notification>
      )}
    </Wrapper>
  );
};

export default withMainMenu(Unit);
