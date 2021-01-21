import { Button, Checkbox, IconArrowLeft, Notification } from 'hds-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Application, ReservationUnit, Parameter } from '../../common/types';
import { formatDate } from '../../common/util';
import { getParameters, getReservationUnits } from '../../common/api';
import LabelValue from '../../component/LabelValue';
import TimePreview from '../TimePreview';

type Props = {
  application: Application;
  onNext: () => void;
};

const mapArrayById = (
  array: { id: number }[]
): { [key: number]: { id: number } } => {
  return array.reduce((prev, current) => {
    // eslint-disable-next-line no-param-reassign
    prev[current.id] = current;
    return prev;
  }, {} as { [key: number]: Parameter | ReservationUnit });
};

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: var(--spacing-layout-l);
  justify-content: flex-end;

  button {
    margin-left: var(--spacing-layout-xs);
  }
`;

const Ruler = styled.hr`
  margin-top: var(--spacing-layout-m);
  border-left: none;
  border-right: none;
`;

const SubHeadline = styled.div`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const SmallSubHeadline = styled.div`
  font-family: HelsinkiGrotesk-Bold, var(--font-default);
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
`;

const TwoColumnContainer = styled.div`
  @media (max-width: var(--breakpoint-s)) {
    grid-template-columns: 1fr;
  }

  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-m);
`;

const TimePreviewContainer = styled(TwoColumnContainer)`
  svg {
    margin-top: 2px;
  }
`;

const CheckboxContainer = styled.div`
  margin-top: 60px;
  display: flex;
  align-items: center;
`;

const StyledNotification = styled(Notification)`
  line-height: var(--fontsize-heading-m);
  margin-top: var(--spacing-m);

  svg {
    position: relative;
    top: -2px;
  }
`;

const Preview = ({ onNext, application }: Props): JSX.Element | null => {
  const [ready, setReady] = useState(false);

  const [ageGroupOptions, setAgeGroupOptions] = useState<{
    [key: number]: Parameter;
  }>({});
  const [purposeOptions, setPurposeOptions] = useState<{
    [key: number]: Parameter;
  }>({});
  const [abilityGroupOptions, setAbilityGroupOptions] = useState<{
    [key: number]: Parameter;
  }>({});
  const [reservationUnits, setReservationUnits] = useState<{
    [key: number]: ReservationUnit;
  }>({});

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // there's no api to get reservation units with multiple ids so we're getting them all :)  a.k.a. FIXME
      const units = await getReservationUnits({ search: undefined });
      setReservationUnits(
        mapArrayById(units) as { [key: number]: ReservationUnit }
      );

      const fetchedAbilityGroupOptions = await getParameters('ability_group');
      setAbilityGroupOptions(mapArrayById(fetchedAbilityGroupOptions));
      const fetchedAgeGroupOptions = await getParameters('age_group');
      setAgeGroupOptions(mapArrayById(fetchedAgeGroupOptions));
      const fetchedPurposeOptions = await getParameters('purpose');
      setPurposeOptions(mapArrayById(fetchedPurposeOptions));
      setReady(true);
    }
    fetchData();
  }, []);

  const { t } = useTranslation();

  const onSubmit = () => {
    // eslint-disable-next-line no-param-reassign
    application.status = 'review';
    onNext();
  };

  // application not saved yet
  if (!application.id) {
    return (
      <>
        <h1>{t('Application.preview.noData.heading')}</h1>
        <Link to="page1">{t('Application.preview.noData.text')}</Link>
      </>
    );
  }

  return ready ? (
    <>
      <SubHeadline>{t('Application.preview.basicInfoSubHeading')}</SubHeadline>
      <TwoColumnContainer>
        <LabelValue
          label={t('Application.preview.firstName')}
          value={application.contactPerson?.firstName}
        />
        <LabelValue
          label={t('Application.preview.lastName')}
          value={application.contactPerson?.lastName}
        />
        <LabelValue
          label={t('Application.preview.email')}
          value={application.contactPerson?.email}
        />
      </TwoColumnContainer>
      {application.applicationEvents.map((applicationEvent) => (
        <div key={applicationEvent.id}>
          <SubHeadline>{applicationEvent.name}</SubHeadline>
          <TwoColumnContainer>
            <LabelValue
              label={t('Application.preview.applicationEvent.name')}
              value={applicationEvent.name}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.numPersons')}
              value={applicationEvent.numPersons}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.ageGroup')}
              value={`${
                ageGroupOptions[applicationEvent.ageGroupId || 0].minimum
              } - ${ageGroupOptions[applicationEvent.ageGroupId || 0].maximum}`}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.abilityGroup')}
              value={
                abilityGroupOptions[applicationEvent.abilityGroupId || 0].name
              }
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.purpose')}
              value={purposeOptions[applicationEvent.purposeId || 0].name}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.additionalInfo')}
              value=""
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.begin')}
              value={formatDate(applicationEvent.begin || '')}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.end')}
              value={formatDate(applicationEvent.end || '')}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.eventsPerWeek')}
              value={applicationEvent.eventsPerWeek}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.biweekly')}
              value={t(`common.${applicationEvent.biweekly}`) as string}
            />
            {applicationEvent.eventReservationUnits.map(
              (reservationUnit, index) => (
                <LabelValue
                  key={reservationUnit.reservationUnit}
                  label={t(
                    'Application.preview.applicationEvent.reservationUnit',
                    { order: index + 1 }
                  )}
                  value={reservationUnits[reservationUnit.reservationUnit].name}
                />
              )
            )}
          </TwoColumnContainer>
          <Ruler />
          <SmallSubHeadline>
            {t('Application.preview.applicationEventSchedules')}
          </SmallSubHeadline>
          <TimePreviewContainer>
            <TimePreview
              applicationEventSchedules={
                applicationEvent.applicationEventSchedules
              }
            />
          </TimePreviewContainer>
          <CheckboxContainer>
            <Checkbox
              id="preview.acceptTermsOfUse"
              checked={acceptTermsOfUse}
              onChange={(e) => setAcceptTermsOfUse(e.target.checked)}
            />
            <label htmlFor="preview.acceptTermsOfUse">
              {t('Application.preview.userAcceptsTerms')}
            </label>
          </CheckboxContainer>
          <StyledNotification
            label={t('Application.preview.notification.processing')}>
            {t('Application.preview.notification.body')}
          </StyledNotification>
        </div>
      ))}

      <ButtonContainer>
        <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
          {t('common.prev')}
        </Button>
        <Button onClick={() => onSubmit()} disabled={!acceptTermsOfUse}>
          {t('common.submit')}
        </Button>
      </ButtonContainer>
    </>
  ) : null;
};

export default Preview;
