import { Action, Application, ContactPerson } from '../common/types';

const reducer = (state: Application, action: Action): Application => {
  switch (action.type) {
    case 'ensureContactPersonExists': {
      const nextState = { ...state };
      if (nextState.contactPerson == null) {
        nextState.contactPerson = {} as ContactPerson;
      }
      return nextState;
    }
    case 'load': {
      const application = { ...action.data } as Application;
      if (application.applicationEvents.length === 0) {
        // new application add event to edit
        application.applicationEvents = [
          {
            name: 'Vakiovuoro 1.',
            minDuration: 1,
            maxDuration: 1,
            eventsPerWeek: 1,
            numPersons: null,
            ageGroupId: null,
            purposeId: null,
            abilityGroupId: null,
            applicationId: application.id || 0,
            begin: '',
            end: '',
            biweekly: false,
            eventReservationUnits: [],
            applicationEventSchedules: [],
          },
        ];
      }
      return application;
    }

    default:
      throw new Error(action.type);
  }
};

export default reducer;
