import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useMutation } from "@apollo/client";
import type { Mutation, MutationSendApplicationArgs } from "@gql/gql-types";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Error from "next/error";
import { SEND_APPLICATION_MUTATION } from "@/modules/queries/application";
import { MediumButton } from "@/styles/util";
import { ButtonContainer, CenterSpinner } from "@/components/common/common";
import { ViewInner } from "@/components/application/ViewInner";
import { createApolloClient } from "@/modules/apolloClient";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { useApplicationQuery } from "@/hooks/useApplicationQuery";
import { ErrorToast } from "@/components/common/ErrorToast";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// User has to accept the terms of service then on submit we change the application status
// This uses separate Send mutation (not update) so no onNext like the other pages
// we could also remove the FormContext here
function Preview(props: PropsNarrowed): JSX.Element {
  const { pk, tos } = props;

  const { application, error, isLoading } = useApplicationQuery(
    pk ?? undefined
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
    if (!pk) {
      // eslint-disable-next-line no-console
      console.error("no pk in values");
      return;
    }
    const { data, errors } = await send({
      variables: {
        input: {
          pk,
        },
      },
    });
    if (errors) {
      // eslint-disable-next-line no-console
      console.error("error sending application", errors);
      // TODO show error
      return;
    }

    const { pk: resPk } = data?.sendApplication ?? {};

    if (resPk != null) {
      // TODO use an urlbuilder
      const prefix = `/application/${resPk}`;
      const target = `${prefix}/sent`;
      router.push(target);
    }
    // TODO error
  };

  if (pk == null) {
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

  // TODO use an urlbuilder
  const handleBack = () => router.push(`/application/${application.pk}/page3`);

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
          <MediumButton variant="secondary" onClick={handleBack}>
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
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const tos = await getGenericTerms(apolloClient);

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { id } = query;
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = Number.isNaN(Number(pkstring)) ? null : Number(pkstring);

  if (pk == null) {
    return {
      props: {
        notFound: true,
        ...commonProps,
      },
      notFound: true,
    };
  }

  return {
    props: {
      ...commonProps,
      key: locale,
      pk,
      tos,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Preview;
