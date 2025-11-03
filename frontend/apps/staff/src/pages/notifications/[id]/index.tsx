import React, { type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { ApolloError, gql } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  ButtonVariant,
  IconCheck,
  IconClock,
  IconPen,
  RadioButton,
  SelectionGroup,
  TextInput,
} from "hds-react";
import { type GetServerSidePropsContext } from "next";
import { useTranslation, type TFunction } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import styled from "styled-components";
import { z } from "zod";
import { cleanHtmlContent } from "ui/src/components/Sanitize";
import StatusLabel, { type StatusLabelType } from "ui/src/components/StatusLabel";
import { ControlledDateInput } from "ui/src/components/form";
import { ControlledSelect } from "ui/src/components/form/ControlledSelect";
import { successToast } from "ui/src/components/toast";
import { useDisplayError } from "ui/src/hooks";
import { parseUIDate, fromUIDateTime, formatDate, formatTime } from "ui/src/modules/date-utils";
import { createNodeId, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import {
  checkValidDate,
  checkValidFutureDate,
  checkTimeStringFormat,
  checkLengthWithoutHtml,
} from "ui/src/schemas/schemaCommon";
import { CenterSpinner, Flex, TitleSection, H1 } from "ui/src/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { ButtonLikeLink } from "@/components/ButtonLikeLink";
import { ControlledTimeInput } from "@/components/ControlledTimeInput";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getNotificationListUrl } from "@/modules/urls";
import {
  BannerNotificationState,
  BannerNotificationLevel,
  BannerNotificationTarget,
  useBannerNotificationDeleteMutation,
  useBannerNotificationUpdateMutation,
  useBannerNotificationCreateMutation,
  useBannerNotificationPageQuery,
  type BannerNotificationPageQuery,
  UserPermissionChoice,
} from "@gql/gql-types";

const RichTextInput = dynamic(() => import("@/components/RichTextInput"), {
  ssr: false,
});

const StyledStatusLabel = styled(StatusLabel)`
  align-self: center;
  white-space: nowrap;
`;

type NotificationStatus = {
  type: StatusLabelType;
  icon: JSX.Element;
};

function BannerNotificationStatusLabel({ state }: { state: BannerNotificationState }) {
  const statusLabelProps = ((s: BannerNotificationState): NotificationStatus => {
    switch (s) {
      case BannerNotificationState.Draft:
        return { type: "draft", icon: <IconPen /> };
      case BannerNotificationState.Active:
        return { type: "success", icon: <IconCheck /> };
      case BannerNotificationState.Scheduled:
        return { type: "info", icon: <IconClock /> };
    }
  })(state);

  const { t } = useTranslation();

  return (
    <StyledStatusLabel type={statusLabelProps.type} icon={statusLabelProps.icon}>
      {t(`notification:state.${state}`)}
    </StyledStatusLabel>
  );
}

const ButtonContainerCommon = styled(Flex).attrs({
  $justifyContent: "space-between",
  $alignItems: "center",
  $gap: "l",
  $direction: "row",
})``;

const ButtonContainer = styled(ButtonContainerCommon)`
  grid-column: 1 / -1;
`;

const InnerButtons = styled(ButtonContainerCommon)`
  flex-grow: 1;
  flex-wrap: wrap;
`;

function checkStartIsBeforeEnd(
  data: {
    activeFrom: string;
    activeUntil: string;
    activeFromTime: string;
    activeUntilTime: string;
  },
  ctx: z.RefinementCtx
) {
  const start = fromUIDateTime(data.activeFrom, data.activeFromTime);
  const end = fromUIDateTime(data.activeUntil, data.activeUntilTime);
  if (start && end && start > end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      // NOTE Don't add to multiple paths, it hides the error message
      // TODO this is problematic because it doesn't update if any of the other fields change
      path: ["activeUntil"],
      message: "End time needs to be after start time.",
    });
  }
}

function getHTMLMessageSchema(minLength: number, maxLength: number) {
  return z
    .string()
    .max(1000)
    .transform(cleanHtmlContent)
    .superRefine((x, ctx) => {
      checkLengthWithoutHtml(x, ctx, "", minLength, maxLength);
    });
}

const NotificationFormSchema = z
  .object({
    name: z.string().min(1, { error: "Required" }).max(100),
    inFuture: z.boolean(),
    isDraft: z.boolean(),
    activeFrom: z.string(),
    activeFromTime: z.string(),
    activeUntil: z.string(),
    activeUntilTime: z.string(),
    // NOTE max length is because backend doesn't allow over 1000 characters
    // strip HTML when validating string length
    // for now only finnish is mandatory but all have max length
    messageFi: getHTMLMessageSchema(1, 500),
    messageEn: getHTMLMessageSchema(0, 500),
    messageSv: getHTMLMessageSchema(0, 500),
    // refinement is not empty for these two (not having empty as an option forces a default value)
    targetGroup: z.enum(BannerNotificationTarget, { error: "Required" }),
    level: z.enum(BannerNotificationLevel, { error: "Required" }),
    pk: z.number(),
  })
  // skip date time validation for drafts if both fields are empty
  // if draft and time or date input validate both (can't construct date without both)
  // published requires a DateTime (past is fine)
  .superRefine((x, ctx) => {
    if (!x.isDraft && (x.activeFrom !== "" || x.activeFromTime !== "")) {
      checkTimeStringFormat(x.activeFromTime, ctx, "activeFromTime");
      checkValidDate(parseUIDate(x.activeFrom), ctx, "activeFrom");
    }
  })
  // End time can't be in the past unless it's a draft
  // TODO future date check doesn't check for today time, so it's possible to set now() - 2h as the end time
  .superRefine((x, ctx) => {
    if (!x.isDraft && (x.activeUntil !== "" || x.activeUntilTime !== "")) {
      checkTimeStringFormat(x.activeUntilTime, ctx, "activeUntilTime");
      if (!x.isDraft) {
        checkValidFutureDate(parseUIDate(x.activeUntil), ctx, "activeUntil");
      } else {
        checkValidDate(parseUIDate(x.activeUntil), ctx, "activeUntil");
      }
    }
  })
  .superRefine((val, ctx) => checkStartIsBeforeEnd(val, ctx));

type NotificationFormType = z.infer<typeof NotificationFormSchema>;

const GridForm = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-l);
`;

/// @brief This is the create / edit page for a single notification.
const NotificationForm = ({ notification }: { notification?: BannerNotificationPageQuery["bannerNotification"] }) => {
  const { t } = useTranslation("notification");

  const today = new Date();
  const activeFromDate = notification?.activeFrom ? new Date(notification?.activeFrom) : today;
  const activeFrom = formatDate(activeFromDate);
  const activeFromTime = activeFromDate ? formatTime(activeFromDate) : "06:00";
  const activeUntilDate = notification?.activeUntil ? new Date(notification?.activeUntil) : null;
  const activeUntil = activeUntilDate ? formatDate(activeUntilDate) : "";
  const activeUntilTime = notification?.activeUntil ? formatTime(new Date(notification?.activeUntil)) : "23:59";

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
      inFuture: notification ? notification?.state === BannerNotificationState.Scheduled : false,
      // draft mode is set separately on button press
      isDraft: false,
      activeFrom,
      activeUntil,
      activeFromTime,
      activeUntilTime,
      targetGroup: notification?.target,
      level: notification?.level,
      messageFi: notification?.messageFi ?? "",
      messageEn: notification?.messageEn ?? "",
      messageSv: notification?.messageSv ?? "",
      pk: notification?.pk ?? 0,
    },
  });

  const [createMutation] = useBannerNotificationCreateMutation();
  const [updateMutation] = useBannerNotificationUpdateMutation();

  const router = useRouter();
  const displayError = useDisplayError();

  const onSubmit = async (data: NotificationFormType) => {
    const end = fromUIDateTime(data.activeUntil, data.activeUntilTime);
    const start = fromUIDateTime(data.activeFrom, data.activeFromTime);

    const input = {
      name: data.name,
      // either both needs to be defined or neither
      // for drafts null is fine, published it's not (schema checks)
      activeFrom: start != null && end != null ? start.toISOString() : null,
      activeUntil: start != null && end != null ? end.toISOString() : null,
      draft: data.isDraft,
      message: data.messageFi,
      messageEn: data.messageEn,
      messageSv: data.messageSv,
      target: data.targetGroup,
      level: data.level,
      pk: data.pk,
    };
    const mutationFn = data.pk === 0 ? createMutation : updateMutation;
    try {
      await mutationFn({
        variables: {
          input,
        },
      });
      successToast({
        text: t("form.saveSuccessToast", {
          name: data.name,
          state: data.pk === 0 ? t("form.created") : t("form.updated"),
        }),
      });
      router.push(getNotificationListUrl());
    } catch (e) {
      displayError(e);
    }
  };

  const translateError = (errorMsg?: string) => (errorMsg ? t(`forms:errors.${errorMsg}`) : "");

  const levelOptions = Object.values(BannerNotificationLevel).map((x) => ({
    value: x,
    label: t(`levelEnum.${x}`),
  }));
  const targetGroupOptions = Object.values(BannerNotificationTarget).map((x) => ({
    value: x,
    label: t(`target.${x}`),
  }));

  return (
    <GridForm onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        control={control}
        name="inFuture"
        render={({ field: { onChange, value } }) => (
          <SelectionGroup label={t("form.selectionWhen")} style={{ gridColumn: "1 / -1" }}>
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
        data-testid="Notification__Page--name-input"
      />
      <ControlledSelect
        control={control}
        name="level"
        label={t("form.level")}
        options={levelOptions}
        placeholder={t("form.selectPlaceholder")}
        error={translateError(errors.level?.message)}
        required
      />
      <ControlledSelect
        control={control}
        name="targetGroup"
        label={t("headings.targetGroup")}
        options={targetGroupOptions}
        placeholder={t("form.selectPlaceholder")}
        error={translateError(errors.targetGroup?.message)}
        required
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
            errorText={errors.messageFi?.message ? translateError(errors.messageFi.message) : undefined}
            required
            data-testid="Notification__Page--message-fi-input"
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
            errorText={errors.messageEn?.message ? translateError(errors.messageEn.message) : undefined}
            value={value}
            data-testid="Notification__Page--message-en-input"
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
            errorText={errors.messageSv?.message ? translateError(errors.messageSv.message) : undefined}
            value={value}
            data-testid="Notification__Page--message-sv-input"
          />
        )}
      />
      <ButtonContainer>
        <InnerButtons>
          <ButtonLikeLink
            variant={ButtonVariant.Secondary}
            size="large"
            href={getNotificationListUrl()}
            data-testid="Notification__Page--cancel-button"
          >
            {t("form.cancel")}
          </ButtonLikeLink>
          <Button
            variant={ButtonVariant.Secondary}
            type="button"
            onClick={() => {
              setValue("isDraft", true);
              handleSubmit(onSubmit)();
            }}
            data-testid="Notification__Page--save-draft-button"
          >
            {t("form.saveDraft")}
          </Button>
        </InnerButtons>
        <div>
          <Button type="submit" data-testid="Notification__Page--publish-button">
            {t("form.save")}
          </Button>
        </div>
      </ButtonContainer>
    </GridForm>
  );
};

function getName(isNew: boolean, isLoading: boolean, name: string | undefined, t: TFunction) {
  if (name) {
    return name;
  }
  if (isLoading) {
    return t("notification:isLoading");
  }
  if (isNew) {
    return t("notification:newNotification");
  }
  return t("notification:error.notFound");
}

function useRemoveNotification({ notification }: { notification?: BannerNotificationPageQuery["bannerNotification"] }) {
  const { t } = useTranslation();

  const [removeMutation] = useBannerNotificationDeleteMutation();

  const router = useRouter();
  const displayError = useDisplayError();

  const removeNotification = async () => {
    try {
      const res = await removeMutation({
        variables: {
          input: {
            pk: String(notification?.pk ?? 0),
          },
        },
      });
      if (res.errors != null && res.errors?.length > 0) {
        throw new ApolloError({
          graphQLErrors: res.errors,
        });
      }

      successToast({ text: t("notification:success.removed") });
      router.replace(getNotificationListUrl());
    } catch (e) {
      displayError(e);
    }
  };

  return removeNotification;
}

function LoadedContent({
  isNew,
  notification,
  children,
}: {
  isNew: boolean;
  notification?: BannerNotificationPageQuery["bannerNotification"];
  children?: ReactNode;
}) {
  const { t } = useTranslation();

  const removeNotification = useRemoveNotification({ notification });

  const name = getName(isNew, false, notification?.name, t);
  return (
    <>
      <TitleSection>
        <H1 $noMargin>{name}</H1>
        {notification?.state && <BannerNotificationStatusLabel state={notification.state} />}
      </TitleSection>
      {(notification || isNew) && <NotificationForm notification={notification ?? undefined} />}
      {notification && (
        <ButtonContainer style={{ marginTop: "2rem", justifyContent: "flex-start" }}>
          <Button onClick={removeNotification} variant={ButtonVariant.Secondary}>
            {t("notification:deleteButton")}
          </Button>
        </ButtonContainer>
      )}
      {children}
    </>
  );
}

/// @param pk: primary key of the notification to edit, null for new notification, NaN for error
/// Client only: uses hooks, window, and react-router-dom
/// We don't have proper layouts yet, so just separate the container stuff here
function PageWrapped({ pk }: { pk?: number }): JSX.Element {
  const { data, loading: isLoading } = useBannerNotificationPageQuery({
    skip: !pk,
    variables: { id: createNodeId("BannerNotificationNode", pk ?? 0) },
  });

  const notification = data?.bannerNotification ?? undefined;

  const isNew = pk === 0;

  return isLoading ? <CenterSpinner /> : <LoadedContent isNew={isNew} notification={notification} />;
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page({ apiBaseUrl, pk }: PropsNarrowed): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={apiBaseUrl} permission={UserPermissionChoice.CanManageNotifications}>
      <PageWrapped pk={pk} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id)) ?? 0;
  const isNew = query.id === "new";

  if (!isNew && pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }
  return {
    props: {
      pk: isNew ? 0 : pk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const BANNER_NOTIFICATIONS_CREATE = gql`
  mutation BannerNotificationCreate($input: BannerNotificationCreateMutationInput!) {
    createBannerNotification(input: $input) {
      pk
    }
  }
`;

export const BANNER_NOTIFICATIONS_UPDATE = gql`
  mutation BannerNotificationUpdate($input: BannerNotificationUpdateMutationInput!) {
    updateBannerNotification(input: $input) {
      pk
    }
  }
`;

export const BANNER_NOTIFICATIONS_DELETE = gql`
  mutation BannerNotificationDelete($input: BannerNotificationDeleteMutationInput!) {
    deleteBannerNotification(input: $input) {
      deleted
    }
  }
`;

export const BANNER_NOTIFICATION_PAGE_QUERY = gql`
  query BannerNotificationPage($id: ID!) {
    bannerNotification(id: $id) {
      id
      pk
      level
      activeFrom
      messageEn
      messageFi
      messageSv
      name
      target
      activeUntil
      draft
      state
    }
  }
`;
