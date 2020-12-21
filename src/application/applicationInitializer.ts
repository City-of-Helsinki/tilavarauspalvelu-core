import { Application, ApplicationEvent } from '../common/types';

export const emptyApplicationEvent = (
  applicationId: number
): ApplicationEvent => ({
  name: 'Vakiovuoro 1.',
  minDuration: 1,
  maxDuration: 1,
  eventsPerWeek: 1,
  numPersons: null,
  ageGroupId: null,
  purposeId: null,
  abilityGroupId: null,
  applicationId: applicationId || 0,
  begin: '',
  end: '',
  biweekly: false,
  eventReservationUnits: [],
  applicationEventSchedules: [],
});

export const minimalApplicationForInitialSave = (
  applicationPeriodId: number
): Application => ({
  status: 'draft',
  applicationPeriodId,
  organisation: null,
  applicationEvents: [],
  contactPerson: null,
});

const applicationInitializer = ({
  id,
  applicationPeriodId,
}: Application): Application => {
  if (!id) {
    return {
      ...minimalApplicationForInitialSave(applicationPeriodId),
      applicationEvents: [emptyApplicationEvent(0)],
    };
  }
  return {} as Application;
};

export default applicationInitializer;
