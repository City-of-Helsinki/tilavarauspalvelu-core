import React from "react";
import styled from "styled-components";
import {
  IconArrowRight,
  IconLocate,
  IconGlobe,
  IconLink,
  IconLocation,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { H2 } from "../../styles/typography";
import { BasicLink, breakpoints } from "../../styles/util";
import { parseAddress } from "../../common/util";
import { UnitType } from "../../common/gql-types";

interface IProps {
  unit: UnitType;
}

const Wrapper = styled.div`
  background-color: var(--color-black-5);
  display: grid;
  margin-bottom: var(--spacing-2-xs);

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 213px auto;
  }
`;

const LocationBox = styled.div`
  display: none;

  @media (min-width: ${breakpoints.l}) {
    background-color: var(--color-silver);
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      transform: scale(1.4);
    }
  }
`;

const Content = styled.div`
  padding: var(--spacing-m) var(--spacing-l);

  ${H2} {
    margin: 0;
  }
`;

const Address = styled.div`
  margin: var(--spacing-xs) 0 var(--spacing-l);
`;

const Props = styled.div`
  @media (min-width: ${breakpoints.s}) {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--spacing-m);
  }

  @media (min-width: ${breakpoints.xl}) {
    width: 80%;
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

const UnitCard = ({ unit }: IProps): JSX.Element => {
  const { t } = useTranslation();

  const reservationUnitCount = unit.reservationUnits?.length || 0;

  return (
    <Wrapper>
      <LocationBox>
        <IconLocation size="m" />
      </LocationBox>
      <Content>
        <BasicLink to={`/unit/${unit.pk}`}>
          <H2>{unit.name}</H2>
          <IconArrowRight />
        </BasicLink>
        {unit.location ? (
          <Address>{parseAddress(unit.location)}</Address>
        ) : null}
        <Props>
          <Prop $disabled={reservationUnitCount < 1}>
            <IconLink />{" "}
            {t(
              reservationUnitCount > 0
                ? "Unit.reservationUnits"
                : "Unit.noReservationUnits",
              { count: reservationUnitCount }
            )}
          </Prop>
          <Prop $disabled>
            <IconGlobe />
            {t("Unit.noArea")}
          </Prop>
          <Prop $disabled>
            <IconLocate />
            {t("Unit.noService")}
          </Prop>
        </Props>
      </Content>
    </Wrapper>
  );
};

export default UnitCard;
