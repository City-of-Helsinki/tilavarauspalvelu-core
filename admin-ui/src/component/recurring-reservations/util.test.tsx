import {
  Application,
  ApplicationRound,
  TranslationObject,
  Unit,
} from "../../common/types";
import { appMapper } from "./util";

test("Units are ordered according to priority", async () => {
  const mappedApp = appMapper(
    {} as ApplicationRound,
    {
      applicationEvents: [
        {
          eventReservationUnits: [
            {
              priority: 1,
              reservationUnitDetails: {
                unit: {
                  id: 100,
                  name: { fi: "unit 100" } as TranslationObject,
                },
              },
            },
            {
              priority: 0,
              reservationUnitDetails: {
                unit: {
                  id: 200,
                  name: { fi: "unit 200" } as TranslationObject,
                } as Unit,
              },
            },
          ],
        },
      ],
    } as Application,
    (str: string) => str
  );

  expect(mappedApp.units[0].name.fi).toBe("unit 200");
  expect(mappedApp.units[1].name.fi).toBe("unit 100");
});
