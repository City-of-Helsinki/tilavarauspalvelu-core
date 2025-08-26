import React, { useEffect } from "react";
import { Button, ButtonSize, ButtonVariant, IconArrowLeft, IconArrowRight } from "hds-react";
import { useTranslation } from "next-i18next";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import {
  ApplicationPage3Document,
  type ApplicationPage3Query,
  type ApplicationPage3QueryVariables,
  ReserveeType,
  useUpdateApplicationMutation,
} from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import { gql } from "@apollo/client";
import { AutoGrid, ButtonContainer, Flex } from "common/styled";
import { useDisplayError } from "common/src/hooks";
import { createNodeId, ignoreMaybeArray, toNumber } from "common/src/helpers";
import {
  type ApplicationPage3FormValues,
  ApplicationPage3Schema,
  convertApplicationPage3,
  transformPage3Application,
} from "@/components/application/funnel/form";
import {
  ApplicantTypeSelector,
  ApplicationFunnelWrapper,
  CompanyForm,
  IndividualForm,
  OrganisationForm,
} from "@/components/application/funnel/";
import { FormSubHeading } from "@/components/application/funnel/styled";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationPath } from "@/modules/urls";

function Page3Form(): JSX.Element | null {
  const { watch, unregister, register, setValue } = useFormContext<ApplicationPage3FormValues>();
  const type = watch("applicantType");

  useEffect(() => {
    if (type === ReserveeType.Individual) {
      unregister("organisationName");
      unregister("organisationIdentifier");
      unregister("organisationCoreBusiness");
      unregister("organisationStreetAddress");
      unregister("organisationCity");
      unregister("organisationPostCode");
    }

    const hasRegistration = type === ReserveeType.Nonprofit || type === ReserveeType.Company;
    if (hasRegistration) {
      register("organisationIdentifier", { required: true });
    } else {
      // Unregister does not remove the form value (neither from DOM nor from the form state)
      setValue("organisationIdentifier", undefined);
      unregister("organisationIdentifier");
    }
  }, [type, register, unregister, setValue]);

  const hasBillingAddress = watch("hasBillingAddress");
  useEffect(() => {
    if (!hasBillingAddress) {
      unregister("billingStreetAddress");
      unregister("billingPostCode");
      unregister("billingCity");
    }
  }, [hasBillingAddress, unregister]);

  switch (type) {
    case ReserveeType.Individual:
      return <IndividualForm />;
    case ReserveeType.Nonprofit:
      return <OrganisationForm />;
    case ReserveeType.Company:
      return <CompanyForm />;
    default:
      // TODO should we return disabled form here?
      return null;
  }
}

function Page3({ application }: Pick<PropsNarrowed, "application">): JSX.Element {
  const router = useRouter();

  const form = useForm<ApplicationPage3FormValues>({
    mode: "onChange",
    defaultValues: convertApplicationPage3(application),
    resolver: zodResolver(ApplicationPage3Schema),
    reValidateMode: "onChange",
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    if (application != null) {
      reset(convertApplicationPage3(application));
    }
  }, [application, reset]);

  const { t } = useTranslation();
  const [mutate] = useUpdateApplicationMutation();
  const displayError = useDisplayError();

  const onSubmit = async (values: ApplicationPage3FormValues) => {
    try {
      const input = transformPage3Application(values);
      const { data } = await mutate({ variables: { input } });
      const { pk } = data?.updateApplication ?? {};
      if (pk == null) {
        throw new Error("Failed to save application");
      }
      router.push(getApplicationPath(pk, "page4"));
    } catch (err) {
      displayError(err);
    }
  };

  const onPrev = () => router.push(getApplicationPath(application.pk, "page2"));

  return (
    <FormProvider {...form}>
      <ApplicationFunnelWrapper page="page3" application={application}>
        <Flex as="form" noValidate onSubmit={handleSubmit(onSubmit)} data-testid="application__page3--form">
          <ApplicantTypeSelector />
          <AutoGrid>
            <FormSubHeading as="h2">{t("application:Page3.sectionHeadings.basicInfo")}</FormSubHeading>
            <Page3Form />
          </AutoGrid>
          <ButtonContainer>
            <Button
              variant={ButtonVariant.Secondary}
              iconStart={<IconArrowLeft />}
              size={ButtonSize.Small}
              onClick={onPrev}
            >
              {t("common:prev")}
            </Button>
            <Button id="button__application--next" iconEnd={<IconArrowRight />} size={ButtonSize.Small} type="submit">
              {t("common:next")}
            </Button>
          </ButtonContainer>
        </Flex>
      </ApplicationFunnelWrapper>
    </FormProvider>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const commonProps = getCommonServerSideProps();
  const { locale } = ctx;

  const { query } = ctx;
  const pk = toNumber(ignoreMaybeArray(query.id));
  const notFound = {
    notFound: true,
    props: {
      notFound: true,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
  if (pk == null || !(pk > 0)) {
    return notFound;
  }
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  const { data } = await apolloClient.query<ApplicationPage3Query, ApplicationPage3QueryVariables>({
    query: ApplicationPage3Document,
    variables: { id: createNodeId("ApplicationNode", pk) },
  });
  const application = data?.node != null && "id" in data.node ? data.node : null;
  if (application == null) {
    return notFound;
  }

  return {
    props: {
      application,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Page3;

export const APPLICATION_PAGE3_QUERY = gql`
  query ApplicationPage3($id: ID!) {
    node(id: $id) {
      ... on ApplicationNode {
        ...ApplicationForm
      }
    }
  }
`;
