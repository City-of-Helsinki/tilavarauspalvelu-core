import React, { useEffect, useState } from "react";
import { TextInput, Checkbox } from "hds-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import styled from "styled-components";
import {
  Application,
  ContactPerson,
  FormType,
  Organisation,
  Address,
  OptionType,
} from "../../modules/types";
import {
  CheckboxWrapper,
  SpanTwoColumns,
  TwoColumnContainer,
} from "../common/common";
import RadioButtons from "./RadioButtons";
import EmailInput from "./EmailInput";
import BillingAddress from "./BillingAddress";
import Buttons from "./Buttons";
import { deepCopy, errorText } from "../../modules/util";
import ControlledSelect from "../common/ControlledSelect";
import { breakpoint } from "../../modules/style";

export const Placeholder = styled.span`
  @media (max-width: ${breakpoint.m}) {
    display: none;
  }
`;

type Props = {
  activeForm: FormType;
  setActiveForm: (id: FormType) => void;
  application: Application;
  onNext: (appToSave: Application) => void;
  homeCityOptions: OptionType[];
};

const OrganisationForm = ({
  activeForm,
  setActiveForm,
  application,
  onNext,
  homeCityOptions,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const { register, unregister, handleSubmit, control, errors } = useForm({
    defaultValues: {
      organisation: { ...application.organisation } as Organisation,
      contactPerson: { ...application.contactPerson } as ContactPerson,
      billingAddress: { ...application.billingAddress } as Address,
      homeCityId: application.homeCityId,
    },
  });

  const [hasRegistration, setHasRegistration] = useState(
    Boolean(application.organisation?.identifier) // it is registered if identifier is set
  );
  const [hasBillingAddress, setHasBillingAddress] = useState(
    application.billingAddress !== null
  );

  useEffect(() => {
    if (hasRegistration) {
      register({ name: "organisation.identifier", required: true });
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

    return applicationCopy;
  };

  const onSubmit = (data: Application): void => {
    const appToSave = prepareData(data);
    onNext(appToSave);
  };

  return (
    <form>
      <RadioButtons activeForm={activeForm} setActiveForm={setActiveForm}>
        <TwoColumnContainer>
          <SpanTwoColumns>
            <TextInput
              ref={register({ required: true })}
              label={t("application:Page3.organisation.name")}
              id="organisation.name"
              name="organisation.name"
              required
              invalid={!!errors.organisation?.name?.type}
              errorText={errorText(t, errors.organisation?.name?.type)}
            />
            <TextInput
              ref={register({ required: true })}
              label={t("application:Page3.organisation.coreBusiness")}
              id="organisation.coreBusiness"
              name="organisation.coreBusiness"
              required
              invalid={!!errors.organisation?.coreBusiness?.type}
              errorText={errorText(t, errors.organisation?.coreBusiness?.type)}
            />
          </SpanTwoColumns>
          <ControlledSelect
            name="homeCityId"
            required
            label={t("application:Page3.homeCity")}
            control={control}
            options={homeCityOptions}
            error={errorText(t, errors.homeCityId?.type)}
          />
          <Placeholder />
          <TextInput
            ref={register({ required: hasRegistration })}
            label={t("application:Page3.organisation.registrationNumber")}
            id="organisation.identifier"
            name="organisation.identifier"
            required={hasRegistration}
            disabled={!hasRegistration}
            invalid={!!errors.organisation?.identifier?.type}
            errorText={errorText(t, errors.organisation?.identifier?.type)}
          />
          <CheckboxWrapper>
            <Checkbox
              label={t("application:Page3.organisation.notRegistered")}
              id="organisation.notRegistered"
              name="organisation.notRegistered"
              checked={!hasRegistration}
              onClick={() => setHasRegistration(!hasRegistration)}
            />
          </CheckboxWrapper>
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.organisation.streetAddress")}
            id="organisation.address.streetAddress"
            name="organisation.address.streetAddress"
            required
            invalid={!!errors.organisation?.address?.streetAddress?.type}
            errorText={errorText(
              t,
              errors.organisation?.address?.streetAddress?.type
            )}
          />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.organisation.postCode")}
            id="organisation.address.postCode"
            name="organisation.address.postCode"
            required
            invalid={!!errors.organisation?.address?.postCode?.type}
            errorText={errorText(
              t,
              errors.organisation?.address?.postCode?.type
            )}
          />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.organisation.city")}
            id="organisation.address.city"
            name="organisation.address.city"
            required
            invalid={!!errors.organisation?.address?.city?.type}
            errorText={errorText(t, errors.organisation?.address?.city?.type)}
          />
          <Checkbox
            label={t("application:Page3.organisation.separateInvoicingAddress")}
            id="organisation.hasInvoicingAddress"
            name="organisation.hasInvoicingAddress"
            checked={hasBillingAddress}
            onClick={() => setHasBillingAddress(!hasBillingAddress)}
          />
          {hasBillingAddress ? (
            <BillingAddress register={register} errors={errors} />
          ) : null}
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.contactPerson.phoneNumber")}
            id="contactPerson.phoneNumber"
            name="contactPerson.phoneNumber"
            required
            invalid={!!errors.contactPerson?.phoneNumber?.type}
            errorText={errorText(t, errors.contactPerson?.phoneNumber?.type)}
          />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.contactPerson.firstName")}
            id="contactPerson.firstName"
            name="contactPerson.firstName"
            required
            invalid={!!errors.contactPerson?.firstName?.type}
            errorText={errorText(t, errors.contactPerson?.firstName?.type)}
          />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.contactPerson.lastName")}
            id="contactPerson.lastName"
            name="contactPerson.lastName"
            required
            invalid={!!errors.contactPerson?.lastName?.type}
            errorText={errorText(t, errors.contactPerson?.lastName?.type)}
          />
          <EmailInput register={register} errors={errors} />
        </TwoColumnContainer>
      </RadioButtons>
      <Buttons
        onSubmit={handleSubmit(onSubmit)}
        applicationId={application.id}
      />
    </form>
  );
};

export default OrganisationForm;
