import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'

import store from '../store'

// Hack to get the markers into Vue correctly
delete L.Icon.Default.prototype._getIconUrl
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: marker2x,
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow
// })

let drawnItems = null
let map = null


function radiusCals(depth) {
  var radius = (5 - depth) * (map.getZoom() + 0.5) / 0.25;
  console.log(map.getZoom());
  console.log('depth:' + depth + '  radius:' + radius + ' zoom:' + map.getZoom());
  if (radius > 8)
    radius = 8;
  if (radius < 2)
    radius = 2;
  return radius;
}

function resizeMarkers() {
  drawnItems.eachLayer(function (layer) {
    layer.setRadius(radiusCals(layer.feature.properties.depth));
  });
}


export function createMap () {

  map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: -0.25,
    maxZoom: 3,
    zoomSnap: 0,
    zoomDelta: 0.5,

  }).setView([500, 500], -0.25);

  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('&copy; <a href="http://maturemasculine.org">Mature Masculine</a>');


  // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  //   attribution: '&copy; <a href="http://maturemasculine.org">Mature Masculine</a>'
  // }).addTo(map);

  
  // const tiles = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  //   attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  //   subdomains: 'abcd',
  //   maxZoom: 19
  // }).addTo(map)

  var bounds = [
    [0, 0],
    [1000, 1000]
  ];
  var image = L.imageOverlay("kwml.jpg", bounds).addTo(map);
  // map.fitBounds(bounds);

  var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#111",
    color: "#444444",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    className: 'mymarker'
  };

  drawnItems = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
      geojsonMarkerOptions.radius = radiusCals(feature.properties.depth);
      switch (feature.properties.type){
        case "Quality":
          geojsonMarkerOptions.fillColor = "#f9b282";
          break;
        case "Archetype":
          geojsonMarkerOptions.fillColor = "#8f4426";
          break;
        case "Sub Archetype":
          geojsonMarkerOptions.fillColor = "#de6b35";
          break;
      }
      return L.circleMarker(latlng, geojsonMarkerOptions);
    }
  }).addTo(map);

  

  map.on('zoomend', function () {
    resizeMarkers();
    
  });

  // drawnItems = L.geoJSON(null, {
  //   style: function () {
  //     return {
  //       color: '#666C79'
  //     }
  //   }
  // }).addTo(map)

  map.addControl(new L.Control.Draw({
    position: 'topright',
    edit: {
      featureGroup: drawnItems,
      poly: {
        allowIntersection: false
      }
    },
    draw: {
      polygon: {
        allowIntersection: false
      },
      circlemarker: false,
      circle: false
    }
  }))

  map.on('click', clickHandlerForMap)

  map.on(L.Draw.Event.DRAWSTART, function (event) {
    map.off('click', clickHandlerForMap)
  })

  map.on(L.Draw.Event.DRAWSTOP, function () {
    map.on('click', clickHandlerForMap)
  })

  map.on(L.Draw.Event.CREATED, function (event) {
    drawnItems.addLayer(event.layer)
    parseGeoJSONAndSendToStore(drawnItems.toGeoJSON())
  })

  map.on(L.Draw.Event.EDITED, function () {
    console.log("edited");
    console.log(drawnItems.toGeoJSON());
    store.commit('setGeoJSONnoModify', drawnItems.toGeoJSON())
    // parseGeoJSONAndSendToStore(drawnItems.toGeoJSON())
  })

  map.on(L.Draw.Event.DELETED, function () {
    parseGeoJSONAndSendToStore(drawnItems.toGeoJSON())
  })

  resizeMarkers();

}

function clickHandlerForMap () {
  store.commit('setSelectedProperties', {
    properties: null
  })
  resetStyleOfPreviousSelection()
  lastSelectedFeature = null
}


function parseGeoJSONAndSendToStore (geojson) {
  store.commit('setGeoJSON', geojson)
}

let lastSelectedFeature = null

function highlightSelectedFeature () {

}

function resetStyleOfPreviousSelection () {
  if (lastSelectedFeature === null) return
}

function openPopup(e) {
  L.DomEvent.stop(e);
  resetStyleOfPreviousSelection()
  lastSelectedFeature = e.target
  highlightSelectedFeature()
  store.commit('setSelectedProperties', lastSelectedFeature.feature)
}

export function zoomToFeatures () {
   map.fitBounds(drawnItems.getBounds())
}

export function modifyGeoJSON () {

  drawnItems.clearLayers()
  drawnItems.addData(store.getters.geojson)
  drawnItems.eachLayer(function (layer) {
    layer.on('click', openPopup)
  })
}
