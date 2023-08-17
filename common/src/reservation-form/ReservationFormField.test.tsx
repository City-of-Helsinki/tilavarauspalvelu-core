import { render, within } from "@testing-library/react";
import React from "react";
import user from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import ReservationFormField from "./ReservationFormField";
import { Inputs, Reservation } from "./types";
import { OptionType } from "../../types/common";

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const formMethods = useForm<Reservation>();

  return <FormProvider {...formMethods}>{children}</FormProvider>;
};

/* options are gotten from GraphQL so some mock data */
const options: Record<string, OptionType[]> = {
  purpose: [
    { value: "purple", label: "Purpose" },
    { value: "not", label: "Not a thing" },
  ],
  ageGroup: [
    { value: 1, label: "1-9" },
    { value: 2, label: "10-" },
  ],
  homeCity: [
    { value: 1, label: "Helsinki" },
    { value: 2, label: "Muu" },
  ],
};

const WrappedComponent = ({
  field,
  required,
  translationKey,
  params,
  data,
  reservationData = {
    name: "",
    pk: 1,
    begin: "",
    end: "",
    reservationUnitPks: [1],
  },
  defaultValues = {},
}: {
  field: keyof Inputs;
  required?: boolean;
  params?: Record<string, Record<string, string | number>>;
  translationKey?: "COMMON";
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
  reservationData?: Reservation;
  defaultValues?: Record<string, string | number>;
}) => (
  <Wrapper>
    <ReservationFormField
      // key={`key-${field}`}
      field={field}
      options={options}
      required={required ?? false}
      translationKey={translationKey}
      reservation={{ ...reservationData, ...defaultValues }}
      params={params}
      data={data}
    />
  </Wrapper>
);

// describe("Text fields", () => {
// Text fields
test("Renders required text field", async () => {
  const fieldName = "name";
  const view = render(<WrappedComponent field={fieldName} required />);

  const label = RegExp(`reservationApplication:label.individual.${fieldName}`);
  const input = await view.findByLabelText(label);
  expect(input).toBeInTheDocument();
  expect(input).toBeRequired();
  expect(input).toHaveValue("");
  input.focus();
  await user.keyboard("foobar");
  expect(input).toHaveValue("foobar");
});

// TODO description (textArea) but doesn it make a difference
test("Renders non required text field", async () => {
  const fieldName = "description";
  const view = render(<WrappedComponent field={fieldName} />);

  const input = await view.findByLabelText(
    `reservationApplication:label.individual.${fieldName}`
  );
  expect(input).toBeInTheDocument();
  expect(input).not.toBeRequired();
  expect(input).toHaveValue("");
  input.focus();
  await user.keyboard("foobar");
  expect(input).toHaveValue("foobar");
});

// Not testing all the text fields
// would be nice to enforce that all :string data => TextInput or TextArea
// but unit tests are not the right place for that

/* email fields: reserveeEmail, billingEmail
TODO This requires rework because errors are only checked on submit (not on blur),
they also are shown to the user using notifyError not in the form itself unlike both
ReservationForm and RecurringReservationForm erros.
Testing before rework is silly.
Also passing the validator here would be better than coupling it with the
field name so we can decouple the testing of the validator vs. the display component.
*/
test.todo("reserveeEmail only allows emails or it's an error");
test.todo("billingEmail only allows emails or it's an error");

test("ReserveeType changes translation namespaces", async () => {
  const fieldName = "name";
  const view = render(
    <WrappedComponent field={fieldName} required translationKey="COMMON" />
  );

  const label = RegExp(`reservationApplication:label.common.${fieldName}`);
  const input = await view.findByLabelText(label);

  expect(input).toBeInTheDocument();
  expect(input).toBeRequired();
  expect(input).toHaveValue("");
});

test("Render NumberField for numPersons", async () => {
  const view = render(<WrappedComponent field="numPersons" />);

  const input = await view.findByLabelText(/numPersons/, { selector: "input" });
  expect(input).toBeInTheDocument();
  expect(input).toHaveValue(null);
  input.focus();
  await user.keyboard("foobar");
  expect(input).toHaveValue(null);

  await user.keyboard("10");
  expect(input).toHaveValue(10);
});

test("numPersons min and max", async () => {
  const view = render(
    <WrappedComponent
      field="numPersons"
      params={{ numPersons: { min: 0, max: 10 } }}
    />
  );

  const input = await view.findByLabelText(/numPersons/, { selector: "input" });
  expect(input).toBeInTheDocument();
  expect(input).toHaveValue(null);

  const btn = await view.findByLabelText("common:decrease");
  expect(btn).toBeInTheDocument();

  input.focus();
  await user.keyboard("foobar");
  expect(input).toHaveValue(null);

  // value is only updated on decrease click... (not on increase or blur)
  await user.keyboard("15");
  expect(input).toHaveValue(15);
  await user.click(btn);
  expect(input).toHaveValue(10);
});

/* Selects are rendered, not testing functionality since it's HDS */
test("Renders non-required Select field", async () => {
  const fieldName = "purpose";
  const required = false;
  const label = `reservationApplication:label.individual.${fieldName}${
    required ? " *" : ""
  }`;

  const view = render(<WrappedComponent field={fieldName} required={false} />);

  // Find and click the button so the listbox is visible
  const btn = await view.findByLabelText(label, { selector: "button" });
  expect(btn).toBeInTheDocument();
  await user.click(btn);
  expect(btn).not.toBeRequired();

  const listbox = await view.findByLabelText(label, { selector: "ul" });

  expect(listbox).toBeInTheDocument();
  expect(await within(listbox).findByText(/purpose/i)).toBeInTheDocument();
  expect(await within(listbox).findByText(/not a thing/i)).toBeInTheDocument();
});

test("Renders required version of Select", async () => {
  const fieldName = "purpose";
  const required = true;
  const label = RegExp(`reservationApplication:label.individual.${fieldName}`);

  const view = render(
    <WrappedComponent field={fieldName} required={required} />
  );

  // Find and click the button so the listbox is visible
  const btn = await view.findByLabelText(label, { selector: "button" });
  expect(btn).toBeInTheDocument();
  await user.click(btn);

  const listbox = await view.findByLabelText(label, { selector: "ul" });

  expect(listbox).toBeInTheDocument();
  expect(await within(listbox).findByText(/purpose/i)).toBeInTheDocument();
  expect(await within(listbox).findByText(/not a thing/i)).toBeInTheDocument();
});

test("Renders select with a default value", async () => {
  const fieldName = "homeCity";
  const required = false;
  const label = `reservationApplication:label.individual.${fieldName}${
    required ? " *" : ""
  }`;

  const view = render(
    <WrappedComponent
      field={fieldName}
      required={required}
      defaultValues={{ homeCity: 2 }}
    />
  );

  // Find and click the button so the listbox is visible
  const btn = await view.findByLabelText(label, { selector: "button" });
  expect(btn).toBeInTheDocument();
  await user.click(btn);

  const listbox = await view.findByLabelText(label, { selector: "ul" });
  const selectedOption = listbox.querySelector("li[aria-selected='true']");

  expect(selectedOption).toBeInTheDocument();
});

// Required checkbox makes no sense at all so not testing it
test("Renders a checkbox for reserveeIsUnregisteredAssociation", async () => {
  const checkfields = [
    "applyingForFreeOfCharge",
    "reserveeIsUnregisteredAssociation",
    "showBillingAddress",
  ] as const;
  checkfields.forEach(async (x) => {
    const view = render(<WrappedComponent field={x} />);

    // Find and click the button so the listbox is visible
    const btn = await view.findByLabelText(RegExp(x));
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeChecked();
    await user.click(btn);
    expect(btn).toBeChecked();
  });
});

test("free of charge shows termsForDiscount component", async () => {
  const fieldName = "applyingForFreeOfCharge";
  const view = render(
    <WrappedComponent
      field={fieldName}
      data={{
        termsForDiscount: <div>Dummy</div>,
      }}
    />
  );

  const check = await view.findByLabelText(RegExp(fieldName));
  expect(check).toBeInTheDocument();
  expect(check).not.toBeChecked();
  await user.click(check);
  expect(check).toBeChecked();
  const terms = await view.findByText(/dummy/i);
  expect(terms).toBeInTheDocument();
});
