import React, { useEffect } from "react";
import { Button, ButtonSize, ButtonVariant, IconArrowLeft, IconArrowRight } from "hds-react";
import { useTranslation } from "next-i18next";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import {
  ApplicantTypeChoice,
  ApplicationPage3Document,
  useUpdateApplicationMutation,
  type ApplicationPage3Query,
  type ApplicationPage3QueryVariables,
} from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { zodResolver } from "@hookform/resolvers/zod";
import { gql } from "@apollo/client";
import { AutoGrid, ButtonContainer, Flex } from "common/styled";
import { useDisplayError } from "common/src/hooks";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import {
  type ApplicationPage3FormValues,
  ApplicationPage3Schema,
  convertApplicationPage3,
  transformPage3Application,
} from "@/components/application/funnel/form";
import {
  ApplicationFunnelWrapper,
  ApplicantTypeSelector,
  CompanyForm,
  IndividualForm,
  OrganisationForm,
} from "@/components/application/funnel/";
import { FormSubHeading } from "@/components/application/funnel/styled";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationPath } from "@/modules/urls";
import { getSearchOptions, type OptionsT } from "@/modules/search";

type Page3FormProps = {
  cityOptions: OptionsT["cities"];
};

function Page3Form({ cityOptions }: Page3FormProps): JSX.Element | null {
  const { watch, unregister, register, setValue } = useFormContext<ApplicationPage3FormValues>();
  const type = watch("applicantType");

  useEffect(() => {
    if (type === ApplicantTypeChoice.Individual) {
      unregister("organisation");
    }
    const hasRegistration = type === ApplicantTypeChoice.Association || type === ApplicantTypeChoice.Company;
    if (hasRegistration) {
      register("organisation.identifier", { required: true });
    } else {
      // Unregister does not remove the form value (neither from DOM nor from the form state)
      setValue("organisation.identifier", undefined);
      unregister("organisation.identifier");
    }
  }, [type, register, unregister, setValue]);

  const hasBillingAddress = watch("hasBillingAddress");
  useEffect(() => {
    if (!hasBillingAddress) {
      unregister("billingAddress");
      unregister("billingAddress.postCode");
      unregister("billingAddress.city");
    }
  }, [hasBillingAddress, unregister]);

  switch (type) {
    case ApplicantTypeChoice.Individual:
      return <IndividualForm />;
    case ApplicantTypeChoice.Community:
    case ApplicantTypeChoice.Association:
      return <OrganisationForm homeCityOptions={cityOptions} />;
    case ApplicantTypeChoice.Company:
      return <CompanyForm />;
    default:
      // TODO should we return disabled form here?
      return null;
  }
}

function Page3({ application, cityOptions }: Pick<PropsNarrowed, "application" | "cityOptions">): JSX.Element {
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
  const dislayError = useDisplayError();

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
      dislayError(err);
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
            <Page3Form cityOptions={cityOptions} />
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
    variables: { id: base64encode(`ApplicationNode:${pk}`) },
  });
  const { application } = data;
  if (application == null) {
    return notFound;
  }

  const options = await getSearchOptions(apolloClient, "seasonal", locale ?? "fi");

  return {
    props: {
      application,
      cityOptions: options.cities,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Page3;

export const APPLICATION_PAGE3_QUERY = gql`
  query ApplicationPage3($id: ID!) {
    application(id: $id) {
      ...ApplicationForm
    }
  }
`;
