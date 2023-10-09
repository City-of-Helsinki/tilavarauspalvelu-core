import { useQuery } from "@apollo/client";
import { sortBy } from "lodash";
import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import {
  Application,
  Application as ApplicationType,
  FormType,
} from "common/types/common";
import { Query } from "common/types/gql-types";
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
  const { t } = useTranslation();
  const [activeForm, setActiveForm] = useState(
    (application.applicantType
      ? typeForm[application.applicantType]
      : undefined) as FormType
  );

  const { data, error, loading } = useQuery<Query>(CITIES);
  const cities =
    data?.cities?.edges
      ?.map((e) => e?.node)
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((node) => ({
        id: String(node.pk),
        name: getTranslation(node, "name"),
      })) ?? [];
  const homeCityOptions = mapOptions(sortBy(cities, "id"));

  if (error) {
    return <div>{t("common:errors.dataError")}</div>;
  }
  if (loading) {
    return <CenterSpinner />;
  }
  return (
    <Wrapper>
      <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm} />
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
  );
};

export default Page3;
