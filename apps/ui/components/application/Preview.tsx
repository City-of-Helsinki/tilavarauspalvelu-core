import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { ApplicationNode, TermsOfUseType } from "common/types/gql-types";
import { useFormContext } from "react-hook-form";
import { MediumButton } from "@/styles/util";
import { ButtonContainer } from "../common/common";
import type { ApplicationFormValues } from "./Form";
import { ViewInner } from "./ViewInner";

type Props = {
  application: ApplicationNode;
  // This only checks that the user accepts the terms of use, no form data modifications is done here
  onNext: (values: ApplicationFormValues) => void;
  tos: TermsOfUseType[];
};

// TODO this is so similar to View, why isn't it reused?
// of course this would use form context and view would use a query instead
const Preview = ({ onNext, application, tos }: Props): JSX.Element | null => {
  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { t } = useTranslation();

  const form = useFormContext<ApplicationFormValues>();
  const { handleSubmit } = form;

  const onSubmit = (values: ApplicationFormValues): void => {
    onNext(values);
  };

  // FIXME there are missing fields applicant stuff (name, type, address)
  // homecity is not set in the form
  // applicantType is not set
  // name etc. are odd? (the test case I'm using has empty organisation, but also both contact person and billing address)
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <ViewInner
        tos={tos}
        allReservationUnits={
          application.applicationRound.reservationUnits ?? []
        }
        acceptTermsOfUse={acceptTermsOfUse}
        setAcceptTermsOfUse={setAcceptTermsOfUse}
        />
      <ButtonContainer>
        <MediumButton
          variant="secondary"
          onClick={() => router.push(`${application.pk}/page3`)}
        >
          {t("common:prev")}
        </MediumButton>
        <MediumButton
          id="submit"
          type="submit"
          disabled={!acceptTermsOfUse}
        >
          {t("common:submit")}
        </MediumButton>
      </ButtonContainer>
    </form>
  );
};

export { Preview };
