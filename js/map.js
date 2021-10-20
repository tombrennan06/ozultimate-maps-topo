var lpi_nsw_topo_map = L.tileLayer('http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  maxNativeZoom: 16,
  attribution: '&copy; Department Finance, Services & Innovation 2021',
  opacity: 1.0,
  useCache: true,
	crossOrigin: true
});

var lat = -33.7067; //katoomba
var lng = 150.3156; //katoomba
var map = L.map('map', {
  center: [lat, lng], 
  zoom: 13, 
  layers: [lpi_nsw_topo_map],
  zoomControl: true,
  zoomSnap: 0,
  zoomDelta: 0.5
});

L.control.scale({metric: true, imperial: false}).addTo(map);
L.control.mouseCoordinateNSW({utm:false,nswmap:true,utmref:false}).addTo(map);

// Location
L.control.locate({keepCurrentZoomLevel:true,icon:'icon-location',iconLoading:'icon-spinner animate-spin', locateOptions: {enableHighAccuracy: true, watch: true}}).addTo(map);
//need to watch?