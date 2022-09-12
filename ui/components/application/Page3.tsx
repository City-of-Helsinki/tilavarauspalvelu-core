import { useQuery } from "@apollo/client";
import { sortBy } from "lodash";
import React, { useState } from "react";
import styled from "styled-components";
import {
  Application,
  Application as ApplicationType,
  FormType,
  OptionType,
} from "common/types/common";
import { Query } from "../../modules/gql-types";
import { CITIES } from "../../modules/queries/params";
import { getTranslation, mapOptions } from "../../modules/util";
import { CenterSpinner } from "../common/common";
import CompanyForm from "./CompanyForm";
import IndividualForm from "./IndividualForm";
import OrganisationForm from "./OrganisationForm";
import RadioButtons from "./RadioButtons";

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

  const [homeCityOptions, setHomeCityOptions] = useState([] as OptionType[]);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  useQuery<Query>(CITIES, {
    onCompleted: (res) => {
      const cities = res?.cities?.edges?.map(({ node }) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      }));
      setHomeCityOptions(mapOptions(sortBy(cities, "id")));
      setState("done");
    },
    onError: () => {
      setState("error");
    },
  });

  return state !== "loading" ? (
    <Wrapper>
      <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm}>
        {null}
      </RadioButtons>
      {activeForm === "individual" ? (
        <IndividualForm application={application} onNext={onNext} />
      ) : null}
      {activeForm === "organisation" ? (
        <OrganisationForm
          homeCityOptions={homeCityOptions}
          application={application}
          onNext={onNext}
        />
      ) : null}
      {activeForm === "company" ? (
        <CompanyForm application={application} onNext={onNext} />
      ) : null}
    </Wrapper>
  ) : (
    <CenterSpinner />
  );
};

export default Page3;
