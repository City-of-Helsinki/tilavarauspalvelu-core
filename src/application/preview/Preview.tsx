import React, { useEffect, useState } from 'react';
import { Button, Checkbox, IconArrowLeft, Notification } from 'hds-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Application, ReservationUnit, Parameter } from '../../common/types';
import {
  deepCopy,
  formatDate,
  formatDuration,
  localizedValue,
} from '../../common/util';
import { getParameters, getReservationUnit } from '../../common/api';
import LabelValue from '../../component/LabelValue';
import TimePreview from '../TimePreview';
import ApplicantInfoPreview from './ApplicantInfoPreview';
import { TwoColumnContainer } from '../../component/common';
import { AccordionWithState as Accordion } from '../../component/Accordion';

type Props = {
  application: Application;
  onNext: (application: Application) => void;
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
const BuildingName = styled.div`
  font-family: var(--font-regular);
`;

const UnitName = styled.div`
  font-family: var(--font-bold);
`;

const Ruler = styled.hr`
  margin-top: var(--spacing-layout-m);
  border-left: none;
  border-right: none;
`;

const SmallSubHeadline = styled.div`
  font-family: var(--font-bold);
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
`;

const TimePreviewContainer = styled(TwoColumnContainer)`
  svg {
    margin-top: 2px;
  }
`;

const CheckboxContainer = styled.div`
  margin-top: var(--spacing-layout-l);
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
  const [reservationUnits, setReservationUnits] = useState<{
    [key: number]: ReservationUnit;
  }>({});

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      const reservationUnitIds = Array.from(
        new Set(
          application.applicationEvents.flatMap(
            (ae) => ae.eventReservationUnits
          )
        )
      );

      const fetchedReservationUnits = await Promise.all(
        reservationUnitIds.map((ru) => getReservationUnit(ru.reservationUnitId))
      );

      if (mounted) {
        setReservationUnits(
          mapArrayById(fetchedReservationUnits) as {
            [key: number]: ReservationUnit;
          }
        );
      }

      const fetchedAgeGroupOptions = await getParameters('age_group');
      if (mounted) {
        setAgeGroupOptions(mapArrayById(fetchedAgeGroupOptions));
      }
      const fetchedPurposeOptions = await getParameters('purpose');
      if (mounted) {
        setPurposeOptions(mapArrayById(fetchedPurposeOptions));
        setReady(true);
      }
    }
    fetchData();

    return () => {
      mounted = false;
    };
  }, [application]);

  const { t } = useTranslation();

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(data);
    applicationCopy.status = 'in_review';
    return applicationCopy;
  };

  const onSubmit = (data: Application): void => {
    const appToSave = prepareData(data);
    onNext(appToSave);
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
      <Accordion
        open
        id="basicInfo"
        heading={t('Application.preview.basicInfoSubHeading')}>
        <ApplicantInfoPreview application={application} />
      </Accordion>
      {application.applicationEvents.map((applicationEvent, i) => (
        <Accordion
          open
          id={`applicationEvent-${i}`}
          key={applicationEvent.id}
          heading={applicationEvent.name || ''}>
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
              value={
                applicationEvent.ageGroupId
                  ? `${
                      ageGroupOptions[applicationEvent.ageGroupId].minimum
                    } - ${ageGroupOptions[applicationEvent.ageGroupId].maximum}`
                  : ''
              }
            />{' '}
            <LabelValue
              label={t('Application.preview.applicationEvent.purpose')}
              value={
                applicationEvent.purposeId != null
                  ? localizedValue(
                      purposeOptions[applicationEvent.purposeId].name,
                      i18n.language
                    )
                  : ''
              }
            />{' '}
            <LabelValue
              label={t('Application.preview.applicationEvent.begin')}
              value={formatDate(applicationEvent.begin || '')}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.end')}
              value={formatDate(applicationEvent.end || '')}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.minDuration')}
              value={formatDuration(applicationEvent.minDuration as string)}
            />
            <LabelValue
              label={t('Application.preview.applicationEvent.maxDuration')}
              value={formatDuration(applicationEvent.maxDuration as string)}
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
                  key={reservationUnit.reservationUnitId}
                  label={t(
                    'Application.preview.applicationEvent.reservationUnit',
                    { order: index + 1 }
                  )}
                  value={[
                    <UnitName>
                      {localizedValue(
                        reservationUnits[reservationUnit.reservationUnitId]
                          .name,
                        i18n.language
                      )}
                    </UnitName>,
                    <BuildingName>
                      {localizedValue(
                        reservationUnits[reservationUnit.reservationUnitId]
                          .building.name,
                        i18n.language
                      )}
                    </BuildingName>,
                  ]}
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
        </Accordion>
      ))}
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

      <ButtonContainer>
        <Button variant="secondary" iconLeft={<IconArrowLeft />} disabled>
          {t('common.prev')}
        </Button>
        <Button
          id="submit"
          onClick={() => {
            onSubmit(application);
          }}
          disabled={!acceptTermsOfUse}>
          {t('common.submit')}
        </Button>
      </ButtonContainer>
    </>
  ) : null;
};

export default Preview;
