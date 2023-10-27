import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useFormContext } from "react-hook-form";
import { useMutation } from "@apollo/client";
import type { ApplicationNode, Mutation, MutationSendApplicationArgs, TermsOfUseType } from "common/types/gql-types";
import { SEND_APPLICATION_MUTATION } from "@/modules/queries/application";
import { MediumButton } from "@/styles/util";
import { ButtonContainer } from "../common/common";
import type { ApplicationFormValues } from "./Form";
import { ViewInner } from "./ViewInner";

type Props = {
  application: ApplicationNode;
  tos: TermsOfUseType[];
};

// User has to accept the terms of service then on submit we change the application status
// This uses separate Send mutation (not update) so no onNext like the other pages
// we could also remove the FormContext here
// TODO refactor: no form context, and use file router instead of [...params].tsx
const Preview = ({ application, tos }: Props): JSX.Element | null => {
  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { t } = useTranslation();

  const form = useFormContext<ApplicationFormValues>();
  const { handleSubmit } = form;

  const [send] = useMutation<Mutation, MutationSendApplicationArgs>(SEND_APPLICATION_MUTATION);

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!acceptTermsOfUse) {
      return;
    }
    if (!values.pk) {
      // eslint-disable-next-line no-console
      console.error("no pk in values");
      return;
    }
    const { data, errors } = await send({
      variables: {
        input: {
          pk: values.pk,
        },
      },
    });
    if (errors) {
      // eslint-disable-next-line no-console
      console.error("error sending application", errors);
      // TODO show error
      return;
    }

    const { pk, errors: mutErrors } = data?.sendApplication ?? {};
    if (mutErrors) {
      // eslint-disable-next-line no-console
      console.error("error sending application", mutErrors);
      // TODO show error
      return;
    }

    const prefix = `/application/${pk}`;
    const target = `${prefix}/sent`;
    router.push(target);
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
