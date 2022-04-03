import { IconSliders, Table, Tabs } from "hds-react";
import { uniq, uniqBy } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { getApplications } from "../../common/api";
import {
  ApplicationRound as ApplicationRoundType,
  DataFilterConfig,
  DataFilterOption,
} from "../../common/types";
import { applicationDetailsUrl, applicationRoundUrl } from "../../common/urls";
import { filterData } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import { IngressContainer } from "../../styles/layout";
import { H2 } from "../../styles/new-typography";
import StatusRecommendation from "../applications/StatusRecommendation";
import { FilterBtn } from "../FilterContainer";
import FilterControls from "../FilterControls";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import { NaviItem } from "./ApplicationRoundNavi";
import ApplicationRoundStatusBlock from "./ApplicationRoundStatusBlock";
import TimeframeStatus from "./TimeframeStatus";
import { ApplicationView, appMapper, truncate } from "./util";

interface IProps {
  applicationRound: ApplicationRoundType;
}

const Wrapper = styled.div`
  width: 100%;
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-layout-xl);
`;

const Content = styled.div``;

const RecommendationValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: var(--spacing-layout-m);
  margin-bottom: var(--spacing-l);
`;

const StyledH2 = styled(H2)`
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1;
`;

const TabContent = styled.div`
  margin-top: var(--spacing-l);
  line-height: 1;
`;

const ApplicationRoundName = styled.div`
  font-size: var(--fontsize-body-xl);
  margin: var(--spacing-s) 0;
  line-height: var(--lineheight-m);
`;

const StyledLink = styled(Link)`
  color: black;
`;

const StyledApplicationRoundStatusBlock = styled(ApplicationRoundStatusBlock)`
  margin: 0;
`;

const TableWrapper = styled.div`
  width: 100%;

  caption {
    text-align: end;
  }
  table {
    min-width: 1000px;
    overflow: scroll;
    th {
      font-family: var(--font-bold);
    }
    td {
      white-space: nowrap;
    }
  }
`;

const FilterContainer = styled.div`
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 56px;
  position: sticky;
  top: 0;
  z-index: var(--tilavaraus-admin-sticky-header);
`;

const getFilterConfig = (
  applications: ApplicationView[]
): DataFilterConfig[] => {
  const applicantTypes = uniq(applications.map((app) => app.type));
  const statuses = uniq(applications.map((app) => app.status));
  const units = uniqBy(
    applications.flatMap((app) => app.units),
    "id"
  );

  return [
    {
      title: "Application.headings.applicantType",
      filters: applicantTypes
        .filter((n) => n)
        .map((value) => ({
          title: value,
          key: "type",
          value: value || "",
        })),
    },
    {
      title: "Application.headings.applicationStatus",
      filters: statuses.map((status) => ({
        title: `Application.statuses.${status}`,
        key: "status",
        value: status,
      })),
    },
    {
      title: "Application.headings.unit",
      filters: units.map((unit) => ({
        title: unit.name.fi,
        key: "unit",
        function: (application: ApplicationView) =>
          Boolean(application.units.find((u) => u.id === unit.id)),
      })),
    },
  ];
};

function Review({ applicationRound }: IProps): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationView[]>([]);
  const [applicationEvents, setApplicationEvents] = useState<ApplicationView[]>(
    []
  );
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig[] | null>(
    null
  );
  const { notifyError } = useNotification();
  const [filters, setFilters] = useState<DataFilterOption[]>([]);
  const [filtersAreVisible, toggleFilterVisibility] = useState(false);

  const { t } = useTranslation();

  const filteredApplications = useMemo(
    () => ({
      applications: filterData(applications, filters),
      applicationEvents: filterData(applicationEvents, filters),
    }),
    [applications, applicationEvents, filters]
  );

  useEffect(() => {
    const fetchApplications = async (ar: ApplicationRoundType) => {
      try {
        const result = await getApplications({
          applicationRound: ar.id,
          status: "in_review,review_done,declined",
        });
        const mapped = result.map((app) => appMapper(ar, app, t));
        setFilterConfig(getFilterConfig(mapped));
        setApplications(mapped);
        setApplicationEvents(
          result
            .flatMap((a) =>
              a.applicationEvents.map((ae) => ({
                ...a,
                applicationEvents: [ae],
              }))
            )
            .map((app) => appMapper(ar, app, t))
        );
      } catch (error) {
        notifyError(t("errors.errorFetchingApplications"));
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchApplications(applicationRound);
    }
  }, [applicationRound, notifyError, t]);

  if (isLoading) {
    return <Loader />;
  }

  const ready = applicationRound && filterConfig;

  if (!ready) {
    return null;
  }

  return (
    <Wrapper>
      <>
        <IngressContainer>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <StyledApplicationRoundStatusBlock
              applicationRound={applicationRound}
            />
            <NaviItem
              to={`${applicationRoundUrl(applicationRound.id)}/criteria`}
            >
              {t("ApplicationRound.roundCriteria")}
            </NaviItem>
          </div>
          <Content>
            <ApplicationRoundName>{applicationRound.name}</ApplicationRoundName>
            <StyledH2>{t("ApplicationRound.applicants")}</StyledH2>
            <TimeframeStatus
              applicationPeriodBegin={applicationRound.applicationPeriodBegin}
              applicationPeriodEnd={applicationRound.applicationPeriodEnd}
            />
            <RecommendationValue>
              <StatusRecommendation
                status="in_review"
                applicationRound={applicationRound}
              />
            </RecommendationValue>
          </Content>
          <Tabs>
            <Tabs.TabList>
              <Tabs.Tab>{t("ApplicationRound.applications")}</Tabs.Tab>
              <Tabs.Tab>{t("ApplicationRound.appliedReservations")}</Tabs.Tab>
            </Tabs.TabList>
            <Tabs.TabPanel>
              <TabContent>
                <FilterContainer>
                  <>
                    <FilterBtn
                      data-testid="data-table__button--filter-toggle"
                      iconLeft={<IconSliders aria-hidden />}
                      onClick={(): void =>
                        toggleFilterVisibility(!filtersAreVisible)
                      }
                      className={
                        filtersAreVisible ? "filterControlsAreOpen" : ""
                      }
                      $filterControlsAreOpen={filtersAreVisible}
                      $filtersActive={filterConfig.length > 0}
                      title={t(
                        `${
                          filters.length > 0
                            ? "common.filtered"
                            : "common.filter"
                        }`
                      )}
                    >
                      {t(
                        `${
                          filters.length > 0
                            ? "common.filtered"
                            : "common.filter"
                        }`
                      )}
                    </FilterBtn>
                    <FilterControls
                      filters={filters}
                      visible={filtersAreVisible}
                      applyFilters={setFilters}
                      config={filterConfig}
                    />
                  </>
                </FilterContainer>
                <TableWrapper>
                  <Table
                    ariaLabelSortButtonAscending="Sorted in ascending order"
                    ariaLabelSortButtonDescending="Sorted in descending order"
                    ariaLabelSortButtonUnset="Not sorted"
                    initialSortingColumnKey="applicantSort"
                    initialSortingOrder="asc"
                    caption={t("Application.unhandledApplications", {
                      count: filteredApplications.applications.length,
                      of: filteredApplications.applications.length,
                    })}
                    cols={[
                      {
                        headerName: t("Application.headings.customer"),
                        isSortable: true,
                        key: "applicantSort",
                        transform: ({ applicant, id }) => (
                          <StyledLink to={applicationDetailsUrl(id)}>
                            {truncate(applicant, 20)}
                          </StyledLink>
                        ),
                      },
                      {
                        headerName: t("Application.headings.applicantType"),
                        isSortable: true,
                        key: "type",
                      },
                      {
                        headerName: t("Application.headings.unit"),
                        isSortable: true,
                        key: "unitsSort",
                        transform: ({ units }: ApplicationView) =>
                          truncate(
                            units
                              .filter((u, i) => i < 2)
                              .map((u) => u.name.fi)
                              .join(", "),
                            20
                          ),
                      },
                      {
                        headerName: t("Application.headings.applicationCount"),
                        isSortable: true,
                        key: "applicationCountSort",
                        sortIconType: "other",
                        transform: ({ applicationCount }: ApplicationView) =>
                          applicationCount,
                      },
                      {
                        headerName: t("Application.headings.phase"),
                        key: "status",
                        transform: ({ statusView }: ApplicationView) =>
                          statusView,
                      },
                    ]}
                    indexKey="id"
                    rows={filteredApplications.applications}
                    variant="light"
                  />
                </TableWrapper>
              </TabContent>
            </Tabs.TabPanel>
            <Tabs.TabPanel>
              <TabContent>
                <FilterContainer>
                  <>
                    <FilterBtn
                      data-testid="data-table__button--filter-toggle"
                      iconLeft={<IconSliders aria-hidden />}
                      onClick={(): void =>
                        toggleFilterVisibility(!filtersAreVisible)
                      }
                      className={
                        filtersAreVisible ? "filterControlsAreOpen" : ""
                      }
                      $filterControlsAreOpen={filtersAreVisible}
                      $filtersActive={filterConfig.length > 0}
                      title={t(
                        `${
                          filters.length > 0
                            ? "common.filtered"
                            : "common.filter"
                        }`
                      )}
                    >
                      {t(
                        `${
                          filters.length > 0
                            ? "common.filtered"
                            : "common.filter"
                        }`
                      )}
                    </FilterBtn>
                    <FilterControls
                      filters={filters}
                      visible={filtersAreVisible}
                      applyFilters={setFilters}
                      config={filterConfig}
                    />
                  </>
                </FilterContainer>
                <TableWrapper>
                  <Table
                    ariaLabelSortButtonAscending="Sorted in ascending order"
                    ariaLabelSortButtonDescending="Sorted in descending order"
                    ariaLabelSortButtonUnset="Not sorted"
                    initialSortingColumnKey="applicantSort"
                    initialSortingOrder="asc"
                    caption={t("Application.unhandledApplications", {
                      count: applicationEvents.length,
                      of: applicationEvents.length,
                    })}
                    cols={[
                      {
                        headerName: t("Application.headings.customer"),
                        isSortable: true,
                        key: "applicantSort",
                        transform: ({ applicant, id, eventId }) => (
                          <StyledLink
                            to={`${applicationDetailsUrl(id)}#${eventId}`}
                          >
                            {applicant}
                          </StyledLink>
                        ),
                      },
                      {
                        headerName: t("Application.headings.name"),
                        isSortable: true,
                        transform: ({ name }) => truncate(name, 20),
                        key: "nameSort",
                      },
                      {
                        headerName: t("Application.headings.unit"),
                        isSortable: true,
                        key: "unitsSort",
                        transform: ({ units }: ApplicationView) =>
                          truncate(
                            units
                              .filter((u, i) => i < 2)
                              .map((u) => u.name.fi)
                              .join(", "),
                            20
                          ),
                      },
                      {
                        headerName: t("Application.headings.applicationCount"),
                        isSortable: true,
                        key: "applicationCountSort",
                        sortIconType: "other",
                        transform: ({ applicationCount }: ApplicationView) =>
                          applicationCount,
                      },
                      {
                        headerName: t("Application.headings.phase"),
                        key: "status",
                        transform: ({ statusView }: ApplicationView) =>
                          statusView,
                      },
                    ]}
                    indexKey="key"
                    rows={filteredApplications.applicationEvents}
                    variant="light"
                  />
                </TableWrapper>
              </TabContent>
            </Tabs.TabPanel>
          </Tabs>
        </IngressContainer>
      </>
    </Wrapper>
  );
}

export default withMainMenu(Review);
