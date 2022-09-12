import {
  Application,
  ApplicationEvent,
  EditorState,
} from "common/types/common";
import reducer from "./applicationReducer";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

describe("applicationReducer", () => {
  test("same maintains applicationEventOrder", () => {
    const newState = reducer(
      {
        application: {
          applicationEvents: [] as ApplicationEvent[],
        } as Application,
      } as EditorState,
      {
        type: "save",
        application: {
          applicationEvents: [
            { id: 9 } as ApplicationEvent,
            { id: 2 } as ApplicationEvent,
            { id: 5 } as ApplicationEvent,
          ],
        } as Application,
      }
    );

    expect(newState.application.applicationEvents.length).toBe(3);

    expect(newState.application.applicationEvents[0].id).toBe(2);
    expect(newState.application.applicationEvents[1].id).toBe(5);
    expect(newState.application.applicationEvents[2].id).toBe(9);
  });
});
