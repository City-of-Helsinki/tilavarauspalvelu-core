import { ApplicationRound } from "../../modules/types";
import ApplicationRoundCard from "./ApplicationRoundCard";

type Props = {
  data?: ApplicationRound[];
  applicationRounds: ApplicationRound[];
};

const ApplicationPeriodList = ({
  data,
  applicationRounds,
  ...rest
}: Props): JSX.Element => {
  console.log(rest);
  if (!applicationRounds) {
    return null;
  }
  return (
    <>
      {applicationRounds.map((p) => (
        <ApplicationRoundCard applicationRound={p} key={`${p.id}${p.name}`} />
      ))}
    </>
  );
};

export default ApplicationPeriodList;
