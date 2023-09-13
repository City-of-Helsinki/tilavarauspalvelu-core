import * as React from "react";

import { DATE_TYPES } from "../../../modules/const";
import { render } from "../../../test/testUtils";
import DateSelectorMenu from "../DateSelectorMenu";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("next-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

test("matches snapshot", () => {
  const { container } = render(
    <DateSelectorMenu
      dateTypes={["type1", "type2"]}
      dateTypeOptions={[
        DATE_TYPES.TODAY,
        DATE_TYPES.TOMORROW,
        DATE_TYPES.THIS_WEEK,
        DATE_TYPES.WEEKEND,
      ]}
      endDate={new Date("2019-09-31")}
      isCustomDate={false}
      isOpen
      name="date"
      onChangeDateTypes={jest.fn()}
      onChangeEndDate={jest.fn()}
      onChangeStartDate={jest.fn()}
      onCloseMenu={jest.fn()}
      startDate={new Date("2019-08-01")}
      toggleIsCustomDate={jest.fn()}
    />
  );

  expect(container.firstChild).toMatchSnapshot();
});
