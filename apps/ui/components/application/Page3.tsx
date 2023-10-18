import React, { useState } from "react";
import styled from "styled-components";
import {
  Application,
  Application as ApplicationType,
  FormType,
} from "common/types/common";
import CompanyForm from "./CompanyForm";
import IndividualForm from "./IndividualForm";
import OrganisationForm from "./OrganisationForm";
import RadioButtons from "./RadioButtons";
import { useOptions } from "@/hooks/useOptions";

type Props = {
  application: ApplicationType;
  onNext: (appToSave: Application) => void;
};

const typeForm = {
  individual: "individual",
  company: "company",
  association: "organisation",
  community: "organisation",
};

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-l);
  padding-bottom: var(--spacing-l);
`;

const Page3 = ({ onNext, application }: Props): JSX.Element | null => {
  const [activeForm, setActiveForm] = useState(
    (application.applicantType
      ? typeForm[application.applicantType]
      : undefined) as FormType
  );

  const { options } = useOptions();
  const { cityOptions } = options;

  return (
    <Wrapper>
      <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm} />
      {activeForm === "individual" ? (
        <IndividualForm application={application} onNext={onNext} />
      ) : null}
      {activeForm === "organisation" ? (
        <OrganisationForm
          homeCityOptions={cityOptions}
          application={application}
          onNext={onNext}
        />
      ) : null}
      {activeForm === "company" ? (
        <CompanyForm application={application} onNext={onNext} />
      ) : null}
    </Wrapper>
  );
};

export default Page3;
