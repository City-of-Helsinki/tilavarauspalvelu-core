import i18next from "i18next";
import { Application, ApplicationEvent } from "common/types/common";
import { defaultDuration } from "../const";
import { deepCopy } from "../util";

// TODO this is only used for the ApplicationEditor in UI
export type Action = {
  type:
    | "load"
    | "addNewApplicationEvent"
    | "save"
    | "toggleAccordionState"
    | "removeApplicationEvent";
  application?: Application;
  savedEventId?: number;
  eventId?: number;
  params?: { [key: string]: string };
};

// TODO this is badly named and should be in the UI only (reducer)
export type EditorState = {
  loading: boolean;
  application: Application;
  savedEventId?: number;
  accordionStates: AccordionState[];
};

export type AccordionState = {
  applicationEventId: number | null; // null is used for non saved event
  open: boolean;
};

const applicationEvent = (
  applicationId?: number,
  begin?: string,
  end?: string
): ApplicationEvent => ({
  name: i18next.t("Application.Page1.applicationEventName"),
  minDuration: defaultDuration,
  maxDuration: defaultDuration,
  eventsPerWeek: 1,
  numPersons: null,
  ageGroupId: null,
  purposeId: null,
  abilityGroupId: null,
  applicationId: applicationId || 0,
  begin: begin || null,
  end: end || null,
  biweekly: false,
  eventReservationUnits: [],
  applicationEventSchedules: [],
  status: "created",
});

const reducer = (state: EditorState, action: Action): EditorState => {
  switch (action.type) {
    case "addNewApplicationEvent": {
      const nextState = { ...state, savedEventId: -1 };
      nextState.application.applicationEvents.push(
        applicationEvent(
          state.application.id,
          action?.params?.begin,
          action?.params?.end
        )
      );
      nextState.accordionStates = nextState.application.applicationEvents.map(
        (ae) => ({
          applicationEventId: ae.id as number,
          open: !ae.id,
        })
      );
      return nextState;
    }
    case "removeApplicationEvent": {
      const { eventId } = action;
      const nextState = { ...state, savedEventId: -1 };
      nextState.application.applicationEvents =
        nextState.application.applicationEvents.filter(
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
    case "load": {
      const nextState = {
        ...state,
        application: { ...(action.application as Application) },
        loading: false,
      };

      if (nextState.application.applicationEvents?.length < 1) {
        nextState.application.applicationEvents.push(
          applicationEvent(
            action.application?.id,
            action?.params?.begin,
            action?.params?.end
          )
        );

        if (!nextState.application.applicationEvents[0].applicationId) {
          throw new Error("Illegal state, application id not set");
        }
      }

      nextState.accordionStates =
        action.application?.applicationEvents.map((ae, _i, arr) => ({
          applicationEventId: ae.id as number,
          open: arr.length === 1, // auto open if only 1 event
        })) || ([] as AccordionState[]);

      return nextState;
    }
    case "save": {
      if (!action.application) {
        return state;
      }
      const editedApplication = deepCopy(action.application);
      editedApplication?.applicationEvents.sort((ae1, ae2) => (ae1.id ?? 0) - (ae2.id ?? 0));

      const nextState = {
        ...state,
        application: editedApplication,
        savedEventId: action.savedEventId,
        accordionStates:
          action.application?.applicationEvents.map((ae) => ({
            applicationEventId: ae.id as number,
            open: false,
          })) || ([] as AccordionState[]),
      };
      return nextState;
    }

    case "toggleAccordionState": {
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
