import React from "react";
import dynamic from "next/dynamic";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  RadioButton,
  Select,
  SelectionGroup,
  Tag,
  TextInput,
} from "hds-react";
import {
  BannerNotificationState,
  BannerNotificationType,
  Level,
  Target,
  type Mutation,
  type Query,
  type MutationUpdateBannerNotificationArgs,
  type MutationCreateBannerNotificationArgs,
} from "common/types/gql-types";
import { BANNER_NOTIFICATIONS_ADMIN_LIST } from "common/src/components/BannerNotificationsQuery";
import { H1 } from "common/src/common/typography";
import { Container } from "app/styles/layout";
import BreadcrumbWrapper from "app/component/BreadcrumbWrapper";
import { publicUrl } from "app/common/const";
import Loader from "app/component/Loader";
import ControlledDateInput from "../my-units/components/ControlledDateInput";
import {
  valueForDateInput,
  valueForTimeInput,
  dateTime,
} from "../ReservationUnits/ReservationUnitEditor/DateTimeInput";
import ControlledTimeInput from "../my-units/components/ControlledTimeInput";
import { useNotification } from "app/context/NotificationContext";

const RichTextInput = dynamic(() => import("app/component/RichTextInput"), {
  ssr: false,
});

const BANNER_NOTIFICATIONS_CREATE = gql`
  mutation ($input: BannerNotificationCreateMutationInput!) {
    createBannerNotification(input: $input) {
      pk
      errors {
        messages
      }
    }
  }
`;

const BANNER_NOTIFICATIONS_UPDATE = gql`
  mutation ($input: BannerNotificationUpdateMutationInput!) {
    updateBannerNotification(input: $input) {
      pk
      errors {
        messages
      }
    }
  }
`;

// helpers so we get typechecking without casting
const convertLevel = (level: "EXCEPTION" | "NORMAL" | "WARNING"): Level => {
  switch (level) {
    case "EXCEPTION":
      return Level.Exception;
    case "NORMAL":
      return Level.Normal;
    case "WARNING":
      return Level.Warning;
  }
};

const convertTarget = (target: "ALL" | "STAFF" | "USER"): Target => {
  switch (target) {
    case "ALL":
      return Target.All;
    case "STAFF":
      return Target.Staff;
    case "USER":
      return Target.User;
  }
};

function BannerNotificationStateTag({
  state,
}: {
  state: BannerNotificationState;
}) {
  const color = ((s: BannerNotificationState) => {
    switch (s) {
      case BannerNotificationState.Draft:
        return "var(--color-summer-light)";
      case BannerNotificationState.Active:
        return "var(--color-bus-light)";
      case BannerNotificationState.Scheduled:
        return "var(--color-black-5)";
    }
  })(state);

  const { t } = useTranslation();

  return (
    <Tag
      theme={{ "--tag-background": color }}
      labelProps={{ style: { whiteSpace: "nowrap" } }}
    >
      {t(`Notifications.state.${state}`)}
    </Tag>
  );
}

const StatusTagContainer = styled.div`
  display: grid;
  justify-items: justify-between;
  grid-column: 1 / -1;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(4, 1fr);
`;

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
  // refinement is not empty for these two (not having empty as option forces a default value)
  targetGroup: z.enum(["", "ALL", "STAFF", "USER"]),
  level: z.enum(["", "EXCEPTION", "NORMAL", "WARNING"]),
  pk: z.number(),
});

type NotificationFormType = z.infer<typeof NotificationFormSchema>;

const GridForm = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

/// @brief This is the create / edit page for a single notification.
const Page = ({ notification }: { notification?: BannerNotificationType }) => {
  const { t } = useTranslation("translation", { keyPrefix: "Notifications" });

  // const activeFrom = data.activeFrom !== "" ? dateTime(data.activeFrom, data.activeFromTime) : undefined;
  const today = new Date();
  const activeFrom = valueForDateInput(
    notification?.activeFrom ?? today.toISOString()
  );
  const activeFromTime = valueForTimeInput(
    notification?.activeFrom ?? today.toISOString()
  );
  const activeUntil = notification?.activeUntil
    ? valueForDateInput(notification?.activeUntil)
    : "";
  const activeUntilTime = notification?.activeUntil
    ? valueForTimeInput(notification?.activeUntil)
    : "";

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NotificationFormType>({
    reValidateMode: "onChange",
    resolver: zodResolver(NotificationFormSchema),
    defaultValues: {
      name: notification?.name ?? "",
      inFuture: notification
        ? notification?.state === BannerNotificationState.Scheduled
        : false,
      isDraft: notification
        ? notification?.state === BannerNotificationState.Draft
        : false,
      activeFrom,
      activeUntil,
      activeFromTime,
      activeUntilTime,
      targetGroup: notification?.target ?? "",
      level: notification?.level ?? "",
      messageFi: notification?.messageFi ?? "",
      messageEn: notification?.messageEn ?? "",
      messageSv: notification?.messageSv ?? "",
      pk: notification?.pk ?? 0,
    },
  });

  const [createMutation] = useMutation<
    Mutation,
    MutationCreateBannerNotificationArgs
  >(BANNER_NOTIFICATIONS_CREATE);
  const [updateMutation] = useMutation<
    Mutation,
    MutationUpdateBannerNotificationArgs
  >(BANNER_NOTIFICATIONS_UPDATE);

  const { notifyError, notifySuccess } = useNotification();
  // For now the errors are just strings, so print them out
  const handleError = (errors: string[]) => {
    console.error(errors);
    // TODO add a generic error notification
    notifyError(errors.join(", "));
  };

  const onSubmit = async (data: NotificationFormType) => {
    const activeUntil = dateTime(data.activeUntil, data.activeUntilTime);
    const activeFrom =
      data.activeFrom !== ""
        ? dateTime(data.activeFrom, data.activeFromTime)
        : undefined;

    // TODO: hack, use schema refinement
    if (data.targetGroup === "" || data.level === "") {
      notifyError(t("Notifications.error.empty"));
      return;
    }

    const input = {
      name: data.name,
      activeFrom,
      activeUntil,
      draft: data.isDraft,
      messageFi: data.messageFi,
      messageEn: data.messageEn,
      messageSv: data.messageSv,
      target: convertTarget(data.targetGroup),
      level: convertLevel(data.level),
      ...(data.pk !== 0 && { pk: data.pk }),
    };
    const mutationFn = data.pk === 0 ? createMutation : updateMutation;
    try {
      const res = await mutationFn({
        variables: {
          input,
        },
        onError: (e) => {
          console.error("error", e);
          handleError(e.graphQLErrors.map((err) => err.message));
        },
      });
      console.log("res", res);
      if (res?.data?.createBannerNotification?.errors) {
        const { errors } = res.data.createBannerNotification;
        // TODO error translations and logic
        handleError(
          errors.map((err) => err?.messages?.join(", ") ?? "unknown error")
        );
      } else {
        notifySuccess("notification saved");
      }
    } catch (e) {
      // TODO what is the format of these errors?
      console.error("error", e);
      // handleError(e.graphQLErrors.map((err) => err.message));
    }
  };

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`form.errors.${errorMsg}`) : "";

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

  // TODO logic here
  // draft always if selected (editing a draft, new ones can't be draft)
  // scheduled if start is in future
  // active otherwise (though if it's in the past only backend probably thinks of it as draft?)
  const state = watch("isDraft")
    ? BannerNotificationState.Draft
    : BannerNotificationState.Active;
  return (
    <GridForm onSubmit={handleSubmit(onSubmit)} noValidate>
      <StatusTagContainer>
        <H1 $legacy style={{ gridColumn: "1 / span 5", gridRow: "1 / span 4" }}>
          {notification
            ? notification?.name ?? t("noName")
            : t("newNotification")}
        </H1>
        {notification && <BannerNotificationStateTag state={state} />}
      </StatusTagContainer>
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
        render={({ field: { value, onChange } }) => (
          <Select<{ value: string; label: string }>
            id="notification-level"
            label={t("form.level")}
            options={levelOptions}
            placeholder={t("form.selectPlaceholder")}
            onChange={({ value }: { value: string; label: string }) =>
              onChange(value)
            }
            value={{
              value: value,
              label: value !== "" ? t(`level.${value}`) : "",
            }}
            error={translateError(errors.level?.message)}
            required
          />
        )}
      />
      <Controller
        control={control}
        name="targetGroup"
        render={({ field: { value, onChange } }) => (
          <Select<{ value: string; label: string }>
            id="notification-target-group"
            label={t("headings.targetGroup")}
            options={targetGroupOptions}
            placeholder={t("form.selectPlaceholder")}
            onChange={({ value }: { value: string; label: string }) =>
              onChange(value)
            }
            value={{
              value: value,
              label: value !== "" ? t(`target.${value}`) : "",
            }}
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
          onClick={() => {
            setValue("isDraft", true);
            handleSubmit(onSubmit)();
          }}
        >
          {t("form.saveDraft")}
        </Button>
        <Button type="submit">{t("form.save")}</Button>
      </ButtonContainer>
    </GridForm>
  );
};

// We don't have proper layouts yet, so just separate the container stuff here
const PageWrapped = ({ id }: Props) => {
  // TODO there is neither singular version of this, nor a pk filter
  const { data, loading: isLoading } = useQuery<Query>(
    BANNER_NOTIFICATIONS_ADMIN_LIST,
    { skip: !id }
  );
  const { t } = useTranslation();

  const notification = data?.bannerNotifications?.edges
    ?.map((edge) => edge?.node)
    .find((node) => node?.pk === id);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      {/* TODO if new page should show "Back" button instead of breadcrumb */}
      <BreadcrumbWrapper
        route={[
          { slug: "messaging" },
          {
            slug: `${publicUrl}/messaging/notifications`,
            alias: t("breadcrumb.notifications"),
          },
          {
            slug: "",
            alias: notification
              ? notification.name
              : t("breadcrumb.newNotification"),
          },
        ]}
      />
      <Container>
        <Page notification={notification ?? undefined} />
      </Container>
    </>
  );
};

const PageRouted = () => {
  // TODO can_manage_notifications permission

  const { id } = useParams<{ id: string }>();
  if (!id || (id !== "new" && Number.isNaN(Number(id)))) {
    return <div>Invalid ID</div>;
  }
  if (id === "new") {
    return <PageWrapped id={0} />;
  }

  return <PageWrapped id={Number(id)} />;
};

export default PageRouted;
