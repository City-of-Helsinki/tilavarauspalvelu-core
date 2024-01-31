import { ApplicationEventNode } from "common/types/gql-types";
import { useSearchParams } from "react-router-dom";

export function useFocusApplicationEvent(): [
  number | undefined,
  (aes?: ApplicationEventNode) => void,
] {
  const [params, setParams] = useSearchParams();

  const selectedAeasPk = params.get("aes")
    ? Number(params.get("aes"))
    : undefined;

  // TODO this can be removed if we move this to a hook and reuse it in the other component
  // the state is already in a query param
  const setFocused = (aes?: ApplicationEventNode) => {
    //  setFocusedApplicationEvent(aes);
    // TODO if the applicationEvent is completely allocated => remove the selection
    if (aes?.pk != null) {
      const p = new URLSearchParams(params);
      p.set("aes", aes.pk.toString());
      setParams(p);
    } else {
      const p = new URLSearchParams(params);
      p.delete("aes");
      setParams(p);
    }
  };

  return [selectedAeasPk, setFocused];
}
