import React, { useEffect } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { gql } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, ButtonSize, ButtonVariant, IconArrowLeft, IconArrowRight } from "hds-react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useDisplayError } from "ui/src/hooks";
import { createNodeId, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { AutoGrid, ButtonContainer, Flex } from "ui/src/styled";
import {
  ApplicantTypeSelector,
  ApplicationFunnelWrapper,
  CompanyForm,
  IndividualForm,
  OrganisationForm,
} from "@/components/application/funnel/";
import {
  type ApplicationPage3FormValues,
  ApplicationPage3Schema,
  convertApplicationPage3,
  transformPage3Application,
} from "@/components/application/funnel/form";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationPath } from "@/modules/urls";
import { FormSubHeading } from "@/styled/application";
import {
  ApplicationPage3Document,
  type ApplicationPage3Query,
  type ApplicationPage3QueryVariables,
  ReserveeType,
  useUpdateApplicationMutation,
} from "@gql/gql-types";

function Page3Form(): JSX.Element | null {
  const { watch, unregister, register, setValue } = useFormContext<ApplicationPage3FormValues>();
  const type = watch("applicantType");

  const hasRegistration = watch("isRegisteredAssociation");
  useEffect(() => {
    if (type === ReserveeType.Individual) {
      unregister("organisationName");
      unregister("organisationIdentifier");
      unregister("organisationCoreBusiness");
      unregister("organisationStreetAddress");
      unregister("organisationCity");
      unregister("organisationPostCode");
      register("additionalInformation");
    } else if (type === ReserveeType.Company || hasRegistration) {
      register("organisationIdentifier", { required: true });
      unregister("additionalInformation");
    } else {
      unregister("organisationIdentifier");
      unregister("additionalInformation");
    }
  }, [hasRegistration, type, register, unregister, setValue]);

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

export default function Page3({ application }: Pick<PropsNarrowed, "application">): JSX.Element {
  const router = useRouter();

  const form = useForm<ApplicationPage3FormValues>({
    mode: "onChange",
    values: convertApplicationPage3(application),
    resolver: zodResolver(ApplicationPage3Schema),
    reValidateMode: "onChange",
  });

  const { handleSubmit } = form;

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
  const { locale, query } = ctx;
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

  const { apiBaseUrl } = getCommonServerSideProps();
  const apolloClient = createApolloClient(apiBaseUrl, ctx);
  const { data } = await apolloClient.query<ApplicationPage3Query, ApplicationPage3QueryVariables>({
    query: ApplicationPage3Document,
    variables: { id: createNodeId("ApplicationNode", pk) },
  });
  const { application } = data;
  if (application == null) {
    return notFound;
  }

  return {
    props: {
      application,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const APPLICATION_PAGE3_QUERY = gql`
  query ApplicationPage3($id: ID!) {
    application(id: $id) {
      ...ApplicationForm
    }
  }
`;
