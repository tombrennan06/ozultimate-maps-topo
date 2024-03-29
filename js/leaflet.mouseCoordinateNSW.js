/* 
    Author     : Johannes Rudolph
    Updated by : Tom Brennan, for NSW-specific field
*/
/* globals L: true */
L.Control.mouseCoordinateNSW = L.Control.extend({
    options: {
        gps: true,
        utm: false,
        utmref: false,
        nswmap: false,
        position: 'bottomright',
        
        _sm_a: 6378137.0,
        _sm_b: 6356752.314,
        _sm_EccSquared: 6.69437999013e-03,
        _UTMScaleFactor: 0.9996
        
    },
    onAdd: function(map){
        this._map = map;
        
        var className = 'leaflet-control-mouseCoordinate';
        var container = this._container = L.DomUtil.create('div',className);
        
        this._gpsPositionContainer = L.DomUtil.create("div","gpsPos",container);
        
        map.on("mousemove", this._update, this);
        map.on("click", this._update, this); //added by TB 15/04/16 to assist with mobile
        //map.whenReady(this._update, this);
        
        return container;
    },
    _update: function(e){
        var lat = Math.round(e.latlng.lat * 10000) / 10000 ; //edit by TB 20/01/19 for /topo - shorter numbers
        var lng = Math.round(e.latlng.lng * 10000) / 10000 ; //edit by TB 20/01/19 for /topo - shorter numbers
        var gps = {lat: lat,lng: lng};
        var content = "<table id=mousecoordinate>";
        if(this.options.gps){
            content += "<tr><td>GPS</td><td>" + lat + "</td><td> " + lng +"</td></tr>";
            //var gpsMinuten = this._geo2geodeziminuten(gps);
            //content += "<tr><td></td><td style='width: 75px'>"+ gpsMinuten.NS + " " + gpsMinuten.latgrad + "&deg; "+ gpsMinuten.latminuten+"</td><td style='width: 75px'> " + gpsMinuten.WE + " "+ gpsMinuten.lnggrad +"&deg; "+ gpsMinuten.latminuten +"</td></tr>";
            //var gpsMinutenSekunden = this._geo2gradminutensekunden(gps);
            //content += "<tr><td></td><td>"+ gpsMinutenSekunden.NS + " " + gpsMinutenSekunden.latgrad + "&deg; "+ gpsMinutenSekunden.latminuten + "&prime; "+ gpsMinutenSekunden.latsekunden+"&Prime;</td><td> " + gpsMinutenSekunden.WE + " "+ gpsMinutenSekunden.lnggrad +"&deg; "+ gpsMinutenSekunden.latminuten + "&prime; "+ gpsMinutenSekunden.lngsekunden+"&Prime;</td></tr>";
            
        }
        if(this.options.utm){
            var utm = this._geo2utm(gps);
            content += "<tr><td>UTM</td><td colspan='2'>"+utm.zone+"&nbsp;" +utm.x+"&nbsp;" +utm.y+"</td></tr>"; 
        }
        if(this.options.utmref){
            var utmref = this._utm2mgr(this._geo2utm(gps));
            content += "<tr><td>UTM REF</td><td colspan='2'>"+utmref.zone+"&nbsp;" +utmref.band+"&nbsp;" +utmref.x+"&nbsp;" +utmref.y+"</td></tr>"; 
        }
        
        content += "</table>";

        if(this.options.nswmap){
            var sixfigure = this._utm26figure(this._geo2utm(gps));
            var nswmap = this._nswMapRef(gps);
            content += "<table><tr><td>"+nswmap+"</td><td>"+sixfigure+"</td></tr></table>"; 
        } 
        
        this._gpsPositionContainer.innerHTML = content;
    },    
    _utm2geo: function utm2geo(utm){
        // Copyright (c) 2006, HELMUT H. HEIMEIER
        
        var zone = utm.zone;
        var ew = utm.x;
        var nw = utm.y;
         // Laengenzone zone, Ostwert ew und Nordwert nw im WGS84 Datum
        if (zone === "" || ew === "" || nw === ""){
            zone = "";
            ew = "";
            nw = "";
            return;
        }
        var band = zone.substr(2,1);
        zone = parseFloat(zone);
        ew = parseFloat(ew);
        nw = parseFloat(nw);

        // WGS84 Datum
        // Grosse Halbachse a und Abplattung f
        var a = 6378137.000;
        var f = 3.35281068e-3;
        var pi = Math.PI;

        // Polkruemmungshalbmesser c
        var c = a/(1-f);

        // Quadrat der zweiten numerischen Exzentrizitaet
        var ex2 = (2*f-f*f)/((1-f)*(1-f));
        var ex4 = ex2*ex2;
        var ex6 = ex4*ex2;
        var ex8 = ex4*ex4;

        // Koeffizienten zur Berechnung der geographischen Breite aus gegebener
        // Meridianbogenlaenge
        var e0 = c*(pi/180)*(1 - 3*ex2/4 + 45*ex4/64 - 175*ex6/256 + 11025*ex8/16384);
        var f2 =   (180/pi)*(    3*ex2/8 - 3*ex4/16  + 213*ex6/2048 -  255*ex8/4096);
        var f4 =              (180/pi)*(  21*ex4/256 -  21*ex6/256  +  533*ex8/8192);
        var f6 =                           (180/pi)*(  151*ex6/6144 -  453*ex8/12288);

        // Entscheidung Nord-/Sued Halbkugel
        var m_nw;
        if (band >= "N"|| band === ""){
            m_nw = nw;
        }
        else{
            m_nw = nw - 10e6;
        }

        // Geographische Breite bf zur Meridianbogenlaenge gf = m_nw
        var sigma = (m_nw/0.9996)/e0;
        var sigmr = sigma*pi/180;
        var bf = sigma + f2*Math.sin(2*sigmr) + f4*Math.sin(4*sigmr) + f6*Math.sin(6*sigmr);

        // Breite bf in Radianten
        var br = bf * pi/180;
        var tan1 = Math.tan(br);
        var tan2 = tan1*tan1;
        var tan4 = tan2*tan2;

        var cos1 = Math.cos(br);
        var cos2 = cos1*cos1;

        var etasq = ex2*cos2;

        // Querkruemmungshalbmesser nd
        var nd = c/Math.sqrt(1 + etasq);
        var nd2 = nd*nd;
        var nd4 = nd2*nd2;
        var nd6 = nd4*nd2;
        var nd3 = nd2*nd;
        var nd5 = nd4*nd;

        // Laengendifferenz dl zum Bezugsmeridian lh
        var lh = (zone - 30)*6 - 3;
        var dy = (ew-500000)/0.9996;
        var dy2 = dy*dy;
        var dy4 = dy2*dy2;
        var dy3 = dy2*dy;
        var dy5 = dy3*dy2;
        var dy6 = dy3*dy3;

        var b2 = - tan1*(1+etasq)/(2*nd2);
        var b4 =   tan1*(5+3*tan2+6*etasq*(1-tan2))/(24*nd4);
        var b6 = - tan1*(61+90*tan2+45*tan4)/(720*nd6);

        var l1 =   1/(nd*cos1);
        var l3 = - (1+2*tan2+etasq)/(6*nd3*cos1);
        var l5 =   (5+28*tan2+24*tan4)/(120*nd5*cos1);

        // Geographische Breite bw und Laenge lw als Funktion von Ostwert ew
        // und Nordwert nw
        var bw = bf + (180/pi) * (b2*dy2 + b4*dy4 + b6*dy6);
        var lw = lh + (180/pi) * (l1*dy  + l3*dy3 + l5*dy5);

        return {lat: bw, lng: lw};
    },
    _geo2utm: function (gps){
        //Copyright (c) 2006, HELMUT H. HEIMEIER 

        var lw = gps.lng;
        var bw = gps.lat;
        // Geographische Laenge lw und Breite bw im WGS84 Datum
        if (lw <= -180 || lw > 180 || bw <= -80 || bw >= 84){
            //alert("Werte nicht im Bereich des UTM Systems\n -180 <= LW < +180, -80 < BW < 84 N"); // jshint ignore:line
            return;
        }
        lw = parseFloat(lw);
        bw = parseFloat(bw);

        // WGS84 Datum
        // Grosse Halbachse a und Abplattung f
        var a = 6378137.000;
        var f = 3.35281068e-3;
        var pi = Math.PI;
        var b_sel = 'CDEFGHJKLMNPQRSTUVWXX';

        // Polkruemmungshalbmesser c
        var c = a/(1-f);

        // Quadrat der zweiten numerischen Exzentrizitaet
        var ex2 = (2*f-f*f)/((1-f)*(1-f));
        var ex4 = ex2*ex2;
        var ex6 = ex4*ex2;
        var ex8 = ex4*ex4;

        // Koeffizienten zur Berechnung der Meridianbogenlaenge
        var e0 = c*(pi/180)*(1 - 3*ex2/4 + 45*ex4/64 - 175*ex6/256 + 11025*ex8/16384);
        var e2 = c*( - 3*ex2/8 + 15*ex4/32 - 525*ex6/1024 +  2205*ex8/4096);
        var e4 = c*(15*ex4/256 - 105*ex6/1024 + 2205*ex8/16384);
        var e6 = c*( - 35*ex6/3072 + 315*ex8/12288);

        // Laengenzone lz und Breitenzone (Band) bz
        var lzn = parseInt((lw+180)/6) + 1;
        var lz = lzn;
        if (lzn < 10){ 
            lz = "0" + lzn;
        }
        var bd = parseInt(1 + (bw + 80)/8);
        var bz = b_sel.substr(bd-1,1);

        // Geographische Breite in Radianten br
        var br = bw * pi/180;

        var tan1 = Math.tan(br);
        var tan2 = tan1*tan1;
        var tan4 = tan2*tan2;

        var cos1 = Math.cos(br);
        var cos2 = cos1*cos1;
        var cos4 = cos2*cos2;
        var cos3 = cos2*cos1;
        var cos5 = cos4*cos1;

        var etasq = ex2*cos2;

        // Querkruemmungshalbmesser nd
        var nd = c/Math.sqrt(1 + etasq);

        // Meridianbogenlaenge g aus gegebener geographischer Breite bw
        var g = (e0*bw) + (e2*Math.sin(2*br)) + (e4*Math.sin(4*br)) + (e6*Math.sin(6*br));

        // Laengendifferenz dl zum Bezugsmeridian lh
        var lh = (lzn - 30)*6 - 3;
        var dl = (lw - lh)*pi/180;
        var dl2 = dl*dl;
        var dl4 = dl2*dl2;
        var dl3 = dl2*dl;
        var dl5 = dl4*dl;

        // Masstabsfaktor auf dem Bezugsmeridian bei UTM Koordinaten m = 0.9996
        // Nordwert nw und Ostwert ew als Funktion von geographischer Breite und Laenge
        var nw;
        if ( bw < 0 ) {
            nw = 10e6 + 0.9996*(g + nd*cos2*tan1*dl2/2 + nd*cos4*tan1*(5-tan2+9*etasq)*dl4/24);
        }
        else {
            nw = 0.9996*(g + nd*cos2*tan1*dl2/2 + nd*cos4*tan1*(5-tan2+9*etasq)*dl4/24);
        }
        var ew = 0.9996*( nd*cos1*dl + nd*cos3*(1-tan2+etasq)*dl3/6 + nd*cos5 *(5-18*tan2+tan4)*dl5/120) + 500000;

        var zone = lz+bz;

        var nk = nw - parseInt(nw);
        if (nk < 0.5) {
            nw = "" + parseInt(nw);
        }
        else{ 
            nw = "" + (parseInt(nw) + 1);
        }
        
        while (nw.length < 7) {
            nw = "0" + nw;
        }
        
        nk = ew - parseInt(ew);
        if (nk < 0.5) {
            ew = "0" + parseInt(ew);
        }
        else { 
            ew = "0" + parseInt(ew+1);
        }
        
        return {zone: zone, x: ew, y: nw};
     },

    _utm2mgr: function (utm){
        // Copyright (c) 2006, HELMUT H. HEIMEIER 
        
        var zone = utm.zone;
        var ew = utm.x;
        var nw = utm.y;
     
        // Laengenzone zone, Ostwert ew und Nordwert nw im WGS84 Datum
        var z1 = zone.substr(0,2);
        var z2 = zone.substr(2,1);
        var ew1 = parseInt(ew.substr(0,2));
        var nw1 = parseInt(nw.substr(0,2));
        var ew2 = ew.substr(2,5);
        var nw2 = nw.substr(2,5);

        var m_east = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        var m_north = 'ABCDEFGHJKLMNPQRSTUV';

        if (z1 < "01" || z1 > "60" || z2 < "C" ||z2 > "X"){
            //alert(z1 + z2 + " ist keine gueltige UTM Zonenangabe"); // jshint ignore:line
            return
        }
        
        var m_ce;
        var i = z1 % 3;
        if (i === 1) {
            m_ce = ew1 - 1;
        }
        if (i === 2) {
            m_ce = ew1 + 7;
        }
        if (i === 0){
            m_ce = ew1 + 15;
        }

        i = z1 % 2;
        var m_cn;
        if (i === 1) {
            m_cn = 0;
        }
        else {
            m_cn = 5;
        }

        i = nw1;
        while (i-20 >= 0){
            i = i-20;
        }
        
        m_cn = m_cn + i;
        if (m_cn > 19){ 
            m_cn = m_cn - 20;
        }

        var band = m_east.charAt(m_ce) + m_north.charAt(m_cn);
        
        return {zone: zone,band: band, x: ew2, y: nw2};
    },
    _mgr2utm: function (mgr){
        // Copyright (c) 2006, HELMUT H. HEIMEIER 
        
        // Laengenzone zone, Ostwert ew und Nordwert nw im WGS84 Datum
        var m_east_0 = "STUVWXYZ";
        var m_east_1 = "ABCDEFGH";
        var m_east_2 = "JKLMNPQR";
        var m_north_0 = "FGHJKLMNPQRSTUVABCDE";
        var m_north_1 = "ABCDEFGHJKLMNPQRSTUV";

        //zone = raster.substr(0,3);
        var zone = mgr.zone;
        var r_east = mgr.band.substr(0,1);
        var r_north = mgr.band.substr(1,1);

        var i = parseInt(zone.substr(0,2)) % 3;
        var m_ce;
        if (i === 0){
           m_ce = m_east_0.indexOf(r_east) + 1;
        }
        if (i === 1){
            m_ce = m_east_1.indexOf(r_east) + 1;
        }
        if (i === 2){
            m_ce = m_east_2.indexOf(r_east) + 1;
        }
        var ew = "0" + m_ce;

        var m_cn = this._mgr2utm_find_m_cn(zone,mgr.band);
        
        var nw;
        if (m_cn.length === 1){
           nw = "0" + m_cn;
        }
        else {
           nw = "" + m_cn;
        }

        return {zone: zone, x: ew, y: nw};
    },
    _mgr2utm_find_m_cn: function (zone, mgrBand){
        var i = parseInt(zone.substr(0,2)) % 2;
        var m_cn;
        if (i === 0){
           m_cn = m_north_0.indexOf(r_north);
        }
        else{
           m_cn = m_north_1.indexOf(r_north);
        }

        var band = zone.substr(2,1);
        if (band >= "N"){
            if (band === "Q" && m_cn < 10){
               m_cn = m_cn + 20;
            }
            if (band >= "R"){
               m_cn = m_cn + 20;
            }
            if (band === "S" && m_cn < 30){
               m_cn = m_cn + 20;
            }
            if (band >= "T"){
               m_cn = m_cn + 20;
            }
            if (band === "U" && m_cn < 50){
               m_cn = m_cn + 20;
            }
        }
        else {
            if (band === "C" && m_cn < 10){
               m_cn = m_cn + 20;
            }
            if (band >= "D"){
               m_cn = m_cn + 20;
            }
            if (band === "F" && m_cn < 30){
               m_cn = m_cn + 20;
            }
            if (band >= "G"){
               m_cn = m_cn + 20;
            }
            if (band === "H" && m_cn < 50){
               m_cn = m_cn + 20;
            }
            if (band >= "J"){
               m_cn = m_cn + 20;
            }
            if (band === "K" && m_cn < 70){
               m_cn = m_cn + 20;
            }
            if (band >= "L"){
               m_cn = m_cn + 20;
            }
        }
        return m_cn;
    },
    _geo2geodeziminuten: function (gps){
        var latgrad = parseInt(gps.lat);
        var latminuten = Math.round( ((gps.lat - latgrad) * 60) * 10000 ) / 10000;

        var lnggrad = parseInt(gps.lng);
        var lngminuten = Math.round( ((gps.lng - lnggrad) * 60) * 10000 ) / 10000;

        return this._AddNSEW({latgrad: latgrad, latminuten: latminuten, lnggrad: lnggrad, lngminuten: lngminuten});
    },
    _geo2gradminutensekunden: function (gps){
        var latgrad = parseInt(gps.lat);
        var latminuten = (gps.lat - latgrad) * 60;
        var latsekunden = Math.round(((latminuten - parseInt(latminuten)) * 60) * 100) / 100;
        latminuten = parseInt(latminuten);

        var lnggrad = parseInt(gps.lng);
        var lngminuten = (gps.lng - lnggrad) * 60;
        var lngsekunden = Math.round(((lngminuten - parseInt(lngminuten)) * 60) * 100) /100;
        lngminuten = parseInt(lngminuten);
        
        return this._AddNSEW({latgrad: latgrad, latminuten: latminuten,latsekunden: latsekunden, lnggrad: lnggrad, lngminuten: lngminuten, lngsekunden: lngsekunden});
    },
    _AddNSEW: function (coord){
        coord.NS = "N";
        coord.WE = "E";
        if(coord.latgrad < 0){
            coord.latgrad = coord.latgrad * (-1);
            coord.NS = "S";
        }
        if(coord.lnggrad < 0){
            coord.lnggrad = coord.lnggrad * (-1);
            coord.EW = "W";
        }
        return coord;
    },
    _utm26figure: function (utm){
        var ew = utm.x;
        var nw = utm.y;
     
        var ew2 = ew.substr(2,3);
        var nw2 = nw.substr(2,3);
        
        return ew2 + nw2;
    },
    _nawMapGridRef: function (gps) {
      var lat = gps.lat, lng = gps.lng;

      var X = Math.floor(lng * 2) - 211; if (X < 10) X = '0'+X;
      var Y = Math.floor(lat * 2) + 98;  if (Y < 10) Y = '0'+Y;

      if ((lat % 0.5) < -0.25) {
          var s25k = [ X, Y, '-', ((lng % 0.5) >= 0.25)? 2 : 3, ((lat % 0.25) > -0.125)? 'N' : 'S' ].join('');
          var s50k = [ X, Y, '-','S'].join('');
      } else {
          var s25k = [ X, Y, '-', ((lng % 0.5) >= 0.25)? 1 : 4, ((lat % 0.25) > -0.125)? 'N' : 'S' ].join('');
          var s50k = [ X, Y, '-','N'].join('');
      }
      var s100k = [ X, Y].join('');
      return [s25k, s50k, s100k];
    },
    _nswMapRef: function (gps) {
      var mapGrid = this._nawMapGridRef(gps);
      var mapList = {};
      for (i=0; i < nsw_map_bounds.length; i++) {
        mapList[nsw_map_bounds[i].mapnumber] = nsw_map_bounds[i].maptitle;       
      }
      if (mapGrid[0] in mapList) { return mapList[mapGrid[0]]}
      else if (mapGrid[1] in mapList) { return mapList[mapGrid[1]]}
      else if (mapGrid[2] in mapList) { return mapList[mapGrid[2]]}
      else return '';
    }
});

L.control.mouseCoordinateNSW = function (options) {
    return new L.Control.mouseCoordinateNSW(options);
};