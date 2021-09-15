import {
  Button,
  IconCheck,
  IconGroup,
  IconInfoCircle,
  IconLocation,
  IconPlus,
} from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import router from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { useMedia } from "react-use";
import { reservationUnitPath } from "../../modules/const";
import useReservationUnitsList from "../../hooks/useReservationUnitList";
import { breakpoint } from "../../modules/style";
import { ReservationUnit } from "../../modules/types";
import { getAddress, getMainImage, localizedValue } from "../../modules/util";
import IconWithText from "../common/IconWithText";
import Carousel from "../Carousel";

type PropsType = {
  units: ReservationUnit[];
  reservationUnitList?: ReturnType<typeof useReservationUnitsList>;
  viewType: "recurring" | "single";
};

const Wrapper = styled.div`
  margin: 0 var(--spacing-s);

  @media (min-width: ${breakpoint.m}) {
    margin: 0;
  }
`;

const StyledCarousel = styled(Carousel)`
  .slider-list {
    cursor: default !important;
  }
`;

const Content = styled.div`
  padding: var(--spacing-s);
`;

const Unit = styled.div`
  background-color: var(--color-white);
`;

const Name = styled.div`
  &:hover {
    opacity: 0.5;
  }
  cursor: pointer;
  font-family: var(--font-bold);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
`;

const Image = styled.img`
  margin-top: var(--spacing-s);
  width: 100%;
  height: 205px;
  object-fit: cover;
`;

const Building = styled.div`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-m);
  margin: var(--spacing-3-xs) 0 var(--spacing-xs);
`;

const Props = styled.div`
  font-size: var(--fontsize-body-m);
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 0;
`;

const SpanTwoColumns = styled.span`
  grid-column-start: 1;
  grid-column-end: 3;

  @media (max-width: ${breakpoint.m}) {
    grid-column-start: 1;
    grid-column-end: 2;
  }
`;

const StyledIconWithText = styled(IconWithText)`
  margin-top: var(--spacing-xs);
`;

const Buttons = styled.div`
  margin-top: var(--spacing-m);
  font-size: var(--fontsize-body-m);

  button {
    margin: 0;
  }
`;

const RelatedUnits = ({
  units,
  reservationUnitList,
  viewType,
}: PropsType): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoint.m})`, false);
  const isWideMobile = useMedia(`(max-width: ${breakpoint.l})`, false);

  if (units.length === 0) {
    return null;
  }
  return (
    <Wrapper>
      <StyledCarousel
        slidesToShow={isMobile ? 1 : isWideMobile ? 2 : 3}
        slidesToScroll={isMobile ? 1 : isWideMobile ? 2 : 3}
        wrapAround={false}
        hideCenterControls
        cellSpacing={24}
      >
        {units.map((unit) => (
          <Unit key={unit.id}>
            <Image
              src={getMainImage(unit)?.imageUrl}
              image-alt={unit.name}
              style={{ marginTop: 0 }}
            />
            <Content>
              <Link href={reservationUnitPath(unit.id)} passHref>
                <Name>{localizedValue(unit.name, i18n.language)}</Name>
              </Link>
              <Building>{unit.building.name}</Building>
              <Props>
                <StyledIconWithText
                  icon={
                    <IconInfoCircle
                      aria-label={t("reservationUnitCard:type")}
                    />
                  }
                  text={localizedValue(
                    unit.reservationUnitType?.name,
                    i18n.language
                  )}
                />
                {unit.maxPersons ? (
                  <StyledIconWithText
                    icon={
                      <IconGroup
                        aria-label={t("reservationUnitCard:maxPersons", {
                          maxPersons: unit.maxPersons,
                        })}
                      />
                    }
                    text={`${unit.maxPersons}`}
                  />
                ) : (
                  <span />
                )}
                {getAddress(unit) ? (
                  <SpanTwoColumns>
                    <StyledIconWithText
                      icon={
                        <IconLocation
                          aria-label={t("reservationUnitCard:address")}
                        />
                      }
                      text={getAddress(unit) as string}
                    />
                  </SpanTwoColumns>
                ) : (
                  <StyledIconWithText icon={<span />} text="&nbsp;" />
                )}
              </Props>
              {viewType === "recurring" && (
                <Buttons>
                  {reservationUnitList?.containsReservationUnit(unit) ? (
                    <Button
                      onClick={() =>
                        reservationUnitList.removeReservationUnit(unit)
                      }
                      iconLeft={<IconCheck />}
                      className="margin-left-xs margin-top-s"
                    >
                      {t("common:reservationUnitSelected")}
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        reservationUnitList.selectReservationUnit(unit)
                      }
                      iconLeft={<IconPlus />}
                      className="margin-left-s margin-top-s"
                      variant="secondary"
                    >
                      {t("common:selectReservationUnit")}
                    </Button>
                  )}
                </Buttons>
              )}
              {viewType === "single" && (
                <Buttons>
                  <Button
                    style={{ width: "100%" }}
                    onClick={() => router.push(reservationUnitPath(unit.id))}
                    className="margin-left-xs margin-top-s"
                    variant="secondary"
                  >
                    {t("common:seeDetails")}
                  </Button>
                </Buttons>
              )}
            </Content>
          </Unit>
        ))}
      </StyledCarousel>
    </Wrapper>
  );
};

export default RelatedUnits;
