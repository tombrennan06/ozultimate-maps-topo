var lpi_nsw_topo_map = L.tileLayer('http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  maxNativeZoom: 16,
  attribution: '&copy; Land and Property Information 2016',
  opacity: 1.0
});

var lat = -33.7067; //katoomba
var lng = 150.3156; //katoomba
var map = L.map('map', {
  center: [lat, lng], 
  zoom: 13, 
  layers: [lpi_nsw_topo_map],
  zoomControl: true
});

L.control.scale({metric: true, imperial: false}).addTo(map);
L.control.mouseCoordinateNSW({utm:false,nswmap:true,utmref:false}).addTo(map);

// Location
L.control.locate({keepCurrentZoomLevel:true,icon:'icon-location',iconLoading:'icon-spinner animate-spin', locateOptions: {enableHighAccuracy: true, watch: true}}).addTo(map);
//need to watch?