import React from "react";
import styled from "styled-components";
import { Applicant_Type } from "common/types/gql-types";
import { useFormContext } from "react-hook-form";
import { CompanyForm } from "./CompanyForm";
import { IndividualForm } from "./IndividualForm";
import { OrganisationForm } from "./OrganisationForm";
import { ApplicantTypeSelector } from "./ApplicantTypeSelector";
import { useOptions } from "@/hooks/useOptions";
import { ApplicationFormValues } from "./Form";
import Buttons from "./Buttons";

type Props = {
  onNext: (appToSave: ApplicationFormValues) => void;
};

const Form = styled.form`
  margin-bottom: var(--spacing-layout-l);
  padding-bottom: var(--spacing-l);
`;

/// TODO this isn't validated when saving
/// make a separate schema for it? and maybe even a separate form?
const Page3 = (): JSX.Element | null => {
  const { options } = useOptions();
  const { cityOptions } = options;

  const { watch } = useFormContext<ApplicationFormValues>();

  const type = watch("applicantType");

  switch (type) {
    case Applicant_Type.Individual:
      return <IndividualForm />;
    case Applicant_Type.Community:
    case Applicant_Type.Association:
      return <OrganisationForm homeCityOptions={cityOptions} />;
    case Applicant_Type.Company:
      return <CompanyForm />;
    default:
      return null;
  }
};

const Page3Wrapped = (props: Props): JSX.Element => {
  const { onNext } = props;
  const { handleSubmit, watch } = useFormContext<ApplicationFormValues>();
  const applicationPk = watch("pk");
  return (
    <Form noValidate onSubmit={handleSubmit(onNext)}>
      <ApplicantTypeSelector />
      <Page3 />
      {applicationPk && <Buttons applicationId={applicationPk} />}
    </Form>
  );
};

export default Page3Wrapped;
