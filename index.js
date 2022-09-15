import 'ol/ol.css';
import Map from 'ol/Map';
import FullScreen from 'ol/control/FullScreen';
import proj4 from 'proj4';
import { get as getProjection, getTransform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import styleFunction from 'ol-mapbox-style';
import Hash from './hash';

proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:3067", "+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);


const
  styleVer = 'v20',
  tileVer = 'v20',
  tileMatrixSet = 'ETRS-TM35FIN',
  epsg = 'EPSG:3067', maxZoom = 14, extent =
    [-548576, 6291456, 1548576, 8388608],
  center = [384920, 6671856],
  projection = getProjection(epsg),
  resolutions = [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
  tileGrid = new TileGrid({
    extent: extent,
    resolutions: resolutions,
    tileSize: [256, 256]
  });

projection.setExtent(extent);

/* API-KEY */
const apiKey = '7cd2ddae-9f2e-481c-99d0-404e7bc7a0b2',
  styleUrl = `https://avoin-karttakuva.maanmittauslaitos.fi/vectortiles/stylejson/${styleVer}/generic.json?TileMatrixSet=${tileMatrixSet}&api-key=${apiKey}`,
  tileUrl = `https://avoin-karttakuva.maanmittauslaitos.fi/vectortiles/taustakartta/wmts/1.0.0/taustakartta/default/${tileVer}/${tileMatrixSet}/{z}/{y}/{x}.pbf?api-key=${apiKey}`;

// Font replacement so we do not need to load web fonts in the worker
function getFont(font) {
  return 'sans-serif';
  /*return font[0]
    .replace('Noto Sans', 'sans-serif')
    .replace('Roboto', 'sans-serif');*/
}

const hash = new Hash(),
  map = new Map({
    target: 'map',
    view: new View({
      projection: projection,
      resolutions: resolutions,
      center: center,
      zoom: 14,
      maxZoom: 15,
      minZoom: 1
    })
  });
  hash.addTo(map);
  map.addControl(new FullScreen());


// override with tileURL
// styleJSON has tileJSON url which does not work without further dev
const sources = {
  taustakartta: new VectorTileSource({
    projection: projection,
    tileGrid: tileGrid,
    minZoom: 1,
    maxZoom: maxZoom,
    format: new MVT(),
    url: tileUrl
  })
};

fetch(styleUrl).then(data => data.json()).then(styleJson => {

  // this is from offscreen canvas example
  const
    layers = [],
    buckets = [];
  let currentSource;
  styleJson.layers.forEach(layer => {
    if (!layer.source) {
      return;
    }
    if (currentSource !== layer.source) {
      currentSource = layer.source;
      buckets.push({
        source: layer.source,
        layers: []
      });
    }
    buckets[buckets.length - 1].layers.push(layer.id);
  });

  buckets.forEach(bucket => {
    const source = sources[bucket.source];
    if (!source) {
      return;
    }
    const layer = new VectorTileLayer({
      declutter: true,
      source,
      tileGrid: tileGrid,
      projection: projection,
      minZoom: 1,
      maxZoom: maxZoom
    });
    styleFunction(layer, styleJson, bucket.layers, resolutions, null, null, getFont);
    layers.push(layer);

  });

  return layers;

}).then(layers => {
  layers.forEach(layer => {
    map.addLayer(layer);
  })
});

