import dynamic from "next/dynamic";
import { Route, Routes } from "react-router-dom";

const Unit = dynamic(() => import("./[id]"));
const SpacesResources = dynamic(import("./SpacesResources"));
const SpaceEditorView = dynamic(() => import("./space"));
const ResourceEditorView = dynamic(() => import("./resource"));
const ReservationUnitEditor = dynamic(
  () => import("../ReservationUnit/edit/index")
);

export function UnitsRouter({
  reservationUnitPreviewUrl,
}: {
  reservationUnitPreviewUrl: string;
}) {
  return (
    <Routes>
      <Route path=":unitPk/spacesResources" element={<SpacesResources />} />
      <Route path=":unitPk/space/:spacePk" element={<SpaceEditorView />} />
      <Route
        path=":unitPk/resource/:resourcePk"
        element={<ResourceEditorView />}
      />
      <Route
        index
        path=":unitPk/reservationUnit/"
        element={
          <ReservationUnitEditor previewUrlPrefix={reservationUnitPreviewUrl} />
        }
      />
      <Route
        path=":unitPk/reservationUnit/:reservationUnitPk"
        element={
          <ReservationUnitEditor previewUrlPrefix={reservationUnitPreviewUrl} />
        }
      />
      <Route path=":unitPk" element={<Unit />} />
    </Routes>
  );
}
