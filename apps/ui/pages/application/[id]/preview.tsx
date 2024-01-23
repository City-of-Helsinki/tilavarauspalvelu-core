import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useMutation } from "@apollo/client";
import type {
  Mutation,
  MutationSendApplicationArgs,
  QueryTermsOfUseArgs,
  Query,
  TermsOfUseType,
} from "common/types/gql-types";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Error from "next/error";
import { filterNonNullable } from "common/src/helpers";
import { SEND_APPLICATION_MUTATION } from "@/modules/queries/application";
import { MediumButton } from "@/styles/util";
import { ButtonContainer, CenterSpinner } from "@/components/common/common";
import { ViewInner } from "@/components/application/ViewInner";
import { TERMS_OF_USE } from "@/modules/queries/reservationUnit";
import { createApolloClient } from "@/modules/apolloClient";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { useApplicationQuery } from "@/hooks/useApplicationQuery";
import { ErrorToast } from "@/components/common/ErrorToast";
import { getCommonServerSideProps } from "@/modules/serverUtils";

// User has to accept the terms of service then on submit we change the application status
// This uses separate Send mutation (not update) so no onNext like the other pages
// we could also remove the FormContext here
const Preview = (props: {
  id: number | null;
  tos: TermsOfUseType[];
}): JSX.Element | null => {
  const { id, tos } = props;

  const { application, error, isLoading } = useApplicationQuery(
    id ?? undefined
  );

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { t } = useTranslation();

  const [send, { error: mutationError, loading: isMutationLoading }] =
    useMutation<Mutation, MutationSendApplicationArgs>(
      SEND_APPLICATION_MUTATION
    );

  const onSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!acceptTermsOfUse) {
      return;
    }
    if (!id) {
      // eslint-disable-next-line no-console
      console.error("no pk in values");
      return;
    }
    const { data, errors } = await send({
      variables: {
        input: {
          pk: id,
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

  if (id == null) {
    return <Error statusCode={404} />;
  }
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return <Error statusCode={500} />;
  }
  if (isLoading) {
    return <CenterSpinner />;
  }

  if (application == null) {
    return <Error statusCode={404} />;
  }

  return (
    <ApplicationPageWrapper
      translationKeyPrefix="application:preview"
      application={application}
    >
      {mutationError && <ErrorToast error={t("common:error.mutationError")} />}
      <form onSubmit={onSubmit}>
        <ViewInner
          application={application}
          tos={tos}
          acceptTermsOfUse={acceptTermsOfUse}
          setAcceptTermsOfUse={setAcceptTermsOfUse}
        />
        <ButtonContainer>
          <MediumButton
            variant="secondary"
            onClick={() => router.push(`/application/${application.pk}/page3`)}
          >
            {t("common:prev")}
          </MediumButton>
          <MediumButton
            id="submit"
            type="submit"
            disabled={!acceptTermsOfUse}
            isLoading={isMutationLoading}
          >
            {t("common:submit")}
          </MediumButton>
        </ButtonContainer>
      </form>
    </ApplicationPageWrapper>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale } = ctx;

  const apolloClient = createApolloClient(ctx);
  const { data: tosData } = await apolloClient.query<
    Query,
    QueryTermsOfUseArgs
  >({
    query: TERMS_OF_USE,
  });

  const tos = filterNonNullable(
    tosData?.termsOfUse?.edges?.map((e) => e?.node)
  ).filter((n) => n?.pk === "KUVAnupa" || n?.pk === "booking");

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { id } = query;
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = Number.isNaN(Number(pkstring)) ? null : Number(pkstring);

  return {
    props: {
      ...getCommonServerSideProps(),
      key: locale,
      id: pk,
      tos,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

export default Preview;
