import {
  createApplicationSearchGraphQLMocks,
  type CreateGraphQLMockProps,
  generateNameFragment,
} from "@/test/test.gql.utils";
import { render, within } from "@testing-library/react";
import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { ReservationUnitList } from "./ReservationUnitList";
import {
  type ApplicationReservationUnitListFragment,
  ImageType,
} from "@/gql/gql-types";
import { base64encode } from "common/src/helpers";
import { MockedGraphQLProvider } from "@/test/test.react.utils";
import { type SubmitHandler, useForm } from "react-hook-form";
import userEvent from "@testing-library/user-event";

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return {
    useSearchParams: params,
    mockedSearchParams: params,
  };
});

const { useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query: "",
    }),
    mockedRouterReplace,
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams,
}));

vi.mock("next/router", () => ({
  useRouter,
}));

beforeEach(() => {
  const params = new URLSearchParams();
  params.set("modalShown", false.toString());
  mockedSearchParams.mockReturnValue(params);
});

afterEach(() => {
  vi.clearAllMocks();
});

interface CustomRenderProps extends CreateGraphQLMockProps {
  nReservationUnits?: number;
  onSubmit?: (values: FormValues) => void;
}

function customRender({
  nReservationUnits = 1,
  onSubmit = vi.fn(),
  ...mockProps
}: CustomRenderProps): ReturnType<typeof render> {
  const mocks = createApplicationSearchGraphQLMocks(mockProps);
  const values: FormValues["reservationUnits"] = Array.from({
    length: nReservationUnits,
  }).map((_, i) => i + 1);
  const applicationRound: ApplicationReservationUnitListFragment = {
    id: base64encode("ApplicationRound:1"),
    pk: 1,
    ...generateNameFragment("ApplicationRound 1"),
    reservationUnits: values.map((i) => ({
      id: base64encode(`ReservationUnit:${i}`),
      pk: i,
      minPersons: 1,
      maxPersons: null,
      ...generateNameFragment(`Reservation Unit ${i}`),
      unit: {
        id: base64encode("Unit:1"),
        pk: 1,
        ...generateNameFragment("Unit 1"),
      },
      images: [
        {
          id: base64encode("Image:1"),
          imageUrl: "https://example.com/image1.jpg",
          largeUrl: "https://example.com/image1_large.jpg",
          mediumUrl: "https://example.com/image1_medium.jpg",
          smallUrl: "https://example.com/image1_small.jpg",
          imageType: ImageType.Main,
        } as const,
      ],
    })),
  } as const;

  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <WrappedRender
        values={values}
        applicationRound={applicationRound}
        nReservationUnitOptions={nReservationUnits}
        onSubmit={onSubmit}
      />
    </MockedGraphQLProvider>
  );
}

type FormValues = {
  reservationUnits: Array<number>;
};

function WrappedRender({
  values = [],
  nReservationUnitOptions,
  onSubmit,
  ...props
}: {
  values?: FormValues["reservationUnits"];
  nReservationUnitOptions: number;
  onSubmit: SubmitHandler<FormValues>;
  applicationRound: ApplicationReservationUnitListFragment;
}): JSX.Element {
  const options = {
    unitOptions: [],
    equipmentsOptions: [],
    purposeOptions: [],
    reservationUnitTypeOptions: [],
  } as const;

  const form = useForm<FormValues>({
    values: {
      reservationUnits: values,
    },
  });
  const { handleSubmit, control } = form;
  // NOTE required to bridge react-hook-form and vitest mock fn
  // otherwise we get html in the mock fn call
  const onSubmitWrapper = (data: FormValues) => {
    onSubmit(data);
  };
  return (
    <form noValidate onSubmit={handleSubmit(onSubmitWrapper)}>
      <ReservationUnitList
        {...props}
        options={options}
        control={control}
        name="reservationUnits"
      />
      <button type="submit">Submit</button>
    </form>
  );
}

// These tests can be written without opening the modal
// by mocking the initial form data
describe("reservation unit list render", () => {
  test("sanity", () => {
    const view = customRender({});
    expect(view.container).toBeDefined();
  });

  test("should always have an info notification", () => {
    const view = customRender({});
    // HDS notification double labels
    const notis = view.getAllByText("reservationUnitList:infoReservationUnits");
    expect(notis.length).toBe(2);
  });

  // add reservation unit button (opens a modal)
  test.todo("empty should have an add reservation unit button");
  test.todo("should have an add reservation unit button");

  test("should render one reservation unit card", () => {
    const view = customRender({});
    const delBtn = view.getByRole("button", {
      name: "reservationUnitList:buttonRemove",
    });
    expect(delBtn).not.toBeDisabled();
    const cardHeading = view.getByRole("heading", {
      name: "Reservation Unit 1 FI",
    });
    expect(cardHeading).toBeInTheDocument();

    const cardText = view.getByText("Unit 1 FI");
    expect(cardText).toBeInTheDocument();
  });

  // list of reservation units (ordered, with order buttons)
  // TODO cards should have correct order with number labels
  test("render multiple reservation unit cards", () => {
    const view = customRender({ nReservationUnits: 3 });

    const delBtns = view.getAllByRole("button", {
      name: "reservationUnitList:buttonRemove",
    });
    expect(delBtns.length).toBe(3);
    const cardHeadings = view.getAllByRole("heading", {
      name: /Reservation Unit \d+ FI/,
    });
    expect(cardHeadings.length).toBe(3);

    const cardTexts = view.getAllByText(/^Unit \d+ FI/);
    expect(cardTexts.length).toBe(3);
  });

  // error notifications
  // single error message if the list is empty durring submit
  test.todo("empty should show no reservation units error message");
  // per reservation unit cards
  // case: run a for loop with
  // - no min size
  // - min size 10
  // - min size 2
  // expect value is a list of card pks to show error messages in
  // (need to wrap the error message inside the Card component)
  test.todo("should show too small space error message");
});

describe("up / down buttons", () => {
  test("should be disabled if only one unit is selected", () => {
    const view = customRender({});

    const cardUpBtns = view.getAllByRole("button", {
      name: "reservationUnitList:buttonUp",
    });
    expect(cardUpBtns.length).toBe(1);
    expect(cardUpBtns[0]).toBeDisabled();

    const cardDownBtns = view.getAllByRole("button", {
      name: "reservationUnitList:buttonDown",
    });
    expect(cardDownBtns.length).toBe(1);
    expect(cardDownBtns[0]).toBeDisabled();
  });

  test("should be enabled for the middle unit", () => {
    const view = customRender({ nReservationUnits: 3 });
    const card = view.getByTestId(
      "ReservationUnitList__ordered-reservation-unit-card-2"
    );

    const upBtn = within(card).getByRole("button", {
      name: "reservationUnitList:buttonUp",
    });
    expect(upBtn).not.toBeDisabled();

    const downBtn = within(card).getByRole("button", {
      name: "reservationUnitList:buttonDown",
    });
    expect(downBtn).not.toBeDisabled();
  });

  test("move sanity check", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ nReservationUnits: 3, onSubmit });

    const submitBtn = view.getByRole("button", { name: "Submit" });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledWith({
      reservationUnits: [1, 2, 3],
    });
  });

  test("should move reservation unit up", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ nReservationUnits: 3, onSubmit });
    const card = view.getByTestId(
      "ReservationUnitList__ordered-reservation-unit-card-2"
    );

    const upBtn = within(card).getByRole("button", {
      name: "reservationUnitList:buttonUp",
    });
    expect(upBtn).not.toBeDisabled();
    await user.click(upBtn);

    const submitBtn = view.getByRole("button", { name: "Submit" });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledWith({
      reservationUnits: [2, 1, 3],
    });
  });

  test.todo("up button should be disabled when first unit is selected");
  test.todo("should move reservation unit down");
  test.todo("down button should be disabled when last unit is selected");
});

describe("Application: reservation unit list modal integration", () => {
  test.todo("should open modal");
  test.todo("should close modal");
  test.todo("should add reservation unit");
  test.todo("should remove reservation unit");
});
