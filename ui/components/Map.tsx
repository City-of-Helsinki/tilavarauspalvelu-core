import React, { useState } from "react";
import Image from "next/image";
import ReactMapGL, {
  Marker,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl";
import { mapboxToken, mapStyle } from "../modules/const";

type State = Record<string, number>;
type Props = {
  title: string;
  latitude?: number;
  longitude?: number;
  height?: string;
};
const ZOOM = 14;

const navControlStyle = {
  right: 10,
  bottom: 10,
};

const geolocateControlStyle = {
  right: 10,
  bottom: 72,
};

const Map = ({
  title,
  latitude,
  longitude,
  height = "480px",
}: Props): JSX.Element | null => {
  const [viewport, setViewport] = useState({
    latitude,
    longitude,
    zoom: ZOOM,
  } as State);

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <ReactMapGL
      {...viewport}
      mapStyle={mapStyle}
      width="100%"
      height={height}
      onViewportChange={(
        newViewPort: React.SetStateAction<Record<string, number>>
      ) => {
        setViewport(newViewPort);
      }}
      mapboxApiAccessToken={mapboxToken}
    >
      <NavigationControl style={navControlStyle} showCompass={false} />
      <Marker key={title} longitude={longitude} latitude={latitude}>
        <Image src="/icons/map_marker_icon.svg" height="42" width="32" alt="" />
      </Marker>
      <GeolocateControl
        style={geolocateControlStyle}
        positionOptions={{ enableHighAccuracy: true }}
      />
    </ReactMapGL>
  );
};

export default Map;
