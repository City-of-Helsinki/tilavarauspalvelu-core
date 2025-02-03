import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import {
  ApplicationDocument,
  type ApplicationQuery,
  useSendApplicationMutation,
} from "@gql/gql-types";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ViewApplication } from "@/components/application/ViewApplication";
import { createApolloClient } from "@/modules/apolloClient";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { getApplicationPath } from "@/modules/urls";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { ButtonContainer, Flex } from "common/styles/util";
import {
  Button,
  ButtonVariant,
  IconArrowLeft,
  LoadingSpinner,
} from "hds-react";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// User has to accept the terms of service then on submit we change the application status
// This uses separate Send mutation (not update) so no onNext like the other pages
// we could also remove the FormContext here
function Preview({ application, tos }: PropsNarrowed): JSX.Element {
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
      const pk = application?.pk;
      if (pk == null) {
        throw new Error("no pk in application");
      }
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

  return (
    <ApplicationPageWrapper
      translationKeyPrefix="application:preview"
      application={application}
    >
      <Flex as="form" onSubmit={onSubmit}>
        <ViewApplication
          application={application}
          tos={tos}
          acceptTermsOfUse={acceptTermsOfUse}
          setAcceptTermsOfUse={setAcceptTermsOfUse}
        />
        <ButtonContainer>
          <ButtonLikeLink
            size="large"
            href={getApplicationPath(application.pk, "page3")}
          >
            <IconArrowLeft />
            {t("common:prev")}
          </ButtonLikeLink>
          <Button
            id="submit"
            type="submit"
            variant={
              isMutationLoading ? ButtonVariant.Clear : ButtonVariant.Primary
            }
            iconStart={isMutationLoading ? <LoadingSpinner /> : undefined}
            disabled={!acceptTermsOfUse || isMutationLoading}
          >
            {t("common:submit")}
          </Button>
        </ButtonContainer>
      </Flex>
    </ApplicationPageWrapper>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const tos = await getGenericTerms(apolloClient);

  const { query } = ctx;
  const pk = toNumber(ignoreMaybeArray(query.id));

  const notFound = {
    props: {
      notFound: true,
      ...commonProps,
    },
    notFound: true,
  };
  if (pk == null) {
    return notFound;
  }

  const { data } = await apolloClient.query<ApplicationQuery>({
    query: ApplicationDocument,
    variables: { id: base64encode(`ApplicationNode:${pk}`) },
  });
  const { application } = data ?? {};
  if (application == null) {
    return notFound;
  }

  return {
    props: {
      ...commonProps,
      application,
      tos,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Preview;
