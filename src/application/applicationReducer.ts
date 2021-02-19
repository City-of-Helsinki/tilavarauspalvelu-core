import i18next from 'i18next';
import { Action, Application, ApplicationEvent } from '../common/types';

const applicationEvent = (applicationId?: number): ApplicationEvent => ({
  name: i18next.t('Application.Page1.applicationEventName'),
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
  status: 'created',
});

const reducer = (state: Application, action: Action): Application => {
  switch (action.type) {
    case 'addNewApplicationEvent': {
      const nextState = { ...state };
      nextState.applicationEvents.push(applicationEvent(state.id));
      return nextState;
    }
    case 'load': {
      const application = { ...action.data } as Application;
      if (application.applicationEvents.length === 0) {
        // new application add event to edit
        application.applicationEvents = [applicationEvent(application.id)];
      }
      return application;
    }

    default:
      throw new Error(action.type);
  }
};

export default reducer;
