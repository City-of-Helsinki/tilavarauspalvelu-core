import { Action, Application, ContactPerson } from '../common/types';

const applicationEvent = (applicationId?: number) => ({
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

const reducer = (state: Application, action: Action): Application => {
  switch (action.type) {
    case 'ensureContactPersonExists': {
      const nextState = { ...state };
      if (nextState.contactPerson == null) {
        nextState.contactPerson = {} as ContactPerson;
      }
      return nextState;
    }
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
