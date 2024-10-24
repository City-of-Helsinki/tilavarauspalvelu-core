import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import {
  useApplicationQuery,
  useSendApplicationMutation,
} from "@gql/gql-types";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { default as ErrorComponent } from "next/error";
import { MediumButton } from "@/styles/util";
import { ButtonContainer, CenterSpinner } from "@/components/common/common";
import { ViewInner } from "@/components/application/ViewInner";
import { createApolloClient } from "@/modules/apolloClient";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { getApplicationPath } from "@/modules/urls";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// User has to accept the terms of service then on submit we change the application status
// This uses separate Send mutation (not update) so no onNext like the other pages
// we could also remove the FormContext here
function Preview(props: PropsNarrowed): JSX.Element {
  const { pk, tos } = props;

  const id = base64encode(`ApplicationNode:${pk}`);
  const {
    data,
    error,
    loading: isLoading,
  } = useApplicationQuery({
    variables: { id },
    skip: !pk,
  });
  const { application } = data ?? {};

  const [acceptTermsOfUse, setAcceptTermsOfUse] = useState(false);
  const router = useRouter();

  const { t } = useTranslation();

  const [send, { loading: isMutationLoading }] = useSendApplicationMutation();

  const onSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!acceptTermsOfUse) {
      return;
    }
    try {
      const { data: mutData } = await send({
        variables: {
          input: {
            pk,
          },
        },
      });

      const { pk: resPk } = mutData?.sendApplication ?? {};
      if (resPk == null) {
        throw new Error("no pk in response");
      }

      router.push(getApplicationPath(resPk, "sent"));
    } catch (e) {
      errorToast({ text: t("errors:applicationMutation.Validation error") });
    }
  };

  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return <ErrorComponent statusCode={500} />;
  }
  if (isLoading) {
    return <CenterSpinner />;
  }

  if (application == null) {
    return <ErrorComponent statusCode={404} />;
  }

  return (
    <ApplicationPageWrapper
      translationKeyPrefix="application:preview"
      application={application}
    >
      <form onSubmit={onSubmit}>
        <ViewInner
          application={application}
          tos={tos}
          acceptTermsOfUse={acceptTermsOfUse}
          setAcceptTermsOfUse={setAcceptTermsOfUse}
        />
        <ButtonContainer>
          <ButtonLikeLink size="large" href={getApplicationPath(pk, "page3")}>
            {t("common:prev")}
          </ButtonLikeLink>
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
