import i18next from 'i18next';
import { defaultDuration } from '../common/const';
import {
  AccordionState,
  Action,
  Application,
  ApplicationEvent,
  EditorState,
} from '../common/types';

const applicationEvent = (applicationId?: number): ApplicationEvent => ({
  name: i18next.t('Application.Page1.applicationEventName'),
  minDuration: defaultDuration,
  maxDuration: defaultDuration,
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
    case 'removeApplicationEvent': {
      const { eventId } = action;
      const nextState = { ...state, savedEventId: -1 };
      nextState.application.applicationEvents = nextState.application.applicationEvents.filter(
        (ae) => ae.id !== eventId
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
        application: { ...(action.application as Application) },
        loading: false,
      };

      if (nextState.application.applicationEvents?.length < 1) {
        nextState.application.applicationEvents.push(
          applicationEvent(action.application?.id)
        );

        if (!nextState.application.applicationEvents[0].applicationId) {
          throw new Error('Illegal state, application id not set');
        }
      }

      nextState.accordionStates =
        action.application?.applicationEvents.map((ae, i, arr) => ({
          applicationEventId: ae.id as number,
          open: arr.length === 1, // auto open if only 1 event
        })) || ([] as AccordionState[]);

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
