import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMapGL, { Marker, NavigationControl } from "react-map-gl";

type State = {
  latitude: number;
  longitude: number;
  zoom: number;
};

interface IProps {
  id: string;
  latitude?: number;
  longitude?: number;
}
const ZOOM = 15;

const navControlStyle = {
  left: 32,
  bottom: 32,
};

const mapStyle = (lang: string) => ({
  version: 8,
  name: "hel-osm-light",
  metadata: {},
  sources: {
    osm: {
      type: "raster",
      tiles: [
        `https://tiles.hel.ninja/styles/hel-osm-light/{z}/{x}/{y}@2x@${lang}.png`,
      ],
      minzoom: 8,
      maxzoom: 18,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
  id: "hel-osm-light",
});

const Map = ({ id, latitude, longitude }: IProps): JSX.Element | null => {
  const [viewport, setViewport] = useState({
    latitude,
    longitude,
    zoom: ZOOM,
  } as State);

  const { i18n } = useTranslation();

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <ReactMapGL
      {...viewport}
      mapStyle={mapStyle(i18n.language)}
      width="100%"
      height="380px"
      maxZoom={18}
      minZoom={8}
      onViewportChange={(newViewPort: State) => {
        setViewport(newViewPort);
      }}
    >
      <NavigationControl style={navControlStyle} />
      <Marker key={id} longitude={longitude} latitude={latitude}>
        <svg width="32px" height="52px" viewBox="0 0 32 52">
          <g>
            <path
              d="M15.9981139,0 C20.1340105,0 24.2713477,1.53717334 27.4262114,4.61293808 C33.7359387,10.7630495 33.3095279,20.347694 27.4262114,26.8863529 L26.174361,28.2877277 C20.9310906,34.2007901 18.0099826,38.091836 15.9981139,42 C13.8430107,37.791208 10.613237,33.6022689 4.57433813,26.8863529 C-1.30897841,20.347694 -1.73682979,10.7630495 4.57433813,4.61293808 C7.7292018,1.53717334 11.8650984,0 15.9981139,0 Z M16.0657464,10.8717672 C13.2952057,10.8717672 11.0444238,13.0895872 11.0444238,15.8145918 C11.0444238,18.5373718 13.2952057,20.7551919 16.0657464,20.7551919 C18.8340272,20.7551919 21.0848091,18.5373718 21.0848091,15.8145918 C21.0848091,13.0895872 18.8340272,10.8717672 16.0657464,10.8717672 Z"
              fill="#0000BF"
            />
          </g>
        </svg>
      </Marker>
    </ReactMapGL>
  );
};

export default Map;
