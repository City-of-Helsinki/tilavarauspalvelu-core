import React, { useEffect } from "react";
import {
  ApplicantTypeChoice,
  ApplicationPage3Document,
  ApplicationPage3Query,
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
  type ApplicationFormPage3Values,
  ApplicationFormPage3Schema,
  convertApplicationPage3,
  transformPage3Application,
} from "@/components/application/form";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { getApplicationPath } from "@/modules/urls";
import {
  Button,
  ButtonVariant,
  IconArrowLeft,
  IconArrowRight,
} from "hds-react";
import { AutoGrid, ButtonContainer } from "common/styles/util";
import styled from "styled-components";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmailInput } from "@/components/application/EmailInput";
import { FormSubHeading } from "@/components/application/styled";
import { createApolloClient } from "@/modules/apolloClient";
import { gql } from "@apollo/client";

function Page3Form(): JSX.Element | null {
  const { options } = useOptions();
  const { cityOptions } = options;

  const { watch } = useFormContext<ApplicationFormPage3Values>();
  const type = watch("applicantType");

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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
`;

function Page3({ application }: PropsNarrowed): JSX.Element {
  const router = useRouter();

  const form = useForm<ApplicationFormPage3Values>({
    mode: "onChange",
    defaultValues: convertApplicationPage3(application),
    resolver: zodResolver(ApplicationFormPage3Schema),
    reValidateMode: "onChange",
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
    watch,
  } = form;

  useEffect(() => {
    if (application != null) {
      reset(convertApplicationPage3(application));
    }
  }, [application, reset]);

  const { t } = useTranslation();
  const [update] = useApplicationUpdate();

  const handleSave = async (values: ApplicationFormPage3Values) => {
    // There should not be a situation where we are saving on this page without an application
    // but because of loading we might not have it when the page is rendered
    // TODO: refactor so we don't need to check it like this
    if (values.pk === 0) {
      throw new Error("Invalid application");
    }
    return update(transformPage3Application(values));
  };

  const onSubmit = async (values: ApplicationFormPage3Values) => {
    try {
      const pk = await handleSave(values);
      router.push(getApplicationPath(pk, "preview"));
    } catch (e) {
      errorToast({ text: t("common:error.dataError") });
    }
  };

  const onPrev = () => router.push(getApplicationPath(application.pk, "page2"));

  const isValid = watch("applicantType") != null;

  return (
    <FormProvider {...form}>
      <ApplicationPageWrapper
        translationKeyPrefix="application:Page3"
        application={application}
        isDirty={isDirty}
      >
        <Form noValidate onSubmit={handleSubmit(onSubmit)}>
          <ApplicantTypeSelector />
          <AutoGrid $alignCenter>
            <FormSubHeading as="h2">
              {t("application:Page3.subHeading.basicInfo")}
            </FormSubHeading>
            <Page3Form />
            <EmailInput />
          </AutoGrid>
          <ButtonContainer>
            <Button
              variant={ButtonVariant.Secondary}
              iconStart={<IconArrowLeft />}
              onClick={onPrev}
            >
              {t("common:prev")}
            </Button>
            <Button
              id="button__application--next"
              iconEnd={<IconArrowRight />}
              type="submit"
              disabled={!isValid}
            >
              {t("common:next")}
            </Button>
          </ButtonContainer>
        </Form>
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
  const pkstring = ignoreMaybeArray(query.id);
  const pk = toNumber(pkstring ?? "");
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
  const { data } = await apolloClient.query<ApplicationPage3Query>({
    query: ApplicationPage3Document,
    variables: { id: base64encode(`ApplicationNode:${pk}`) },
  });
  const { application } = data ?? {};
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
