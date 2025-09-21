import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { ApplicationPage4Document, useSendApplicationMutation } from "@gql/gql-types";
import type { ApplicationPage4Query, ApplicationPage4QueryVariables } from "@gql/gql-types";
import type { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps, getGenericTerms } from "@/modules/serverUtils";
import { createNodeId, getNode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { getApplicationPath } from "@/modules/urls";
import { ButtonLikeLink } from "common/src/components/ButtonLikeLink";
import { ButtonContainer, Flex } from "common/styled";
import { Button, ButtonSize, ButtonVariant, IconArrowLeft, LoadingSpinner } from "hds-react";
import { useDisplayError } from "common/src/hooks";
import { ErrorText } from "common/src/components/ErrorText";
import { validateApplication, PAGES_WITH_STEPPER, ApplicationFunnelWrapper } from "@/components/application/funnel";
import { ApplicationTerms, ViewApplication } from "@/components/application";
import { gql } from "@apollo/client";

// User has to accept the terms of service then on submit we change the application status
// This uses separate Send mutation (not update) so no onNext like the other pages
// we could also remove the FormContext here
function Page4({ application, tos }: Pick<PropsNarrowed, "application" | "tos">): JSX.Element {
  const router = useRouter();
  const dislayError = useDisplayError();
  const { t } = useTranslation();

  const [isTermsAccepted, setIsTermsAccepted] = useState({
    general: false,
    specific: false,
  });

  const handleTermsAcceptedChange = (key: "general" | "specific", val: boolean) => {
    setIsTermsAccepted({ ...isTermsAccepted, [key]: val });
  };

  const [send, { loading: isMutationLoading }] = useSendApplicationMutation();

  const hasTermsAccepted = isTermsAccepted.general && isTermsAccepted.specific;

  const onSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!hasTermsAccepted) {
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
    } catch (err) {
      dislayError(err);
    }
  };

  const isValid = validateApplication(application);

  return (
    <ApplicationFunnelWrapper page="page4" application={application}>
      <Flex as="form" onSubmit={onSubmit}>
        <ViewApplication application={application}>
          <ApplicationTerms
            generalTos={tos}
            serviceTos={application.applicationRound?.termsOfUse}
            isTermsAccepted={isTermsAccepted}
            setIsTermsAccepted={handleTermsAcceptedChange}
          />
        </ViewApplication>
        {!isValid.valid && (
          <ErrorText>
            {t("application:validation.previewError", {
              page: t(`application:navigation.${PAGES_WITH_STEPPER[isValid.page]}`),
            })}{" "}
            <Link href={getApplicationPath(application.pk, `page${isValid.page}`)}>
              {t("application:validation.fix")}
            </Link>
          </ErrorText>
        )}
        <ButtonContainer>
          <ButtonLikeLink href={getApplicationPath(application.pk, "page3")}>
            <IconArrowLeft />
            {t("common:prev")}
          </ButtonLikeLink>
          <Button
            id="button__application--submit"
            type="submit"
            variant={isMutationLoading ? ButtonVariant.Clear : ButtonVariant.Primary}
            iconStart={isMutationLoading ? <LoadingSpinner small /> : undefined}
            size={ButtonSize.Small}
            disabled={!hasTermsAccepted || isMutationLoading}
          >
            {t("common:submit")}
          </Button>
        </ButtonContainer>
      </Flex>
    </ApplicationFunnelWrapper>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

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

  const { data } = await apolloClient.query<ApplicationPage4Query, ApplicationPage4QueryVariables>({
    query: ApplicationPage4Document,
    variables: { id: createNodeId("ApplicationNode", pk) },
  });
  const application = getNode(data);
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

export default Page4;

// TODO narrow down the query fragment (if possible), need at least TermsOfUse and ApplicationForm
export const APPLICATION_PREVIEW_QUERY = gql`
  query ApplicationPage4($id: ID!) {
    node(id: $id) {
      ... on ApplicationNode {
        ...ApplicationView
      }
    }
  }
`;

export const SEND_APPLICATION_MUTATION = gql`
  mutation SendApplication($input: ApplicationSendMutation!) {
    sendApplication(input: $input) {
      pk
    }
  }
`;
