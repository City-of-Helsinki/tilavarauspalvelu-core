import { addDays, getISODay, isBefore } from 'date-fns';
import {
  Button,
  Card as HDSCard,
  IconCalendar,
  IconHome,
  IconInfoCircle,
  IconLocation,
  IconMenuHamburger,
  IconDownload,
  Select,
} from 'hds-react';
import { TFunction } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import {
  getApplication,
  getApplicationRound,
  getRecurringReservations,
} from '../common/api';
import { ApiData, useApiData } from '../common/hook/useApiData';
import { breakpoint } from '../common/style';
import {
  Application,
  ApplicationEvent,
  OptionType,
  RecurringReservation,
  Reservation,
  ReservationUnit,
} from '../common/types';
import { endOfWeek, getAddress, parseDate, startOfWeek } from '../common/util';
import Back from '../component/Back';
import { HorisontalRule, TwoColumnContainer } from '../component/common';
import Loader from '../component/Loader';
import ReservationCalendar from './ReservationCalendar';
import ReservationList from './ReservationList';

const Container = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  height: 100%;
  @media (max-width: ${breakpoint.m}) {
    padding: var(--spacing-s);
  }
`;

const RoundName = styled.div`
  font-size: var(--fontsize-heading-xl);
  font-family: var(--font-bold);
  @media (max-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-l);
  }
`;

const SubHeading = styled.div`
  margin-top: var(--spacing-xs);
  font-size: var(--fontsize-heading-l);
  font-family: var(--font-bold);
  @media (max-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

const ResolutionDescription = styled.div`
  margin-top: var(--spacing-s);
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
`;

const Applicant = styled.div`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-s);
`;

const Modified = styled.div`
  font-size: var(--fontsize-body-m);
  font-family: var(--font-regular);
`;

const Card = styled(HDSCard)`
  margin-top: var(--spacing-layout-m);
  @media (max-width: ${breakpoint.m}) {
    padding: var(--spacing-s);
  }
`;

const TwoColLayout = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-gap: var(--spacing-layout-xs);
  grid-template-columns: var(--spacing-layout-m) 1fr;
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: var(--spacing-layout-xs) 1fr;
  }
`;

const Actions = styled.div`
  display: grid;
  align-items: end;
  grid-gap: var(--spacing-layout-xs);
  grid-template-columns: 1fr 10rem;
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }
`;

const CalendarContainer = styled.div`
  @media (max-width: ${breakpoint.s}) {
    overflow-x: scroll;
    > div {
      width: 30em;
    }
  }
`;

const ReservationUnitName = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;
const ContactInfo = styled.div``;

const BuildingName = styled.div`
  font-size: var(--fontsize-heading-s);
  font-family: var(--font-bold);
`;

const AddressLine = styled.div`
  font-size: var(--fontsize-body-m);
`;
const Buttons = styled.div`
  justify-self: end;
`;
const ToggleButton = styled(Button)`
  margin-top: var(--spacing-m);
`;

type ParamTypes = {
  applicationId: string;
};

const getApplicant = (application: Application, t: TFunction): string => {
  if (application?.organisation) {
    return t('ApplicationCard.organisation', {
      type: t(`ApplicationCard.applicantType.${application.applicantType}`),
      name: application.organisation?.name || t('ApplicationCard.noName'),
    });
  }
  if (application?.contactPerson) {
    return t('ApplicationCard.person');
  }

  return '';
};

const longDate = (date: Date, t: TFunction): string =>
  t('common.dateLong', {
    date,
  });

export const getWeekOption = (date: Date, t: TFunction): OptionType => {
  const begin = startOfWeek(date);
  const end = endOfWeek(date);
  const monthName = t(`common.month.${begin.getMonth()}`);
  return {
    label: `${monthName} ${longDate(begin, t)} - ${longDate(end, t)} `,
    value: begin.getTime(),
  };
};

const getWeekOptions = (
  t: TFunction,
  applicationEvent: ApplicationEvent
): OptionType[] => {
  const { begin, end } = applicationEvent;
  const beginDate = parseDate(begin as string);
  const endDate = parseDate(end as string);
  const endSunday = addDays(endDate, getISODay(endDate));
  let date = beginDate;
  const options = [] as OptionType[];
  while (isBefore(date, endSunday)) {
    options.push(getWeekOption(date, t));
    date = addDays(date, 7);
  }
  return options;
};

const displayDate = (date: Date, t: TFunction): string => {
  const weekday = t(`common.weekDay.${date.getDay()}`);
  return `${weekday} ${longDate(date, t)}`;
};

const getWeekEvents = (
  weekBegin: Date,
  weekEnd: Date,
  reservations?: RecurringReservation[]
) =>
  reservations
    ?.flatMap((rr) => rr.reservations)
    .filter((r) => {
      const begin = parseDate(r.begin).getTime();
      const end = parseDate(r.end).getTime();
      return (
        begin > weekBegin.getTime() &&
        begin < weekEnd.getTime() &&
        end > weekBegin.getTime() &&
        end < weekEnd.getTime()
      );
    }) || [];

const modified = (
  application: ApiData<Application, unknown>,
  t: TFunction
): JSX.Element => {
  return (
    <Modified>
      {application.data?.lastModifiedDate
        ? t('ApplicationCard.saved', {
            date: parseDate(application.data?.lastModifiedDate),
          })
        : ''}
    </Modified>
  );
};

const Reservations = (): JSX.Element | null => {
  const { applicationId } = useParams<ParamTypes>();
  const [isCalendar, setIsCalendar] = useState(true);
  const [status, setStatus] = useState<'init' | 'loading' | 'done' | 'error'>(
    'init'
  );

  const { t } = useTranslation();

  const application = useApiData(getApplication, Number(applicationId));

  const applicationRound = useApiData(
    getApplicationRound,
    application.data ? { id: application.data.applicationRoundId } : undefined
  );

  const reservations = useApiData(
    getRecurringReservations,
    Number(applicationId)
  );

  const [week, setWeek] = useState(getWeekOption(new Date(), t));

  const startDate = new Date(week.value as number);
  const endDate = endOfWeek(startDate);

  const weekEvents = getWeekEvents(startDate, endDate, reservations.data);

  const keys = [] as ReservationUnit[];
  const resUnitEvents = weekEvents.reduce((prev, reservation) => {
    reservation.reservationUnit.forEach((resUnit) => {
      let key = keys.find((k) => k.id === resUnit.id);
      if (!key) {
        keys.push(resUnit);
        key = resUnit;
      }

      const resUnitArray = prev.get(key);
      if (resUnitArray) {
        resUnitArray.push(reservation);
      } else {
        prev.set(key, [reservation]);
      }
    });

    return prev;
  }, new Map<ReservationUnit, Reservation[]>());

  const reservationsResultText =
    reservations.data &&
    t(
      reservations.data?.length > 0
        ? 'Reservations.resultWithReservations'
        : 'Reservations.resultWithoutReservations'
    );

  return (
    <Container>
      <Back label="Reservations.back" />
      <Loader datas={[application, applicationRound, reservations]}>
        {reservations.data?.length === 0 ? (
          <span> no reservations</span>
        ) : (
          <>
            <RoundName>{applicationRound.data?.name}</RoundName>
            <Applicant>
              {getApplicant(application.data as Application, t)}
            </Applicant>
            {modified(application, t)}
            <TwoColumnContainer>
              <div>
                <SubHeading>{t('Reservations.titleResolution')}</SubHeading>
                <ResolutionDescription>
                  {reservationsResultText}
                </ResolutionDescription>

                <ToggleButton
                  theme="black"
                  variant="secondary"
                  iconLeft={<IconDownload />}
                  isLoading={status === 'loading'}
                  loadingText={t('Reservations.generating')}
                  onClick={() => {
                    setStatus('loading');
                    setTimeout(() => {
                      import('../pdf/util').then(({ download }) => {
                        download(
                          application.data as Application,
                          reservations.data as RecurringReservation[],
                          applicationRound.data?.approvedBy || null,
                          setStatus
                        );
                      });
                    }, 0);
                  }}>
                  {t('Reservations.download')}
                </ToggleButton>
              </div>
              <Buttons>
                <ToggleButton
                  theme="black"
                  aria-pressed={isCalendar}
                  variant={(isCalendar && 'secondary') || 'primary'}
                  iconLeft={<IconMenuHamburger />}
                  onClick={() => setIsCalendar(false)}>
                  {t('Reservations.showList')}
                </ToggleButton>
                <ToggleButton
                  theme="black"
                  variant={(isCalendar && 'primary') || 'secondary'}
                  aria-pressed={!isCalendar}
                  onClick={() => setIsCalendar(true)}
                  iconLeft={<IconCalendar />}>
                  {t('Reservations.showCalendar')}
                </ToggleButton>
              </Buttons>
            </TwoColumnContainer>

            <HorisontalRule />
            {application.data?.applicationEvents.map((event) => (
              <div key={event.id}>
                <SubHeading>{event.name}</SubHeading>
                {isCalendar ? (
                  <Card border>
                    {event.eventReservationUnits.map((eru) => (
                      <div key={eru.reservationUnitId}>
                        <Actions>
                          <Select
                            label={t('Reservations.weekSelectLabel')}
                            multiselect={false}
                            icon={<IconCalendar />}
                            options={getWeekOptions(t, event)}
                            value={week}
                            onChange={(w) => {
                              setWeek(w);
                            }}
                          />
                          <Button
                            id="b"
                            variant="secondary"
                            onClick={() => {
                              setWeek(getWeekOption(new Date(), t));
                            }}>
                            {t('common.today')}
                          </Button>
                        </Actions>

                        <TwoColLayout>
                          <IconCalendar />
                          <div>
                            {displayDate(startDate, t)} -{' '}
                            {displayDate(endDate, t)}
                          </div>
                          {weekEvents.map((reservation) => {
                            const begin = parseDate(reservation.begin);
                            const end = parseDate(reservation.end);
                            return (
                              <>
                                <div>
                                  {t(`common.weekDay.${begin.getDay()}`)}
                                </div>
                                <div>
                                  {' '}
                                  {t('common.time', {
                                    date: begin,
                                  })}{' '}
                                  - {t('common.time', { date: end })}
                                </div>
                              </>
                            );
                          })}
                        </TwoColLayout>
                        {Array.from(resUnitEvents.entries()).map(
                          ([reservationUnit, resUnitReservations]) => {
                            return (
                              <>
                                <HorisontalRule />
                                <TwoColLayout>
                                  <IconHome />
                                  <ReservationUnitName>
                                    {reservationUnit.name.fi}
                                  </ReservationUnitName>
                                  <IconInfoCircle />
                                  <ContactInfo>
                                    {reservationUnit.contactInformation}
                                    TODO contact info from API
                                  </ContactInfo>
                                  <IconLocation />
                                  <div>
                                    <BuildingName>
                                      {reservationUnit.building?.name}
                                    </BuildingName>
                                    <AddressLine>
                                      {getAddress(reservationUnit)}
                                    </AddressLine>
                                  </div>
                                </TwoColLayout>
                                <HorisontalRule />
                                <CalendarContainer>
                                  <div>
                                    <ReservationCalendar
                                      begin={new Date(week.value as number)}
                                      reservations={resUnitReservations}
                                      reservationUnit={reservationUnit}
                                      applicationEvent={event}
                                    />
                                  </div>
                                </CalendarContainer>
                              </>
                            );
                          }
                        )}
                      </div>
                    ))}
                  </Card>
                ) : (
                  <ReservationList
                    reservations={reservations.data?.flatMap(
                      (rr) => rr.reservations
                    )}
                  />
                )}
              </div>
            ))}
          </>
        )}
      </Loader>
    </Container>
  );
};

export default Reservations;
