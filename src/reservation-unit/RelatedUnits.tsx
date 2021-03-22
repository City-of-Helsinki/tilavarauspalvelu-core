import {
  Button,
  IconCheck,
  IconGroup,
  IconInfoCircle,
  IconLocation,
  IconPlus,
} from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { reservationUnitPath } from '../common/const';
import useReservationUnitsList from '../common/hook/useReservationUnitList';
import { breakpoint } from '../common/style';
import { ReservationUnit } from '../common/types';
import { getAddress, getMainImage, localizedValue } from '../common/util';
import IconWithText from './IconWithText';

type Props = {
  units: ReservationUnit[];
  reservationUnitList: ReturnType<typeof useReservationUnitsList>;
};

const Heading = styled.div`
  margin-top: var(--spacing-s);
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const Content = styled.div`
  margin-left: var(--spacing-s);
`;

const Unit = styled.div``;
const Name = styled.div`
  font-family: var(--font-bold);
`;

const Image = styled.img`
  margin-top: var(--spacing-s);
  width: 100%;
  height: 205px;
  object-fit: cover;
`;

const Building = styled.div`
  font-size: var(--fontsize-body-m);
`;

const Grid = styled.div`
  margin-top: var(--spacing-layout-s);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-s);
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;

    margin-top: 0;
  }
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
const Buttons = styled.div`
  margin-top: var(--spacing-m);
  font-size: var(--fontsize-body-m);
`;

const RelatedUnits = ({
  units,
  reservationUnitList,
}: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();

  const {
    selectReservationUnit,
    containsReservationUnit,
    removeReservationUnit,
  } = reservationUnitList;

  if (units.length === 0) {
    return null;
  }
  return (
    <>
      <Heading>{t('ReservationUnit.RelatedUnits.heading')}</Heading>
      <Grid>
        {units.slice(0, 3).map((unit) => (
          <Unit key={unit.id}>
            <Image src={getMainImage(unit)?.imageUrl} />
            <Content>
              <Link to={reservationUnitPath(unit.id)}>
                <Name>{localizedValue(unit.name, i18n.language)}</Name>
              </Link>
              <Building>{unit.building.name}</Building>
              <Props>
                <IconWithText
                  icon={
                    <IconInfoCircle aria-label={t('reservationUnit.type')} />
                  }
                  text={localizedValue(
                    unit.reservationUnitType?.name,
                    i18n.language
                  )}
                />
                {unit.maxPersons ? (
                  <IconWithText
                    icon={
                      <IconGroup aria-label={t('reservationUnit.maxPersons')} />
                    }
                    text={`${unit.maxPersons}`}
                  />
                ) : (
                  <span />
                )}
                {getAddress(unit) ? (
                  <SpanTwoColumns>
                    <IconWithText
                      icon={
                        <IconLocation aria-label={t('reservationUnit.type')} />
                      }
                      text={getAddress(unit) as string}
                    />
                  </SpanTwoColumns>
                ) : (
                  <IconWithText icon={<span />} text="&nbsp;" />
                )}
              </Props>
            </Content>
            <Buttons>
              {containsReservationUnit(unit) ? (
                <Button
                  onClick={() => removeReservationUnit(unit)}
                  iconLeft={<IconCheck />}
                  className="margin-left-s margin-top-s">
                  {t('common.reservationUnitSelected')}
                </Button>
              ) : (
                <Button
                  onClick={() => selectReservationUnit(unit)}
                  iconLeft={<IconPlus />}
                  className="margin-left-s margin-top-s"
                  variant="secondary">
                  {t('common.selectReservationUnit')}
                </Button>
              )}
            </Buttons>
          </Unit>
        ))}
      </Grid>
    </>
  );
};

export default RelatedUnits;
