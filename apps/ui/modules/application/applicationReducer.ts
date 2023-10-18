import i18next from "i18next";
import { Application, ApplicationEvent } from "common/types/common";
import { defaultDuration } from "../const";
import { deepCopy } from "../util";

// TODO remove load / save states from the reducer (use query / mutation state instead)
// TODO don't modify the Application directly, add sepearate ApplicationEvents (the full type, not just the id)
export type Action = {
  type:
    | "load"
    | "addNewApplicationEvent"
    | "save"
    | "removeApplicationEvent";
  application?: Application;
  savedEventId?: number;
  eventId?: number;
  params?: { [key: string]: string };
};

// TODO this is badly named and should be in the UI only (reducer)
type EditorState = {
  loading: boolean;
  application: Application;
  savedEventId?: number;
  applicationEvents: number[];
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
      nextState.applicationEvents = nextState.application.applicationEvents.map((ae) => ae.id as number)
      return nextState;
    }
    case "removeApplicationEvent": {
      const { eventId } = action;
      const nextState = { ...state, savedEventId: -1 };
      nextState.application.applicationEvents =
        nextState.application.applicationEvents.filter(
          (ae) => ae.id !== eventId
        );
      nextState.applicationEvents = nextState.application.applicationEvents.map((ae) => ae.id as number);
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

      nextState.applicationEvents =
        action.application?.applicationEvents.map((ae, _i) => ae.id as number) ?? []

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
        applicationEvents: action.application?.applicationEvents.map((ae) => ae.id as number)
      };
      return nextState;
    }

    default:
      throw new Error(action.type);
  }
};

export default reducer;
