import 'ol/ol.css';
import FullScreen from 'ol/control/FullScreen';
import proj4 from 'proj4';
import { get as getProjection, getTransform } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';
import Hash from './hash';
import MVT from 'ol/format/MVT';
import styleJson from './generic.json';
import { applyStyle } from 'ol-mapbox-style';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import {Map, View} from 'ol/index.js';

proj4.defs("EPSG:3067", "+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);


const
  //tileMatrixSet = 'ETRS-TM35FIN',
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




const layer = new VectorTileLayer({
  declutter: true,
 source : new VectorTileSource({
  projection: projection,
  tileGrid: tileGrid,
  minZoom: 1,
  maxZoom: maxZoom,
  format: new MVT(),
  url: styleJson.sources.taustakartta.url
})});

const hash = new Hash(),
  map = new Map({
    target: 'map',
    view: new View({
      projection: projection,
      resolutions: resolutions,
      center: center,
      zoom: 10,
      maxZoom: 15,
      minZoom: 1
    })
  });
hash.addTo(map);
map.addControl(new FullScreen());

applyStyle(layer, styleJson, '', {resolutions: tileGrid.getResolutions()}).then(()=>{
  map.addLayer(layer);

});


window.map = map;
