import { Button, IconCross, Select, Table, Tabs, Tag } from "hds-react";
import { memoize, sortBy, uniq, uniqBy } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { getApplications } from "../../common/api";
import {
  ApplicationRound as ApplicationRoundType,
  DataFilterOption,
  Unit,
} from "../../common/types";
import { applicationDetailsUrl, applicationRoundUrl } from "../../common/urls";
import { filterData } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import { IngressContainer } from "../../styles/layout";
import { H2 } from "../../styles/new-typography";
import { breakpoints } from "../../styles/util";
import StatusRecommendation from "../applications/StatusRecommendation";
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
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  margin-top: var(--spacing-s);
  line-height: 1;
`;

const ApplicationRoundName = styled.div`
  font-size: var(--fontsize-body-xl);
  margin: var(--spacing-s) 0;
  line-height: var(--lineheight-m);
`;

const RoundTag = styled(Tag)`
  border-radius: 30px;
  padding: 0 1em;
`;

const StyledLink = styled(Link)`
  color: black;
`;

const StyledApplicationRoundStatusBlock = styled(ApplicationRoundStatusBlock)`
  margin: 0;
`;

const NoDataMessage = styled.span`
  line-height: 4;
`;

const TableWrapper = styled.div`
  div {
    overflow-x: auto;
    @media (min-width: ${breakpoints.xl}) {
      overflow-x: unset !important;
    }
  }

  caption {
    text-align: end;
  }
  table {
    max-width: var(--container-width-l);

    th {
      font-family: var(--font-bold);
      padding: var(--spacing-xs);
      background: white;
      position: sticky;
      top: 0;
      box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
    }
    td {
      white-space: nowrap;
      padding: var(--spacing-xs);
    }
  }
`;

const FiltersContainer = styled.div`
  z-index: 10000;
  max-width: var(--container-width-l);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2em;
  top: 0;
`;

const ApplicationCount = styled.div`
  line-height: 1.5;
`;

const FilterTags = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-black-20);
  padding-bottom: 1rem;
`;

const ClearTagsButton = styled(Button)`
  height: 0;
  border: 0;
`;

type FilterOption = {
  label: string;
  value: DataFilterOption;
};

const getUnitOptions = memoize(
  (applications: ApplicationView[]): FilterOption[] => {
    const units = uniqBy(
      applications.flatMap((app) => app.units),
      "id"
    );

    units.sort((u1: Unit, u2: Unit) =>
      u1.name.fi.toLowerCase().localeCompare(u2.name.fi.toLowerCase())
    );

    return units.map((unit) => ({
      label: unit.name.fi,
      value: {
        title: unit.name.fi,
        key: "unit",
        function: (application: ApplicationView) =>
          Boolean(application.units.find((u) => u.id === unit.id)),
      },
    }));
  }
);

const getApplicantTypeOptions = memoize(
  (applications: ApplicationView[]): FilterOption[] => {
    const applicantTypes = uniq(applications.map((app) => app.type));

    return applicantTypes.map((value) => ({
      label: value,
      value: {
        title: value,
        key: "type",
        value,
      },
    }));
  }
);

function DataOrMessage({
  data,
  filteredData,
  children,
  noData,
  noFilteredData,
}: {
  data: ApplicationView[];
  filteredData: ApplicationView[];
  children: JSX.Element;
  noData: string;
  noFilteredData: string;
}) {
  if (filteredData.length) {
    return children;
  }

  if (data.length === 0) {
    return <NoDataMessage>{noData}</NoDataMessage>;
  }

  return <NoDataMessage>{noFilteredData}</NoDataMessage>;
}

function Review({ applicationRound }: IProps): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationView[]>([]);
  const [applicationEvents, setApplicationEvents] = useState<ApplicationView[]>(
    []
  );

  const [unitFilters, setUnitFilters] = useState<FilterOption[]>([]);
  const [typeFilters, setTypeFilters] = useState<FilterOption[]>([]);
  const { notifyError } = useNotification();

  const { t } = useTranslation();

  const filteredApplications = useMemo(() => {
    const filters = unitFilters
      .map((f) => f.value)
      .concat(typeFilters.map((f) => f.value));
    return {
      applications: filterData(applications, filters),
      applicationEvents: filterData(applicationEvents, filters),
    };
  }, [applications, applicationEvents, typeFilters, unitFilters]);

  useEffect(() => {
    const fetchApplications = async (ar: ApplicationRoundType) => {
      try {
        const result = await getApplications({
          applicationRound: ar.id,
          status: "in_review,review_done,declined",
        });
        const mapped = result.map((app) => appMapper(ar, app, t));
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

  const ready = applicationRound;

  if (!ready) {
    return null;
  }

  function deleteFilterTag(tag: FilterOption) {
    const reducedUnitFilters = unitFilters.filter(
      (uf) => uf.label !== tag.label
    );

    if (reducedUnitFilters.length !== unitFilters.length) {
      setUnitFilters(reducedUnitFilters);
    }

    const reducedTypeFilters = typeFilters.filter(
      (uf) => uf.label !== tag.label
    );

    if (reducedTypeFilters.length !== typeFilters.length) {
      setTypeFilters(reducedTypeFilters);
    }
  }

  const clearFilterTags = () => {
    setUnitFilters([]);
    setTypeFilters([]);
  };

  const tags = memoize((units, types) =>
    sortBy(units, "label").concat(sortBy(types, "label"))
  )(unitFilters, typeFilters);

  const hasApplications = applications.length > 0;

  const filterControls = hasApplications && (
    <>
      <FiltersContainer>
        <Select
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
          id="application-unit-filter"
          label={t("Application.headings.unit")}
          multiselect
          placeholder={t("common.filter")}
          options={getUnitOptions(applications)}
          value={[...unitFilters]}
          onChange={(v) => setUnitFilters(v)}
        />
        <Select
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
          id="application-type-filter"
          label={t("Application.headings.applicantType")}
          placeholder={t("common.filter")}
          multiselect
          options={getApplicantTypeOptions(applications)}
          value={[...typeFilters]}
          onChange={setTypeFilters}
        />
      </FiltersContainer>
      <FilterTags>
        {tags.map((tag) => (
          <RoundTag key={tag.label} onDelete={() => deleteFilterTag(tag)}>
            {tag.label}
          </RoundTag>
        ))}{" "}
        {tags.length > 0 ? (
          <ClearTagsButton
            iconLeft={<IconCross />}
            variant="supplementary"
            type="button"
            theme="black"
            onClick={clearFilterTags}
            size="small"
          >
            {t("common.clear")}
          </ClearTagsButton>
        ) : null}
      </FilterTags>
    </>
  );

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
                {filterControls}
                {filteredApplications.applications.length > 0 && (
                  <ApplicationCount>
                    {t("Application.unhandledApplications", {
                      count: filteredApplications.applications.length,
                    })}
                  </ApplicationCount>
                )}
                <TableWrapper>
                  <DataOrMessage
                    data={applications}
                    filteredData={filteredApplications.applications}
                    noData={t("ApplicationRound.noApplications")}
                    noFilteredData={t(
                      "ApplicationRound.noFilteredApplications"
                    )}
                  >
                    <Table
                      ariaLabelSortButtonAscending="Sorted in ascending order"
                      ariaLabelSortButtonDescending="Sorted in descending order"
                      ariaLabelSortButtonUnset="Not sorted"
                      initialSortingColumnKey="applicantSort"
                      initialSortingOrder="asc"
                      cols={[
                        {
                          headerName: t("Application.headings.customer"),
                          isSortable: true,
                          key: "applicantSort",
                          transform: ({ applicant, id }) => (
                            <StyledLink to={applicationDetailsUrl(id)}>
                              <span title={applicant}>
                                {truncate(applicant, 20)}
                              </span>
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
                          transform: ({ units }: ApplicationView) => {
                            const allUnits = units
                              .map((u) => u.name.fi)
                              .join(", ");

                            return (
                              <span title={allUnits}>
                                {truncate(
                                  units
                                    .filter((u, i) => i < 2)
                                    .map((u) => u.name.fi)
                                    .join(", "),
                                  23
                                )}
                              </span>
                            );
                          },
                        },
                        {
                          headerName: t(
                            "Application.headings.applicationCount"
                          ),
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
                  </DataOrMessage>
                </TableWrapper>
              </TabContent>
            </Tabs.TabPanel>
            <Tabs.TabPanel>
              <TabContent>
                {filterControls}
                {filteredApplications.applicationEvents.length > 0 && (
                  <ApplicationCount>
                    {t("Application.unhandledApplicationEvents", {
                      count: filteredApplications.applicationEvents.length,
                    })}
                  </ApplicationCount>
                )}
                <TableWrapper>
                  <DataOrMessage
                    data={applications}
                    filteredData={filteredApplications.applications}
                    noData={t("ApplicationRound.noApplicationEvents")}
                    noFilteredData={t(
                      "ApplicationRound.noFilteredApplicationEvents"
                    )}
                  >
                    <Table
                      ariaLabelSortButtonAscending="Sorted in ascending order"
                      ariaLabelSortButtonDescending="Sorted in descending order"
                      initialSortingColumnKey="applicantSort"
                      initialSortingOrder="asc"
                      cols={[
                        {
                          headerName: t("Application.headings.customer"),
                          isSortable: true,
                          key: "applicantSort",
                          transform: ({ applicant, id, eventId }) => (
                            <StyledLink
                              to={`${applicationDetailsUrl(id)}#${eventId}`}
                            >
                              <span title={applicant}>
                                {truncate(applicant, 20)}
                              </span>
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
                          transform: ({ units }: ApplicationView) => {
                            const allUnits = units
                              .map((u) => u.name.fi)
                              .join(", ");

                            return (
                              <span title={allUnits}>
                                {truncate(
                                  units
                                    .filter((u, i) => i < 2)
                                    .map((u) => u.name.fi)
                                    .join(", "),
                                  23
                                )}
                              </span>
                            );
                          },
                        },
                        {
                          headerName: t(
                            "Application.headings.applicationCount"
                          ),
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
                  </DataOrMessage>
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
