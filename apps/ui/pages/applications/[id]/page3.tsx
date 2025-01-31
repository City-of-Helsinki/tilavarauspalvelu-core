import React, { useEffect } from "react";
import { ApplicantTypeChoice, useApplicationQuery } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import NextError from "next/error";
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
import { CenterSpinner } from "@/components/common/common";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode, toNumber } from "common/src/helpers";
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

function Page3Wrapped(props: PropsNarrowed): JSX.Element | null {
  const { pk: appPk } = props;
  const router = useRouter();

  const id = base64encode(`ApplicationNode:${appPk}`);
  const {
    data,
    error: queryError,
    loading: isLoading,
  } = useApplicationQuery({
    variables: { id },
  });
  const { application } = data ?? {};
  const { applicationRound } = application ?? {};

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

  if (queryError != null) {
    return <NextError statusCode={500} />;
  }

  if (isLoading && application == null && applicationRound == null) {
    return <CenterSpinner />;
  }

  // TODO these are 404
  // This should never happen but Apollo TS doesn't enforce it
  if (application?.pk == null || applicationRound == null) {
    return <NextError statusCode={404} />;
  }

  const onPrev = () => router.push(getApplicationPath(application.pk, "page2"));

  const isValid = watch("applicantType") != null;

  return (
    <FormProvider {...form}>
      {/* TODO general mutation error (not query) */}
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
  const { locale } = ctx;

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { id } = query;
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = toNumber(pkstring ?? "");
  if (pk == null || !(pk > 0)) {
    return {
      notFound: true,
      props: {
        notFound: true,
        ...(await serverSideTranslations(locale ?? "fi")),
      },
    };
  }
  return {
    props: {
      ...getCommonServerSideProps(),
      key: locale,
      pk,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Page3Wrapped;
