import React, { useEffect, useState } from "react";
import { TextInput, Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { Control, FieldValues, FormProvider, useForm } from "react-hook-form";
import styled from "styled-components";
import {
  Application,
  ContactPerson,
  Organisation,
  Address,
  OptionType,
} from "common/types/common";
import { breakpoints } from "common/src/common/style";
import { CheckboxWrapper } from "common/src/reservation-form/components";
import { TwoColumnContainer, FormSubHeading } from "../common/common";
import EmailInput from "./EmailInput";
import BillingAddress from "./BillingAddress";
import Buttons from "./Buttons";
import { deepCopy, applicationErrorText } from "../../modules/util";
import ControlledSelect from "../common/ControlledSelect";
import ApplicationForm from "./ApplicationForm";

export const Placeholder = styled.span`
  @media (max-width: ${breakpoints.m}) {
    display: none;
  }
`;

type Props = {
  application: Application;
  onNext: (appToSave: Application) => void;
  homeCityOptions: OptionType[];
};

const OrganisationForm = ({
  application,
  onNext,
  homeCityOptions,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const form = useForm<ApplicationForm>({
    defaultValues: {
      organisation: { ...application.organisation } as Organisation,
      contactPerson: { ...application.contactPerson } as ContactPerson,
      billingAddress: { ...application.billingAddress } as Address,
      homeCityId: application.homeCityId,
    },
  });

  const {
    register,
    unregister,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const [hasRegistration, setHasRegistration] = useState(
    Boolean(application.organisation?.identifier) // it is registered if identifier is set
  );
  const [hasBillingAddress, setHasBillingAddress] = useState(
    application.billingAddress !== null
  );

  useEffect(() => {
    if (hasRegistration) {
      register("organisation.identifier", { required: true });
    } else {
      unregister("organisation.identifier");
    }
  }, [hasRegistration, register, unregister]);

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(application);

    applicationCopy.applicantType = hasRegistration
      ? "association"
      : "community";

    applicationCopy.contactPerson = data.contactPerson;
    applicationCopy.organisation = data.organisation;

    if (!hasRegistration && applicationCopy.organisation != null) {
      applicationCopy.organisation.identifier = null;
    }

    if (hasBillingAddress) {
      applicationCopy.billingAddress = data.billingAddress;
    } else {
      applicationCopy.billingAddress = null;
    }

    applicationCopy.homeCityId = data.homeCityId;
    applicationCopy.additionalInformation = null;

    return applicationCopy;
  };

  const onSubmit = (data: Application): void => {
    const appToSave = prepareData(data);
    onNext(appToSave);
  };

  return (
    <form>
      <TwoColumnContainer>
        <FormSubHeading>
          {t("application:Page3.subHeading.basicInfo")}
        </FormSubHeading>
        <TextInput
          {...register("organisation.name", { required: true, maxLength: 255 })}
          label={t("application:Page3.organisation.name")}
          id="organisation.name"
          required
          invalid={!!errors.organisation?.name?.type}
          errorText={applicationErrorText(t, errors.organisation?.name?.type, {
            count: 255,
          })}
        />
        <TextInput
          {...register("organisation.coreBusiness", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.organisation.coreBusiness")}
          id="organisation.coreBusiness"
          required
          invalid={!!errors.organisation?.coreBusiness?.type}
          errorText={applicationErrorText(
            t,
            errors.organisation?.coreBusiness?.type,
            {
              count: 255,
            }
          )}
        />
        <ControlledSelect
          name="homeCityId"
          required
          label={t("application:Page3.homeCity")}
          control={control as unknown as Control<FieldValues, unknown>}
          options={homeCityOptions}
          error={applicationErrorText(t, errors.homeCityId?.type)}
        />
        <Placeholder />
        <CheckboxWrapper style={{ margin: "var(--spacing-xs) 0" }}>
          <Checkbox
            label={t("application:Page3.organisation.notRegistered")}
            id="organisation.notRegistered"
            name="organisation.notRegistered"
            checked={!hasRegistration}
            onClick={() => setHasRegistration(!hasRegistration)}
          />
        </CheckboxWrapper>
        <Placeholder />
        <TextInput
          {...register("organisation.identifier", {
            required: hasRegistration,
            maxLength: 255,
          })}
          label={t("application:Page3.organisation.registrationNumber")}
          id="organisation.identifier"
          required={hasRegistration}
          disabled={!hasRegistration}
          invalid={!!errors.organisation?.identifier?.type}
          errorText={applicationErrorText(
            t,
            errors.organisation?.identifier?.type,
            {
              count: 255,
            }
          )}
        />
        <Placeholder />
        <FormSubHeading>
          {t("application:Page3.subHeading.postalAddress")}
        </FormSubHeading>
        <TextInput
          {...register("organisation.address.streetAddress", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.organisation.streetAddress")}
          id="organisation.address.streetAddress"
          name="organisation.address.streetAddress"
          required
          invalid={!!errors.organisation?.address?.streetAddress?.type}
          errorText={applicationErrorText(
            t,
            errors.organisation?.address?.streetAddress?.type,
            {
              count: 255,
            }
          )}
        />
        <TextInput
          {...register("organisation.address.postCode", {
            required: true,
            maxLength: 32,
          })}
          label={t("application:Page3.organisation.postCode")}
          id="organisation.address.postCode"
          required
          invalid={!!errors.organisation?.address?.postCode?.type}
          errorText={applicationErrorText(
            t,
            errors.organisation?.address?.postCode?.type,
            { count: 32 }
          )}
        />
        <TextInput
          {...register("organisation.address.city", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.organisation.city")}
          id="organisation.address.city"
          required
          invalid={!!errors.organisation?.address?.city?.type}
          errorText={applicationErrorText(
            t,
            errors.organisation?.address?.city?.type,
            {
              count: 255,
            }
          )}
        />
        <CheckboxWrapper>
          <Checkbox
            label={t("application:Page3.organisation.separateInvoicingAddress")}
            id="organisation.hasInvoicingAddress"
            name="organisation.hasInvoicingAddress"
            checked={hasBillingAddress}
            onClick={() => setHasBillingAddress(!hasBillingAddress)}
          />
        </CheckboxWrapper>
        {hasBillingAddress ? (
          <FormProvider {...form}>
            <BillingAddress />
          </FormProvider>
        ) : null}
        <FormSubHeading>
          {t("application:Page3.subHeading.contactInfo")}
        </FormSubHeading>
        <TextInput
          {...register("contactPerson.firstName", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.contactPerson.firstName")}
          id="contactPerson.firstName"
          required
          invalid={!!errors.contactPerson?.firstName?.type}
          errorText={applicationErrorText(
            t,
            errors.contactPerson?.firstName?.type,
            {
              count: 255,
            }
          )}
        />
        <TextInput
          {...register("contactPerson.lastName", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.contactPerson.lastName")}
          id="contactPerson.lastName"
          required
          invalid={!!errors.contactPerson?.lastName?.type}
          errorText={applicationErrorText(
            t,
            errors.contactPerson?.lastName?.type,
            {
              count: 255,
            }
          )}
        />
        <TextInput
          {...register("contactPerson.phoneNumber", {
            required: true,
            maxLength: 255,
          })}
          label={t("application:Page3.contactPerson.phoneNumber")}
          id="contactPerson.phoneNumber"
          required
          invalid={!!errors.contactPerson?.phoneNumber?.type}
          errorText={applicationErrorText(
            t,
            errors.contactPerson?.phoneNumber?.type,
            {
              count: 255,
            }
          )}
        />
        <FormProvider {...form}>
          <EmailInput />
        </FormProvider>
      </TwoColumnContainer>
      <Buttons
        onSubmit={handleSubmit(onSubmit)}
        applicationId={application.id}
      />
    </form>
  );
};

export default OrganisationForm;
