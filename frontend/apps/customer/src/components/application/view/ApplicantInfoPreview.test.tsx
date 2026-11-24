import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ReserveeType } from "@gql/gql-types";
import { createMockApplicationViewFragment } from "@test/application.mocks";
import { ApplicantInfoPreview } from "./ApplicantInfoPreview";

function customRender({
  applicantType,
  additionalInformation,
}: {
  applicantType: ReserveeType;
  additionalInformation: string;
}): ReturnType<typeof render> {
  const application = {
    ...createMockApplicationViewFragment({ page: "page3" }),
    applicantType,
    additionalInformation,
  };
  return render(<ApplicantInfoPreview application={application} isSportsForm={false} />);
}

describe("ApplicantInfoPreview", () => {
  test("shows the additional information of a private person", () => {
    customRender({ applicantType: ReserveeType.Individual, additionalInformation: "Harrastetoiminta" });
    expect(screen.getByRole("heading", { name: "application:preview.additionalInformation" })).toBeInTheDocument();
    expect(screen.getByText("Harrastetoiminta")).toBeInTheDocument();
  });

  test("hides the additional information when it is empty", () => {
    customRender({ applicantType: ReserveeType.Individual, additionalInformation: "" });
    expect(screen.queryByRole("heading", { name: "application:preview.additionalInformation" })).toBeNull();
  });

  test("shows the company name and business ID labels for a company", () => {
    customRender({ applicantType: ReserveeType.Company, additionalInformation: "" });
    expect(screen.getByRole("heading", { name: "application:preview.organisation.companyName" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "application:preview.organisation.registrationNumber" })
    ).toBeInTheDocument();
  });

  test("shows the organisation name and registration number labels for a nonprofit", () => {
    customRender({ applicantType: ReserveeType.Nonprofit, additionalInformation: "" });
    expect(screen.getByRole("heading", { name: "application:preview.organisation.name" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "application:preview.organisation.nonprofitRegistrationNumber" })
    ).toBeInTheDocument();
  });

  test("hides the additional information of an organisation", () => {
    customRender({ applicantType: ReserveeType.Nonprofit, additionalInformation: "Harrastetoiminta" });
    expect(screen.queryByText("Harrastetoiminta")).toBeNull();
  });
});
