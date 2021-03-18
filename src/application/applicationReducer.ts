import i18next from 'i18next';
import {
  AccordionState,
  Action,
  Application,
  ApplicationEvent,
  EditorState,
} from '../common/types';

const applicationEvent = (applicationId?: number): ApplicationEvent => ({
  name: i18next.t('Application.Page1.applicationEventName'),
  minDuration: '00:01:00',
  maxDuration: '00:01:00',
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

const reducer = (state: EditorState, action: Action): EditorState => {
  switch (action.type) {
    case 'addNewApplicationEvent': {
      const nextState = { ...state, savedEventId: -1 };
      nextState.application.applicationEvents.push(
        applicationEvent(state.application.id)
      );
      nextState.accordionStates = nextState.application.applicationEvents.map(
        (ae) => ({
          applicationEventId: ae.id as number,
          open: !ae.id,
        })
      );
      return nextState;
    }
    case 'load': {
      const nextState = {
        ...state,
        application: action.application as Application,
        loading: false,
        accordionStates:
          action.application?.applicationEvents.map((ae) => ({
            applicationEventId: ae.id as number,
            open: false,
          })) || ([] as AccordionState[]),
      };
      return nextState;
    }
    case 'save': {
      const nextState = {
        ...state,
        application: { ...action.application } as Application,
        savedEventId: action.savedEventId,
        accordionStates:
          action.application?.applicationEvents.map((ae) => ({
            applicationEventId: ae.id as number,
            open: false,
          })) || ([] as AccordionState[]),
      };
      return nextState;
    }

    case 'toggleAccordionState': {
      const nextState = {
        ...state,
        accordionStates: [
          ...state.accordionStates.filter(
            (accordionState) =>
              accordionState.applicationEventId !== action.eventId
          ),
        ].concat([
          ...state.accordionStates
            .filter(
              (accordionState) =>
                accordionState.applicationEventId === action.eventId
            )
            .map((accordionState) => ({
              ...accordionState,
              open: !accordionState.open,
            })),
        ]),
      };

      return nextState;
    }

    default:
      throw new Error(action.type);
  }
};

export default reducer;
