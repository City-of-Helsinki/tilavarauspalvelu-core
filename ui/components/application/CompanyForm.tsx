import React, { useState } from "react";
import { TextInput, Checkbox } from "hds-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import {
  Address,
  Application,
  ContactPerson,
  FormType,
  Organisation,
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
import { deepCopy, applicationErrorText } from "../../modules/util";

type Props = {
  activeForm: FormType;
  setActiveForm: (id: FormType) => void;
  application: Application;
  onNext: (appToSave: Application) => void;
};

const CompanyForm = ({
  activeForm,
  setActiveForm,
  application,
  onNext,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const [hasBillingAddress, setHasBillingAddress] = useState(
    application.billingAddress !== null
  );

  const { register, handleSubmit, errors } = useForm({
    defaultValues: {
      organisation: { ...application.organisation } as Organisation,
      contactPerson: { ...application.contactPerson } as ContactPerson,
      billingAddress: { ...application.billingAddress } as Address,
    },
  });

  const prepareData = (data: Application): Application => {
    const applicationCopy = deepCopy(application);
    applicationCopy.applicantType = "company";

    applicationCopy.contactPerson = data.contactPerson;
    applicationCopy.organisation = data.organisation;

    if (hasBillingAddress) {
      applicationCopy.billingAddress = data.billingAddress;
    } else {
      applicationCopy.billingAddress = null;
    }

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
              label={t("application:Page3.company.name")}
              id="organisation.name"
              name="organisation.name"
              required
              invalid={!!errors.organisation?.name?.type}
              errorText={applicationErrorText(
                t,
                errors.organisation?.name?.type
              )}
            />
            <TextInput
              ref={register({ required: true })}
              label={t("application:Page3.company.coreBusiness")}
              id="organisation.coreBusiness"
              name="organisation.coreBusiness"
              required
              invalid={!!errors.organisation?.coreBusiness?.type}
              errorText={applicationErrorText(
                t,
                errors.organisation?.coreBusiness?.type
              )}
            />
          </SpanTwoColumns>
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.company.registrationNumber")}
            id="organisation.identifier"
            name="organisation.identifier"
            required
            invalid={!!errors.organisation?.identifier?.type}
            errorText={applicationErrorText(
              t,
              errors.organisation?.identifier?.type
            )}
          />
          <span />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.organisation.streetAddress")}
            id="organisation.address.streetAddress"
            name="organisation.address.streetAddress"
            required
            invalid={!!errors.organisation?.address?.streetAddress?.type}
            errorText={applicationErrorText(
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
            errorText={applicationErrorText(
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
            errorText={applicationErrorText(
              t,
              errors.organisation?.address?.city?.type
            )}
          />
          <CheckboxWrapper>
            <Checkbox
              label={t(
                "application:Page3.organisation.separateInvoicingAddress"
              )}
              id="organisation.hasInvoicingAddress"
              name="organisation.hasInvoicingAddress"
              checked={hasBillingAddress}
              onClick={() => setHasBillingAddress(!hasBillingAddress)}
            />
          </CheckboxWrapper>
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
            errorText={applicationErrorText(
              t,
              errors.contactPerson?.phoneNumber?.type
            )}
          />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.contactPerson.firstName")}
            id="contactPerson.firstName"
            name="contactPerson.firstName"
            required
            invalid={!!errors.contactPerson?.firstName?.type}
            errorText={applicationErrorText(
              t,
              errors.contactPerson?.firstName?.type
            )}
          />
          <TextInput
            ref={register({ required: true })}
            label={t("application:Page3.contactPerson.lastName")}
            id="contactPerson.lastName"
            name="contactPerson.lastName"
            required
            invalid={!!errors.contactPerson?.lastName?.type}
            errorText={applicationErrorText(
              t,
              errors.contactPerson?.lastName?.type
            )}
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

export default CompanyForm;
