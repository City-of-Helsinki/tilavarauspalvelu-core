import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApplicationRoundQuery } from "@gql/gql-types";
import { useNotification } from "@/context/NotificationContext";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import Loader from "@/component/Loader";
import { Review } from "./review/Review";
import usePermission from "@/hooks/usePermission";
import { Permission } from "@/modules/permissionHelper";
import { base64encode } from "common/src/helpers";
import { isApplicationRoundInProgress } from "@/helpers";

function ApplicationRound({ pk }: { pk: number }): JSX.Element {
  const { notifyError } = useNotification();
  const { t } = useTranslation();
  const [isInProgress, setIsInProgress] = useState(false);

  const id = base64encode(`ApplicationRoundNode:${pk}`);
  const isValid = pk > 0;

  const { data, loading, refetch } = useApplicationRoundQuery({
    skip: !isValid,
    variables: { id },
    pollInterval: isInProgress ? 10000 : 0,
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });
  const { applicationRound } = data ?? {};
  const { hasApplicationRoundPermission } = usePermission();

  // NOTE: useEffect works, onCompleted does not work with refetch
  useEffect(() => {
    if (data) {
      if (isApplicationRoundInProgress(data.applicationRound)) {
        setIsInProgress(true);
      } else {
        setIsInProgress(false);
      }
    }
  }, [data]);

  if (loading) {
    return <Loader />;
  }

  if (!applicationRound) {
    return <div>{t("errors.applicationRoundNotFound")}</div>;
  }

  const canView = hasApplicationRoundPermission(
    applicationRound,
    Permission.CAN_VALIDATE_APPLICATIONS
  );
  const canManage = hasApplicationRoundPermission(
    applicationRound,
    Permission.CAN_MANAGE_APPLICATIONS
  );
  if (!canView && !canManage) {
    return <div>{t("errors.noPermission")}</div>;
  }

  const route = [
    {
      alias: t("breadcrumb.recurring-reservations"),
      slug: "",
    },
    {
      alias: t("breadcrumb.application-rounds"),
      slug: `/recurring-reservations/application-rounds`,
    },
    {
      alias: applicationRound.nameFi ?? "-",
      slug: "",
    },
  ];

  return (
    <>
      <BreadcrumbWrapper route={route} />
      <Review applicationRound={applicationRound} refetch={refetch} />
    </>
  );
}

type IParams = {
  applicationRoundId: string;
};

function ApplicationRoundRouted(): JSX.Element | null {
  const { t } = useTranslation();
  const { applicationRoundId } = useParams<IParams>();

  const pk = Number(applicationRoundId);
  if (pk > 0) {
    return <ApplicationRound pk={pk} />;
  }

  return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
}

export default ApplicationRoundRouted;
