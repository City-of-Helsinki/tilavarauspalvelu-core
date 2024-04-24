import React from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  type Query,
  type QueryApplicationRoundArgs,
} from "common/types/gql-types";
import { useNotification } from "@/context/NotificationContext";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import Loader from "@/component/Loader";
import { Review } from "./review/Review";
import { APPLICATION_ROUND_QUERY } from "../queries";
import usePermission from "@/hooks/usePermission";
import { Permission } from "@/modules/permissionHelper";
import { base64encode } from "common/src/helpers";

function ApplicationRound({ pk }: { pk: number }): JSX.Element {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const id = base64encode(`ApplicationRoundNode:${pk}`);
  const { data, loading: isLoading } = useQuery<
    Query,
    QueryApplicationRoundArgs
  >(APPLICATION_ROUND_QUERY, {
    skip: !pk,
    variables: { id },
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });

  const { applicationRound } = data ?? {};

  const { hasApplicationRoundPermission } = usePermission();

  if (isLoading) {
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
      <Review applicationRound={applicationRound} />
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
