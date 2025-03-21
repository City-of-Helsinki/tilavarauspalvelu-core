import { ApplicationStatusChoice, Maybe } from "@/gql/gql-types";
import { H1 } from "common";
import { ApplicationStatusLabel } from "common/src/components/statuses";
import { Flex } from "common/styles/util";

export function ApplicationHead({
  status,
  title,
  subTitle,
}: {
  status: Maybe<ApplicationStatusChoice> | undefined;
  title: string;
  subTitle?: string;
}): JSX.Element {
  return (
    <Flex
      $direction="row"
      $alignItems="flex-start"
      $justifyContent="space-between"
      $wrap="wrap"
    >
      <div>
        <H1 $noMargin>{title}</H1>
        {subTitle && <p>{subTitle}</p>}
      </div>
      <ApplicationStatusLabel status={status} user="customer" />
    </Flex>
  );
}
