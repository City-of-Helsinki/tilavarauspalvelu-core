import React from "react";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import { Notification, NotificationSize } from "hds-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H1 } from "ui/src/styled";
import {
  type ApplicationCreateMutationInput,
  ApplicationRoundDocument,
  type ApplicationRoundQuery,
  type ApplicationRoundQueryVariables,
  ApplicationRoundStatusChoice,
  CreateApplicationDocument,
  type CreateApplicationMutation,
  type CreateApplicationMutationVariables,
  CurrentUserDocument,
  type CurrentUserQuery,
  ReservationKind,
} from "@gql/gql-types";
import { createNodeId, filterNonNullable, ignoreMaybeArray, type ReadonlyDeep, toNumber } from "ui/src/modules/helpers";
import { type SearchFormValues, SeasonalSearchForm } from "@/components/SeasonalSearchForm";
import { createApolloClient } from "@/modules/apolloClient";
import { useReservationUnitList } from "@/hooks";
import { ListWithPagination } from "@/components/ListWithPagination";
import { StartApplicationBar, RecurringCard } from "@/lib/recurring/[id]";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getSearchOptions, processVariables } from "@/modules/search";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { SortingComponent } from "@/components/SortingComponent";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getApplicationPath, seasonalPrefix } from "@/modules/urls";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { gql } from "@apollo/client";
import { convertLanguageCode } from "ui/src/modules/util";
import { useSearchModify } from "@/hooks/useSearchValues";
import { createPortal } from "react-dom";

type SeasonalSearchProps = ReadonlyDeep<Pick<NarrowedProps, "applicationRound" | "options" | "apiBaseUrl">>;

function SeasonalSearch({ apiBaseUrl, applicationRound, options }: Readonly<SeasonalSearchProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const searchValues = useSearchParams();

  const { handleSearch } = useSearchModify();

  const onSearch = (criteria: SearchFormValues) => {
    handleSearch(criteria, true);
  };

  const {
    selectReservationUnit,
    removeReservationUnit,
    containsReservationUnit,
    // Hide other application rounds' reservation units
  } = useReservationUnitList(applicationRound);

  const variables = processVariables({
    values: searchValues,
    language: i18n.language,
    kind: ReservationKind.Season,
    applicationRound: applicationRound.pk ?? 0,
    reservationPeriodBeginDate: applicationRound?.reservationPeriodBeginDate,
    reservationPeriodEndDate: applicationRound?.reservationPeriodEndDate,
  });
  const query = useSearchQuery(variables);
  const { data, isLoading, error, fetchMore, previousData } = query;

  const currData = data ?? previousData;
  const reservationUnits = filterNonNullable(currData?.reservationUnits?.edges?.map((e) => e?.node));
  const pageInfo = currData?.reservationUnits?.pageInfo;

  const routes = [
    {
      slug: seasonalPrefix,
      title: t("breadcrumb:recurring"),
    },
    {
      title: getApplicationRoundName(applicationRound, lang),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <div>
        <H1 $noMargin>{t("applicationRound:search.title")}</H1>
        <p>{t("applicationRound:search.subtitle")}</p>
      </div>
      {error ? (
        <Notification size={NotificationSize.Small} type="alert">
          {t("errors:search")}
        </Notification>
      ) : null}
      <SeasonalSearchForm options={options} isLoading={isLoading} handleSearch={onSearch} />
      <ListWithPagination
        items={reservationUnits?.map((ru) => (
          <RecurringCard
            selectReservationUnit={selectReservationUnit}
            containsReservationUnit={containsReservationUnit}
            removeReservationUnit={removeReservationUnit}
            reservationUnit={ru}
            key={ru.pk}
          />
        ))}
        isLoading={isLoading}
        hasMoreData={query.hasMoreData}
        pageInfo={pageInfo}
        fetchMore={(cursor) => fetchMore(cursor)}
        sortingComponent={<SortingComponent />}
      />
      {createPortal(<StartApplicationBar applicationRound={applicationRound} apiBaseUrl={apiBaseUrl} />, document.body)}
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type NarrowedProps = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params, query } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  const pk = toNumber(ignoreMaybeArray(params?.id));
  const isPostLogin = query.isPostLogin === "true";

  const notFound = {
    notFound: true,
    props: {
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      notFound: true,
    },
  };
  if (pk == null || pk <= 0) {
    return notFound;
  }
  const { data } = await apolloClient.query<ApplicationRoundQuery, ApplicationRoundQueryVariables>({
    query: ApplicationRoundDocument,
    variables: {
      id: createNodeId("ApplicationRoundNode", pk),
    },
  });
  const { applicationRound } = data;
  if (applicationRound == null) {
    return notFound;
  }
  if (applicationRound.status !== ApplicationRoundStatusChoice.Open) {
    return {
      redirect: {
        permanent: false,
        destination: seasonalPrefix,
      },
      props: {
        notFound: true, // for prop narrowing
      },
    };
  }

  const { data: userData } = await apolloClient.query<CurrentUserQuery>({
    query: CurrentUserDocument,
  });

  if (isPostLogin && userData.currentUser != null) {
    const input: ApplicationCreateMutationInput = {
      applicationRound: applicationRound.pk ?? 0,
    };

    // don't catch errors here -> results in 500 page
    // we can't display proper error message to user (no page for it)
    // and we can't handle them
    const mutRes = await apolloClient.mutate<CreateApplicationMutation, CreateApplicationMutationVariables>({
      mutation: CreateApplicationDocument,
      variables: {
        input,
      },
    });

    if (mutRes.data?.createApplication?.pk) {
      const { pk } = mutRes.data.createApplication;
      const selected = query.selectedReservationUnits ?? [];
      const forwardParams = new URLSearchParams();
      for (const s of selected) {
        forwardParams.append("selectedReservationUnits", s);
      }
      const url = `${getApplicationPath(pk, "page1")}?${forwardParams.toString()}`;
      return {
        redirect: {
          permanent: false,
          destination: url,
        },
        props: {
          notFound: true, // for prop narrowing
        },
      };
    }
  }

  const opts = await getSearchOptions(apolloClient, "seasonal", locale ?? "fi");
  return {
    props: {
      ...commonProps,
      applicationRound,
      options: opts,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default SeasonalSearch;

export const APPLICATION_ROUND_QUERY = gql`
  query ApplicationRound($id: ID!) {
    applicationRound(id: $id) {
      id
      pk
      nameFi
      nameEn
      nameSv
      status
      reservationPeriodBeginDate
      reservationPeriodEndDate
      reservationUnits {
        id
        pk
      }
    }
  }
`;

export const CREATE_APPLICATION_MUTATION = gql`
  mutation CreateApplication($input: ApplicationCreateMutationInput!) {
    createApplication(input: $input) {
      pk
    }
  }
`;
