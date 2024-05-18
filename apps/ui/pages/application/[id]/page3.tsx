import React, { useEffect } from "react";
import styled from "styled-components";
import {
  ApplicantTypeChoice,
  type ApplicationQuery,
  useApplicationQuery,
  type ApplicationUpdateMutationInput,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { Maybe } from "graphql/jsutils/Maybe";
import Error from "next/error";
import { CompanyForm } from "@/components/application/CompanyForm";
import { IndividualForm } from "@/components/application/IndividualForm";
import { OrganisationForm } from "@/components/application/OrganisationForm";
import { ApplicantTypeSelector } from "@/components/application/ApplicantTypeSelector";
import { useOptions } from "@/hooks/useOptions";
import Buttons from "@/components/application/Buttons";
import {
  convertAddress,
  convertOrganisation,
  convertPerson,
  type ApplicationFormPage3Values,
  type PersonFormValues,
  type AddressFormValues,
  type OrganisationFormValues,
} from "@/components/application/Form";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { useApplicationUpdate } from "@/hooks/useApplicationUpdate";
import { CenterSpinner } from "@/components/common/common";
import { ErrorToast } from "@/components/common/ErrorToast";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";

const Form = styled.form`
  margin-bottom: var(--spacing-layout-l);
  padding-bottom: var(--spacing-l);
`;

// Filter out any empty strings from the object (otherwise the mutation fails)
function transformPerson(person?: PersonFormValues) {
  return {
    firstName: person?.firstName || undefined,
    lastName: person?.lastName || undefined,
    email: person?.email || undefined,
    phoneNumber: person?.phoneNumber || undefined,
  };
}

type Node = NonNullable<ApplicationQuery["application"]>;
function isAddressValid(address?: AddressFormValues) {
  const { streetAddress, postCode, city } = address || {};
  return (
    streetAddress != null &&
    streetAddress !== "" &&
    postCode != null &&
    postCode !== "" &&
    city != null &&
    city !== ""
  );
}

function transformAddress(address?: AddressFormValues) {
  return {
    pk: address?.pk || undefined,
    streetAddress: address?.streetAddress || undefined,
    postCode: address?.postCode || undefined,
    city: address?.city || undefined,
  };
}

// Filter out any empty strings from the object (otherwise the mutation fails)
// remove the identifier if it's empty (otherwise the mutation fails)
function transformOrganisation(org: OrganisationFormValues) {
  return {
    name: org?.name || undefined,
    identifier: org?.identifier || undefined,
    address: isAddressValid(org?.address)
      ? transformAddress(org?.address)
      : undefined,
    coreBusiness: org?.coreBusiness || undefined,
  };
}

function convertApplicationToForm(
  app?: Maybe<Node>
): ApplicationFormPage3Values {
  return {
    pk: app?.pk ?? 0,
    applicantType: app?.applicantType ?? ApplicantTypeChoice.Individual,
    organisation: convertOrganisation(app?.organisation),
    contactPerson: convertPerson(app?.contactPerson),
    billingAddress: convertAddress(app?.billingAddress),
    hasBillingAddress:
      app?.applicantType !== ApplicantTypeChoice.Individual &&
      app?.billingAddress?.streetAddress != null,
    additionalInformation: app?.additionalInformation ?? "",
    homeCity: app?.homeCity?.pk ?? undefined,
  };
}

function transformApplication(
  values: ApplicationFormPage3Values
): ApplicationUpdateMutationInput {
  const shouldSaveBillingAddress =
    values.applicantType === ApplicantTypeChoice.Individual ||
    values.hasBillingAddress;
  return {
    pk: values.pk,
    applicantType: values.applicantType,
    ...(values.billingAddress != null && shouldSaveBillingAddress
      ? { billingAddress: transformAddress(values.billingAddress) }
      : {}),
    ...(values.contactPerson != null
      ? { contactPerson: transformPerson(values.contactPerson) }
      : {}),
    ...(values.organisation != null &&
    values.applicantType !== ApplicantTypeChoice.Individual
      ? { organisation: transformOrganisation(values.organisation) }
      : {}),
    ...(values.additionalInformation != null
      ? { additionalInformation: values.additionalInformation }
      : {}),
    ...(values.homeCity != null && values.homeCity !== 0
      ? { homeCity: values.homeCity }
      : {}),
  };
}

function Page3(): JSX.Element | null {
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
      return null;
  }
}

function Page3Wrapped(props: Props): JSX.Element | null {
  const { id: appPk } = props;
  const router = useRouter();

  const id = base64encode(`ApplicationNode:${appPk}`);
  const {
    data,
    error: queryError,
    loading: isLoading,
  } = useApplicationQuery({
    variables: { id },
    skip: appPk == null || !(appPk > 0),
  });
  const { application } = data ?? {};
  const { applicationRound } = application ?? {};

  const form = useForm<ApplicationFormPage3Values>({
    mode: "onChange",
    defaultValues: convertApplicationToForm(application),
    // No resolver because different types require different mandatory values.
    // Would need to write more complex validation logic that branches based on the type.
    // resolver: zodResolver(ApplicationFormPage3Schema),
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (application != null) {
      reset(convertApplicationToForm(application));
    }
  }, [application, reset]);

  const [update, { error }] = useApplicationUpdate();

  const handleSave = async (values: ApplicationFormPage3Values) => {
    // There should not be a situation where we are saving on this page without an application
    // but because of loading we might not have it when the page is rendered
    // TODO: refactor so we don't need to check it like this
    if (values.pk === 0) {
      // eslint-disable-next-line no-console
      console.error("application pk is 0");
      return 0;
    }

    const input = transformApplication(values);
    const pk = await update(input);
    return pk;
  };

  const onSubmit = async (values: ApplicationFormPage3Values) => {
    const pk = await handleSave(values);
    if (pk === 0) {
      return;
    }
    const prefix = `/application/${pk}`;
    const target = `${prefix}/preview`;
    router.push(target);
  };

  const { t } = useTranslation();

  if (id == null) {
    return <Error statusCode={404} />;
  }
  if (isLoading) {
    return <CenterSpinner />;
  }

  if (queryError != null) {
    // eslint-disable-next-line no-console
    console.error(queryError);
    // TODO should be wrapped in layout and have an option to retry the query
    // probably better to show error page over a toast
    // return <ErrorToast error={`${t("common:error.dataError")}`} />;
    return <Error statusCode={500} />;
  }

  if (error != null) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  // TODO these are 404
  // This should never happen but Apollo TS doesn't enforce it
  if (application == null || applicationRound == null) {
    return <Error statusCode={404} />;
  }

  return (
    <FormProvider {...form}>
      {/* TODO general mutation error (not query) */}
      {error != null && <ErrorToast error={`${t("common:error.dataError")}`} />}
      <ApplicationPageWrapper
        translationKeyPrefix="application:Page3"
        application={application}
        isDirty={isDirty}
      >
        <Form noValidate onSubmit={handleSubmit(onSubmit)}>
          <ApplicantTypeSelector />
          <Page3 />
          {application.pk && <Buttons applicationId={application.pk} />}
        </Form>
      </ApplicationPageWrapper>
    </FormProvider>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { id } = query;
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = Number.isNaN(Number(pkstring)) ? undefined : Number(pkstring);
  return {
    props: {
      ...getCommonServerSideProps(),
      key: locale,
      id: pk,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Page3Wrapped;
