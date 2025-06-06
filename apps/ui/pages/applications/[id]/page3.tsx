import React, { useEffect } from "react";
import {
  ApplicantTypeChoice,
  ApplicationPage3Document,
  useUpdateApplicationMutation,
  type ApplicationPage3Query,
  type ApplicationPage3QueryVariables,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { CompanyForm } from "@/components/application/CompanyForm";
import { IndividualForm } from "@/components/application/IndividualForm";
import { OrganisationForm } from "@/components/application/OrganisationForm";
import { ApplicantTypeSelector } from "@/components/application/ApplicantTypeSelector";
import { useOptions } from "@/hooks/useOptions";
import {
  type ApplicationPage3FormValues,
  ApplicationPage3Schema,
  convertApplicationPage3,
  transformPage3Application,
} from "@/components/application/form";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { getApplicationPath } from "@/modules/urls";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconArrowLeft,
  IconArrowRight,
} from "hds-react";
import { AutoGrid, ButtonContainer, Flex } from "common/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSubHeading } from "@/components/application/styled";
import { createApolloClient } from "@/modules/apolloClient";
import { gql } from "@apollo/client";
import { useDisplayError } from "common/src/hooks";

function Page3Form(): JSX.Element | null {
  const { options } = useOptions();
  const { cityOptions } = options;

  const { watch, unregister, register, setValue } =
    useFormContext<ApplicationPage3FormValues>();
  const type = watch("applicantType");

  useEffect(() => {
    if (type === ApplicantTypeChoice.Individual) {
      unregister("organisation");
    }
    const hasRegistration =
      type === ApplicantTypeChoice.Association ||
      type === ApplicantTypeChoice.Company;
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

function Page3({ application }: PropsNarrowed): JSX.Element {
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
      router.push(getApplicationPath(pk, "preview"));
    } catch (err) {
      dislayError(err);
    }
  };

  const onPrev = () => router.push(getApplicationPath(application.pk, "page2"));

  return (
    <FormProvider {...form}>
      <ApplicationPageWrapper
        translationKeyPrefix="application:Page3"
        application={application}
      >
        <Flex as="form" noValidate onSubmit={handleSubmit(onSubmit)}>
          <ApplicantTypeSelector />
          <AutoGrid>
            <FormSubHeading as="h2">
              {t("application:Page3.subHeading.basicInfo")}
            </FormSubHeading>
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
            <Button
              id="button__application--next"
              iconEnd={<IconArrowRight />}
              size={ButtonSize.Small}
              type="submit"
            >
              {t("common:next")}
            </Button>
          </ButtonContainer>
        </Flex>
      </ApplicationPageWrapper>
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
  const { data } = await apolloClient.query<
    ApplicationPage3Query,
    ApplicationPage3QueryVariables
  >({
    query: ApplicationPage3Document,
    variables: { id: base64encode(`ApplicationNode:${pk}`) },
  });
  const { application } = data;
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
    application(id: $id) {
      ...ApplicationForm
    }
  }
`;
