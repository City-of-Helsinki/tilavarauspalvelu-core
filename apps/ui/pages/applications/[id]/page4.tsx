import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import {
  ApplicationPage4Document,
  type ApplicationPage4Query,
  type ApplicationPage4QueryVariables,
  useSendApplicationMutation,
} from "@gql/gql-types";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ViewApplication } from "@/components/application/ViewApplication";
import { createApolloClient } from "@/modules/apolloClient";
import { ApplicationFunnelWrapper } from "@/components/application/ApplicationPageWrapper";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { getApplicationPath } from "@/modules/urls";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { ButtonContainer, Flex } from "common/styled";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconArrowLeft,
  LoadingSpinner,
} from "hds-react";
import { useDisplayError } from "common/src/hooks";
import { ErrorText } from "common/src/components/ErrorText";
import Link from "next/link";
import { validateApplication } from "@/components/application/form";
import { PAGES_WITH_STEPPER } from "@/components/application/ApplicationStepper";
import { gql } from "@apollo/client";

// User has to accept the terms of service then on submit we change the application status
// This uses separate Send mutation (not update) so no onNext like the other pages
// we could also remove the FormContext here
function Page4({
  application,
  tos,
}: Pick<PropsNarrowed, "application" | "tos">): JSX.Element {
  const router = useRouter();
  const dislayError = useDisplayError();
  const { t } = useTranslation();

  const [isTermsAccepted, setIsTermsAccepted] = useState({
    general: false,
    specific: false,
  });

  const handleTermsAcceptedChange = (
    key: "general" | "specific",
    val: boolean
  ) => {
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
        <ViewApplication
          application={application}
          tos={tos}
          isTermsAccepted={isTermsAccepted}
          setIsTermsAccepted={handleTermsAcceptedChange}
        />
        {!isValid.valid && (
          <ErrorText>
            {t("application:validation.previewError", {
              page: t(
                `application:navigation.${PAGES_WITH_STEPPER[isValid.page]}`
              ),
            })}{" "}
            <Link
              href={getApplicationPath(application.pk, `page${isValid.page}`)}
            >
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
            variant={
              isMutationLoading ? ButtonVariant.Clear : ButtonVariant.Primary
            }
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

  const { data } = await apolloClient.query<
    ApplicationPage4Query,
    ApplicationPage4QueryVariables
  >({
    query: ApplicationPage4Document,
    variables: { id: base64encode(`ApplicationNode:${pk}`) },
  });
  const { application } = data;
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
    application(id: $id) {
      ...ApplicationView
    }
  }
`;

export const SEND_APPLICATION_MUTATION = gql`
  mutation SendApplication($input: ApplicationSendMutationInput!) {
    sendApplication(input: $input) {
      pk
    }
  }
`;
