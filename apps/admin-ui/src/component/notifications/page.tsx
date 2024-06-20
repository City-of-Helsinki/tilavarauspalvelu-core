import React, { type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useParams, useNavigate } from "react-router-dom";
import { gql, ApolloError } from "@apollo/client";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
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
  BannerNotificationLevel,
  BannerNotificationTarget,
  useBannerNotificationDeleteMutation,
  useBannerNotificationUpdateMutation,
  useBannerNotificationCreateMutation,
  useBannerNotificationsAdminQuery,
  type BannerNotificationsAdminQuery,
} from "@gql/gql-types";
import { H1 } from "common/src/common/typography";
import { fromUIDate } from "common/src/common/util";
import { breakpoints } from "common";
import { Container } from "app/styles/layout";
import BreadcrumbWrapper from "app/component/BreadcrumbWrapper";
import Loader from "app/component/Loader";
import { useNotification } from "app/context/NotificationContext";
import { ButtonLikeLink } from "app/component/ButtonLikeLink";
import {
  checkValidDate,
  checkValidFutureDate,
  checkTimeStringFormat,
  checkLengthWithoutHtml,
} from "common/src/schemas/schemaCommon";
import {
  valueForDateInput,
  valueForTimeInput,
  dateTime,
  parseDateTimeSafe,
} from "@/helpers";
import type { TFunction } from "i18next";
import ControlledDateInput from "../my-units/components/ControlledDateInput";
import ControlledTimeInput from "../my-units/components/ControlledTimeInput";
import { base64encode } from "common/src/helpers";

const RichTextInput = dynamic(() => import("@/component/RichTextInput"), {
  ssr: false,
});

// export for codegen (otherwise they might get removed)
export const BANNER_NOTIFICATIONS_CREATE = gql`
  mutation BannerNotificationCreate(
    $input: BannerNotificationCreateMutationInput!
  ) {
    createBannerNotification(input: $input) {
      pk
    }
  }
`;

export const BANNER_NOTIFICATIONS_UPDATE = gql`
  mutation BannerNotificationUpdate(
    $input: BannerNotificationUpdateMutationInput!
  ) {
    updateBannerNotification(input: $input) {
      pk
    }
  }
`;

export const BANNER_NOTIFICATIONS_DELETE = gql`
  mutation BannerNotificationDelete(
    $input: BannerNotificationDeleteMutationInput!
  ) {
    deleteBannerNotification(input: $input) {
      deleted
    }
  }
`;

// helpers so we get typechecking without casting
function convertLevel(
  level: "EXCEPTION" | "NORMAL" | "WARNING"
): BannerNotificationLevel {
  switch (level) {
    case "EXCEPTION":
      return BannerNotificationLevel.Exception;
    case "NORMAL":
      return BannerNotificationLevel.Normal;
    case "WARNING":
      return BannerNotificationLevel.Warning;
  }
}

function convertTarget(
  target: "ALL" | "STAFF" | "USER"
): BannerNotificationTarget {
  switch (target) {
    case "ALL":
      return BannerNotificationTarget.All;
    case "STAFF":
      return BannerNotificationTarget.Staff;
    case "USER":
      return BannerNotificationTarget.User;
  }
}

const StyledTag = styled(Tag)`
  justify-content: center;
`;

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
    <StyledTag
      theme={{ "--tag-background": color }}
      labelProps={{ style: { whiteSpace: "nowrap" } }}
    >
      {t(`Notifications.state.${state}`)}
    </StyledTag>
  );
}

const StatusTagContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: var(--spacing-s);
  & > h1 {
    margin-top: 0;
  }
  @media (width > ${breakpoints.s}) {
    margin-top: var(--spacing-l);
  }
`;

const ButtonContainerCommon = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-l);
`;
const ButtonContainer = styled(ButtonContainerCommon)`
  grid-column: 1 / -1;
`;

const InnerButtons = styled(ButtonContainerCommon)`
  flex-grow: 1;
  flex-wrap: wrap;
`;

const checkStartIsBeforeEnd = (
  data: {
    activeFrom: string;
    activeUntil: string;
    activeFromTime: string;
    activeUntilTime: string;
  },
  ctx: z.RefinementCtx
) => {
  const start = parseDateTimeSafe(data.activeFrom, data.activeFromTime);
  const end = parseDateTimeSafe(data.activeUntil, data.activeUntilTime);
  if (start && end && start > end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      // NOTE Don't add to multiple paths, it hides the error message
      // TODO this is problematic because it doesn't update if any of the other fields change
      path: ["activeUntil"],
      message: "End time needs to be after start time.",
    });
  }
};

const NotificationFormSchema = z
  .object({
    name: z.string().min(1).max(100),
    inFuture: z.boolean(),
    isDraft: z.boolean(),
    activeFrom: z.string(),
    activeFromTime: z.string(),
    activeUntil: z.string(),
    activeUntilTime: z.string(),
    // NOTE max length is because backend doesn't allow over 1000 characters
    messageFi: z.string().max(1000),
    messageEn: z.string().max(1000),
    messageSv: z.string().max(1000),
    // refinement is not empty for these two (not having empty as an option forces a default value)
    targetGroup: z.enum(["", "ALL", "STAFF", "USER"]).refine((x) => x !== "", {
      message: "Target group cannot be empty",
    }),
    level: z
      .enum(["", "EXCEPTION", "NORMAL", "WARNING"])
      .refine((x) => x !== "", {
        message: "Level cannot be empty",
      }),
    pk: z.number(),
  })
  // strip HTML when validating string length
  // for now only finnish is mandatory but all have max length
  .superRefine((x, ctx) => {
    checkLengthWithoutHtml(x.messageFi, ctx, "messageFi", 1, 500);
  })
  .superRefine((x, ctx) => {
    checkLengthWithoutHtml(x.messageEn, ctx, "messageEn", 0, 500);
  })
  .superRefine((x, ctx) => {
    checkLengthWithoutHtml(x.messageSv, ctx, "messageSv", 0, 500);
  })
  // skip date time validation for drafts if both fields are empty
  // if draft and time or date input validate both (can't construct date without both)
  // published requires a DateTime (past is fine)
  .superRefine((x, ctx) => {
    if (!x.isDraft || x.activeFrom !== "" || x.activeFromTime !== "") {
      checkTimeStringFormat(x.activeFromTime, ctx, "activeFromTime");
      checkValidDate(fromUIDate(x.activeFrom), ctx, "activeFrom");
    }
  })
  // End time can't be in the past unless it's a draft
  // TODO future date check doesn't check for today time, so it's possible to set now() - 2h as the end time
  .superRefine((x, ctx) => {
    if (!x.isDraft || x.activeUntil !== "" || x.activeUntilTime !== "") {
      checkTimeStringFormat(x.activeUntilTime, ctx, "activeUntilTime");
      if (!x.isDraft) {
        checkValidFutureDate(fromUIDate(x.activeUntil), ctx, "activeUntil");
      } else {
        checkValidDate(fromUIDate(x.activeUntil), ctx, "activeUntil");
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
const NotificationForm = ({
  notification,
}: {
  notification?: BannerNotificationsAdminQuery["bannerNotification"];
}) => {
  const { t } = useTranslation("translation", { keyPrefix: "Notifications" });

  const today = new Date();
  const activeFrom = valueForDateInput(
    notification?.activeFrom ?? today.toISOString()
  );
  const activeFromTime = notification?.activeFrom
    ? valueForTimeInput(notification?.activeFrom)
    : "06:00";
  const activeUntil = notification?.activeUntil
    ? valueForDateInput(notification?.activeUntil)
    : "";
  const activeUntilTime = notification?.activeUntil
    ? valueForTimeInput(notification?.activeUntil)
    : "23:59";

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
      // draft mode is set separately on button press
      isDraft: false,
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

  const [createMutation] = useBannerNotificationCreateMutation();
  const [updateMutation] = useBannerNotificationUpdateMutation();

  const { notifyError, notifySuccess } = useNotification();

  // TODO rewrite this for the new error codes
  const handleError = (errorMsgs: string[]) => {
    // TODO improved filtering here
    const alreadyExists = errorMsgs.find(
      (x) => x === "banner notification jolla on tämä name, on jo olemassa."
    );
    const isMissingMessage = errorMsgs.find(
      (x) => x === "Non-draft notifications must have a message."
    );
    const isPermissionError = errorMsgs.find(
      (x) => x === "No permission to mutate."
    );
    if (alreadyExists) {
      notifyError(t("error.submit.alreadyExists"));
    } else if (isMissingMessage) {
      notifyError(t("error.submit.missingMessage"));
    } else if (isPermissionError) {
      notifyError(t("error.submit.noMutationPermission"));
    } else {
      // eslint-disable-next-line no-console
      console.error(errorMsgs);
      // We haven't properly mapped error messages
      notifyError(t("error.submit.generic"));
    }
  };

  const navigate = useNavigate();

  const onSubmit = async (data: NotificationFormType) => {
    const end = parseDateTimeSafe(data.activeUntil, data.activeUntilTime);
    const start =
      data.activeFrom !== ""
        ? dateTime(data.activeFrom, data.activeFromTime)
        : undefined;

    // Schema checks this, but TS doesn't know
    if (data.targetGroup === "" || data.level === "") {
      notifyError(t("Notifications.error.empty"));
      return;
    }

    const input = {
      name: data.name,
      // either both needs to be defined or neither
      // for drafts null is fine, published it's not (schema checks)
      activeFrom: start != null && end != null ? start : null,
      activeUntil: start != null && end != null ? end.toISOString() : null,
      draft: data.isDraft,
      message: data.messageFi,
      messageEn: data.messageEn,
      messageSv: data.messageSv,
      target: convertTarget(data.targetGroup),
      level: convertLevel(data.level),
      pk: data.pk,
    };
    const mutationFn = data.pk === 0 ? createMutation : updateMutation;
    try {
      await mutationFn({
        variables: {
          input,
        },
      });
      notifySuccess(
        t("form.saveSuccessToast", {
          name: data.name,
          state: data.pk === 0 ? t("form.created") : t("form.updated"),
        })
      );
      navigate("..");
    } catch (e) {
      // TODO what is the format of these errors?
      if (e instanceof ApolloError) {
        const gqlerrors = e.graphQLErrors;
        for (const err of gqlerrors) {
          if ("code" in err.extensions) {
            const { code } = err.extensions;
            if (code === "NOT_FOUND") {
              notifyError(t("error.submit.NOT_FOUND"));
              return;
            }
          }
        }
      }
      // eslint-disable-next-line no-console
      console.error("unkown error thrown:", e);
      // TODO this is not necessary gql error, for example notifySuccess can throw on null
      handleError(["gql threw an error"]);
    }
  };

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`form.errors.${errorMsg}`) : "";

  const levelOptions = [
    { value: "NORMAL", label: t("form.levelEnum.NORMAL") },
    { value: "WARNING", label: t("form.levelEnum.WARNING") },
    { value: "EXCEPTION", label: t("form.levelEnum.EXCEPTION") },
  ];
  const targetGroupOptions = [
    { value: "ALL", label: t("target.ALL") },
    { value: "STAFF", label: t("target.STAFF") },
    { value: "USER", label: t("target.USER") },
  ];

  return (
    <GridForm onSubmit={handleSubmit(onSubmit)} noValidate>
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
        data-testid="Notification__Page--name-input"
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
            onChange={(x: { value: string; label: string }) =>
              onChange(x.value)
            }
            value={{
              value,
              label: value !== "" ? t(`form.levelEnum.${value}`) : "",
            }}
            invalid={!!errors.level}
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
            onChange={(x: { value: string; label: string }) =>
              onChange(x.value)
            }
            value={{
              value,
              label: value !== "" ? t(`target.${value}`) : "",
            }}
            invalid={!!errors.targetGroup}
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
            value={value}
            data-testid="Notification__Page--message-sv-input"
          />
        )}
      />
      <ButtonContainer>
        <InnerButtons>
          <ButtonLikeLink
            variant="secondary"
            size="large"
            to=".."
            style={{ marginRight: "auto" }}
            data-testid="Notification__Page--cancel-button"
          >
            {t("form.cancel")}
          </ButtonLikeLink>
          <Button
            variant="secondary"
            theme="black"
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
          <Button
            style={{ marginLeft: "auto" }}
            type="submit"
            data-testid="Notification__Page--publish-button"
          >
            {t("form.save")}
          </Button>
        </div>
      </ButtonContainer>
    </GridForm>
  );
};

const getName = (
  isNew: boolean,
  isLoading: boolean,
  name: string | undefined,
  t: TFunction
) => {
  if (name) {
    return name;
  }
  if (isLoading) {
    return t("Notifications.isLoading");
  }
  if (isNew) {
    return t("Notifications.newNotification");
  }
  return t("Notifications.error.notFound");
};

const useRemoveNotification = ({
  notification,
}: {
  notification?: BannerNotificationsAdminQuery["bannerNotification"];
}) => {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useNotification();
  const handleError = (errorMsgs: string[]) => {
    // eslint-disable-next-line no-console
    console.error(errorMsgs);
    // We haven't properly mapped error messages
    notifyError(t("Notifications.error.deleteFailed.generic"));
  };

  const [removeMutation] = useBannerNotificationDeleteMutation();

  const navigate = useNavigate();

  const removeNotification = async () => {
    try {
      const res = await removeMutation({
        variables: {
          input: {
            pk: String(notification?.pk ?? 0),
          },
        },
      });
      if (res.errors) {
        handleError(res.errors.map((e) => e.message));
        return;
      }

      notifySuccess(t("Notifications.success.removed"));
      navigate("..");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      handleError(["gql threw an error"]);
    }
  };

  return removeNotification;
};

function LoadedContent({
  isNew,
  notification,
  children,
}: {
  isNew: boolean;
  notification?: BannerNotificationsAdminQuery["bannerNotification"];
  children?: ReactNode;
}) {
  const { t } = useTranslation();

  const removeNotification = useRemoveNotification({ notification });

  const name = getName(isNew, false, notification?.name, t);
  return (
    <>
      <StatusTagContainer>
        <H1 $legacy>{name}</H1>
        {notification?.state && (
          <BannerNotificationStateTag state={notification.state} />
        )}
      </StatusTagContainer>
      {(notification || isNew) && (
        <NotificationForm notification={notification ?? undefined} />
      )}
      {notification && (
        <ButtonContainer
          style={{ marginTop: "2rem", justifyContent: "flex-start" }}
        >
          <Button
            onClick={removeNotification}
            variant="secondary"
            theme="black"
          >
            {t("Notifications.deleteButton")}
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
const PageWrapped = ({ pk }: { pk?: number }) => {
  const typename = "BannerNotificationNode";

  const id = base64encode(`${typename}:${pk}`);
  const { data, loading: isLoading } = useBannerNotificationsAdminQuery({
    skip: !pk,
    variables: { id },
  });
  const { t } = useTranslation();

  const notification = data?.bannerNotification ?? undefined;

  const isNew = pk === 0;
  const name = getName(isNew, isLoading, notification?.name, t);

  const route = [
    {
      slug: "",
      alias: t("breadcrumb.messaging"),
    },
    {
      slug: `/messaging/notifications`,
      alias: t("breadcrumb.notifications"),
    },
    {
      slug: "",
      alias: name,
    },
  ];

  return (
    <>
      {/* TODO if new page should show "Back" button instead of breadcrumb */}
      <BreadcrumbWrapper route={route} />
      <Container>
        {isLoading ? (
          <Loader />
        ) : (
          <LoadedContent isNew={isNew} notification={notification} />
        )}
      </Container>
    </>
  );
};

// TODO this can be replaced with router match since we don't validate the pk here
const PageRouted = () => {
  const { pk } = useParams<{ pk: string }>();

  if (pk === "new") {
    return <PageWrapped pk={0} />;
  }

  return <PageWrapped pk={Number(pk)} />;
};

export default PageRouted;
