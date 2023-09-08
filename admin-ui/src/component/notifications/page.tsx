import React from "react";
import dynamic from "next/dynamic";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BannerNotificationState, type Query } from "common/types/gql-types";
import { BANNER_NOTIFICATIONS_LIST } from "common/src/components/BannerNotificationsQuery";
import { Container } from "app/styles/layout";
import BreadcrumbWrapper from "app/component/BreadcrumbWrapper";
import { publicUrl } from "app/common/const";
import Loader from "app/component/Loader";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  RadioButton,
  Select,
  SelectionGroup,
  TextInput,
} from "hds-react";
import ControlledDateInput from "../my-units/components/ControlledDateInput";
import {
  valueForDateInput,
  valueForTimeInput,
} from "../ReservationUnits/ReservationUnitEditor/DateTimeInput";
import ControlledTimeInput from "../my-units/components/ControlledTimeInput";

const RichTextInput = dynamic(() => import("app/component/RichTextInput"), {
  ssr: false,
});

type Props = {
  id?: number;
};

/* TODO mobile styling */
const ButtonContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const NotificationFormSchema = z.object({
  name: z.string().min(1),
  inFuture: z.boolean(),
  isDraft: z.boolean(),
  // TODO time and date validators (reservation schema)
  activeFrom: z.string(),
  activeFromTime: z.string(),
  activeUntil: z.string(),
  activeUntilTime: z.string(),
  messageFi: z.string().min(1),
  messageEn: z.string(),
  messageSv: z.string(),
  // TODO validators can't be empty, needs to be in the list of options (look at reservation schema)
  targetGroup: z.object({
    label: z.string(),
    value: z.string(),
  }),
  level: z.object({
    label: z.string(),
    value: z.string(),
  }),
  pk: z.number(),
});

type NotificationFormType = z.infer<typeof NotificationFormSchema>;

const GridForm = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

/// @brief This is the create / edit page for a single notification.
const Page = ({ id }: Props) => {
  const { t } = useTranslation("translation", { keyPrefix: "Notifications" });

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm<NotificationFormType>({
    reValidateMode: "onChange",
    resolver: zodResolver(NotificationFormSchema),
    defaultValues: {
      inFuture: false,
      isDraft: false,
    },
  });

  // TODO there is neither singular version of this, nor a pk filter
  const { data, loading: isLoading } = useQuery<Query>(
    BANNER_NOTIFICATIONS_LIST,
    {
      skip: !id,
      onCompleted: (data) => {
        const notification = data?.bannerNotifications?.edges
          ?.map((edge) => edge?.node)
          .find((node) => node?.pk === id);

        const activeFrom = notification?.activeFrom
          ? valueForDateInput(notification.activeFrom)
          : "";
        const activeFromTime = notification?.activeFrom
          ? valueForTimeInput(notification?.activeFrom)
          : "";
        const activeUntil = notification?.activeUntil
          ? valueForDateInput(notification?.activeUntil)
          : "";
        const activeUntilTime = notification?.activeUntil
          ? valueForTimeInput(notification?.activeUntil)
          : "";
        reset({
          name: notification?.name ?? "",
          // Should these be automatic or no?
          inFuture: notification?.state === BannerNotificationState.Scheduled,
          isDraft: notification?.state === BannerNotificationState.Draft,
          activeFrom,
          activeUntil,
          activeFromTime,
          activeUntilTime,
          // TODO enum checking, and default to reasonable values
          targetGroup: notification?.target
            ? { value: notification.target, label: notification.target }
            : { value: "", label: "" },
          level: notification?.level
            ? { value: notification.level, label: notification.level }
            : { value: "", label: "" },
          messageFi: notification?.messageFi ?? "",
          messageEn: notification?.messageEn ?? "",
          messageSv: notification?.messageSv ?? "",
          // TODO strip out the pk in the submit if it's 0 (new)
          // also use different mutation (create vs update)
          pk: notification?.pk ?? 0,
        });
      },
    }
  );

  const notification = data?.bannerNotifications?.edges
    ?.map((edge) => edge?.node)
    .find((node) => node?.pk === id);

  // TODO mutation need to split between create and update
  const onSubmit = (data: NotificationFormType) => {
    if (data.pk === 0) {
      console.log("create", data);
    } else {
      console.log("update", data);
    }
  };

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`form.errors.${errorMsg}`) : "";

  if (isLoading) {
    return <Loader />;
  }

  const levelOptions = [
    { value: "NORMAL", label: t("level.NORMAL") },
    { value: "WARNING", label: t("level.WARNING") },
    { value: "EXCEPTION", label: t("level.EXCEPTION") },
  ];
  const targetGroupOptions = [
    { value: "ALL", label: t("target.ALL") },
    { value: "STAFF", label: t("target.STAFF") },
    { value: "USER", label: t("target.USER") },
  ];

  return (
    <GridForm onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1 style={{ gridColumn: "1 / -1" }}>
        {id ? notification?.name ?? t("noName") : t("newNotification")}
      </h1>
      <Controller
        control={control}
        name="inFuture"
        render={({ field: { onChange, value } }) => (
          <SelectionGroup
            label={t("form.selectionWhen")}
            style={{ gridColumn: "1 / -1" }}
          >
            <RadioButton
              id="v-radio1"
              name="v-radio"
              value="false"
              label={t("form.now")}
              checked={!value}
              onChange={(evt) => onChange(!evt.target.checked)}
            />
            <RadioButton
              id="v-radio2"
              name="v-radio"
              value="true"
              label={t("form.inFuture")}
              checked={value}
              onChange={(evt) => onChange(evt.target.checked)}
            />
          </SelectionGroup>
        )}
      />
      {watch("inFuture") && (
        <>
          <ControlledDateInput
            id="notification-active-from"
            label={t("form.activeFromDate")}
            name="activeFrom"
            control={control}
            error={translateError(errors.activeFrom?.message)}
            required
          />
          <ControlledTimeInput
            id="notification-active-from-time"
            label={t("form.activeFromTime")}
            name="activeFromTime"
            control={control}
            error={translateError(errors.activeFromTime?.message)}
            required
          />
        </>
      )}
      <ControlledDateInput
        id="notification-active-until"
        label={t("form.activeUntilDate")}
        name="activeUntil"
        control={control}
        error={translateError(errors.activeUntil?.message)}
        required
      />
      <ControlledTimeInput
        id="notification-active-until-time"
        label={t("form.activeUntilTime")}
        name="activeUntilTime"
        control={control}
        error={translateError(errors.activeUntilTime?.message)}
        required
      />
      <TextInput
        id="notification-name"
        {...register("name")}
        placeholder={t("form.namePlaceholder")}
        required
        label={t("headings.name")}
        style={{ gridColumn: "1 / -1" }}
        errorText={translateError(errors.name?.message)}
      />
      <Controller
        control={control}
        name="level"
        render={({ field }) => (
          <Select
            id="notification-level"
            label={t("form.level")}
            options={levelOptions}
            placeholder={t("form.selectPlaceholder")}
            {...field}
            error={translateError(errors.level?.message)}
            required
          />
        )}
      />
      <Controller
        control={control}
        name="targetGroup"
        render={({ field }) => (
          <Select
            id="notification-target-group"
            label={t("headings.targetGroup")}
            options={targetGroupOptions}
            placeholder={t("form.selectPlaceholder")}
            {...field}
            error={translateError(errors.targetGroup?.message)}
            required
          />
        )}
      />
      <Controller
        control={control}
        name="messageFi"
        render={({ field: { value, onChange } }) => (
          <RichTextInput
            id="notification-text-fi"
            label={t("form.messageFi")}
            style={{ gridColumn: "1 / -1" }}
            onChange={(val) => onChange(val)}
            value={value}
            errorText={
              errors.messageFi?.message
                ? translateError(errors.messageFi?.message)
                : undefined
            }
            required
          />
        )}
      />
      <Controller
        control={control}
        name="messageEn"
        render={({ field: { value, onChange } }) => (
          <RichTextInput
            id="notification-text-en"
            label={t("form.messageEn")}
            style={{ gridColumn: "1 / -1" }}
            onChange={(val) => onChange(val)}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="messageSv"
        render={({ field: { value, onChange } }) => (
          <RichTextInput
            id="notification-text-sv"
            label={t("form.messageSv")}
            style={{ gridColumn: "1 / -1" }}
            onChange={(val) => onChange(val)}
            value={value}
          />
        )}
      />
      <ButtonContainer>
        {/* TODO don't nest Link and Button */}
        <Link to="..">
          <Button variant="secondary" type="button">
            {t("form.cancel")}
          </Button>
        </Link>
        <Button
          style={{ marginLeft: "auto" }}
          variant="secondary"
          type="button"
          // TODO submit the form in draft state
        >
          {t("form.saveDraft")}
        </Button>
        <Button type="submit">{t("form.save")}</Button>
      </ButtonContainer>
    </GridForm>
  );
};

// We don't have proper layouts yet, so just separate the container stuff here
// TODO add id to the breadcrumb
const PageWrapped = ({ id }: Props) => (
  <>
    <BreadcrumbWrapper
      route={[
        "messaging",
        `${publicUrl}/messaging/notifications`,
        id != null && id > 0 ? "editNotification" : "newNotification",
      ]}
    />
    <Container>
      <Page id={id} />
    </Container>
  </>
);

const PageRouted = () => {
  const { id } = useParams<{ id: string }>();
  console.log(id);
  if (!id || (id !== "new" && Number.isNaN(Number(id)))) {
    return <div>Invalid ID</div>;
  }
  // TODO new unitialised should not do a query
  if (id === "new") {
    return <PageWrapped id={0} />;
  }

  return <PageWrapped id={Number(id)} />;
};

export default PageRouted;
