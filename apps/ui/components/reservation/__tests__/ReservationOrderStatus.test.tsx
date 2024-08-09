import * as React from "react";
import { get as mockGet } from "lodash";
import { render, screen } from "../../../test/testUtils";
import { ReservationOrderStatus, type Props } from "../ReservationOrderStatus";
import mockTranslations from "../../../public/locales/fi/reservations.json";
import { OrderStatus } from "@/gql/gql-types";

// TODO use a proper mocking solution in setup
jest.mock("next-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string, params?: Record<string, string | number>) => {
        const path = str.replace("reservations:", "");
        const key =
          // @ts-expect-error -- TODO replace with mocks
          mockGet(mockTranslations, `${path}_other`) && params?.count > 1
            ? `${path}_other`
            : path;
        return mockGet(mockTranslations, key)?.replace(
          /{{(.*?)}}/g,
          // @ts-expect-error -- TODO replace with mocks
          (val, paramKey) => (params[paramKey] ? params[paramKey] : val)
        );
      },
    };
  },
}));

function renderComponent(props: Props) {
  return render(<ReservationOrderStatus {...props} />);
}

const VALS = [
  { status: OrderStatus.Draft, label: "Odottaa maksua" },
  { status: OrderStatus.Paid, label: "Maksettu" },
  { status: OrderStatus.PaidManually, label: "Paikan päällä" },
  { status: OrderStatus.Cancelled, label: "Peruttu" },
  { status: OrderStatus.Expired, label: "Maksamatta" },
  { status: OrderStatus.Refunded, label: "Hyvitetty" },
];

for (const state of VALS) {
  test(`should render ${state.status}`, () => {
    renderComponent({ orderStatus: state.status });

    expect(screen.getByText(state.label)).toHaveAttribute("title", state.label);
  });
}
