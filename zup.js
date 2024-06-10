
var TOKEN = '0999946a10477f4854a9e6f27fcbe8428FD86B11D191C63FBA2E7E99A76BA983502BAA20';

// global variables
var map,Vibranaya_zona;



// Print message to log
function msg(text) { $('#log').prepend(text + '<br/>'); }


function init() { // Execute after login succeed
  // get instance of current Session
  var session = wialon.core.Session.getInstance();
  // specify what kind of data should be returned
  var flags = wialon.item.Item.dataFlag.base | wialon.item.Unit.dataFlag.lastPosition;
  var res_flags = wialon.item.Item.dataFlag.base | wialon.item.Resource.dataFlag.reports | wialon.item.Resource.dataFlag.zones| wialon.item.Resource.dataFlag.zoneGroups;
 
	var remote= wialon.core.Remote.getInstance();
  remote.remoteCall('render/set_locale',{"tzOffset":7200,"language":'ru',"formatDate":'%Y-%m-%E %H:%M:%S'});
	session.loadLibrary("resourceZones"); // load Geofences Library 
  session.loadLibrary("resourceReports"); // load Reports Library
  session.loadLibrary("resourceZoneGroups"); // load Reports Library

  // load Icon Library
  session.loadLibrary('itemIcon');
  
        
  session.updateDataFlags( // load items to current session
		[{type: 'type', data: 'avl_resource', flags:res_flags , mode: 0}, // 'avl_resource's specification
		 {type: 'type', data: 'avl_unit', flags: flags, mode: 0}], // 'avl_unit's specification
	function (error) { // updateDataFlags callback     
        
      if (error) {
        // show error, if update data flags was failed
        msg(wialon.core.Errors.getErrorText(error));
      } else {
  

        initUIData();
      }
    }
  );

  

}



// will be called after updateDataFlags success
let geozonepoint = [];
let geozones = [];
let geozonesgrup = [];
let IDzonacord=[];
function initUIData() {
  var session = wialon.core.Session.getInstance();
  var resource = wialon.core.Session.getInstance().getItem(20030); //26227 - Gluhiv 20030 "11_ККЗ"
    let gzgroop = resource.getZonesGroups();
  resource.getZonesData(null, function(code, geofences) {
    var cord=[];
      for (let i = 0; i < geofences.length; i++) {
        cord=[];
         var zone = geofences[i];
         if(zone.n[0]=='2' || zone.n[0]=='1' || zone.n[0]=='5') continue;
         var zonegr="";
           for (var key in gzgroop) {
            if(gzgroop[key].n[0]!='*' && gzgroop[key].n[0]!='#'){
           gzgroop[key].zns.forEach(function(item, arr) {
           if(item==zone.id){zonegr=gzgroop[key].n;return;}
           });
            }
           }
         var color = "#" + wialon.util.String.sprintf("%08x", zone.c).substr(2);
           for (let ii = 0; ii < zone.p.length; ii++) {
            cord.push([zone.p[ii].y , zone.p[ii].x]);

           }
           IDzonacord[zone.id]=cord;
           
           var geozona =  L.polygon([cord], {color: '#03d1ec', stroke: true,weight: 2, opacity: 0.8, fillOpacity: 0.3, fillColor: '#03d1ec'});
          // geozona.bindPopup(zone.n);
           geozona.bindTooltip(zone.n +'<br />' +zonegr,{opacity:0.8});
           geozona.zone = zone;
           geozones.push(geozona);   

           geozona.on('click', function(e) {
           
           geozonepoint.length =0;
           Vibranaya_zona = this.zone;
           clearGEO();
           $('#hidezone').click(function() { map.removeLayer(e.target);});
              //msg(Object.entries(e.target.name));
             // msg(e.target._latlngs[0][1].lat);
             //msg(e.target._latlngs[0].length);
             // msg(e.target.res);
              let point = e.target._latlngs[0];
              let ramka=[];
               for (let i = 0; i < point.length; i++) {
               let lat =point[i].lat;
               let lng =point[i].lng;
               geozonepoint.push({x:lat, y:lng}); 
               if(i == geozonepoint.length-1 && geozonepoint[0]!=geozonepoint[i])geozonepoint.push(geozonepoint[0]); 
               ramka.push([lat, lng]);// LatLng - for Leaflet
              // ramka.push([lng, lat]);// LngLat - for TURF
               if(i == point.length-1 && ramka[0]!=ramka[i])ramka.push(ramka[0]); 
               }
               let polilane = L.polyline(ramka, {color: 'red'}).addTo(map);
               geo_layer.push(polilane); 
              
          });

      }
  
      let lgeozone = L.layerGroup(geozones);
      layerControl.addOverlay(lgeozone, "Геозони");
   

      for (var key in gzgroop) {
        let point=[];
        if(gzgroop[key].n[0]!='*' && gzgroop[key].n[0]!='#'){
        gzgroop[key].zns.forEach(function(item1) { if(IDzonacord[item1]){IDzonacord[item1].forEach(function(item2) {point.push(turf.point([item2[1],item2[0]]));});}});
        let points = turf.featureCollection(point);
        let hull = turf.convex(points);
        let poly = L.geoJSON(hull,{fillOpacity: 0,weight:2}).bindTooltip(gzgroop[key].n);
        geozonesgrup.push(poly);
        }
      }

    
      // let lgeozonee = L.layerGroup(geozonesgrup);
      //layerControl.addOverlay(lgeozonee, "Регіони");
    

  });


 
  
$(".livesearch").chosen({search_contains : true});
 $('#lis0').on('change', function(evt, params) {
 
  });
   
}





var layerControl=0;
function initMap() {
  
  map = L.map('map', {
    doubleClickZoom: false,
    inertia: false,
    zoomAnimation: false,
    fadeAnimation: false,
    dragging:false
    
  }).setView([51.62995, 33.64288], 20);
  let sc= L.control.scale({imperial:false}).addTo(map);
  console.log(map.getZoom())
  var basemaps = {
    OSM:L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}),
    'Google Hybrid':L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{ subdomains:['mt0','mt1','mt2','mt3'],layers: 'OSM-Overlay-WMS,TOPO-WMS'})
};

layerControl=L.control.layers(basemaps).addTo(map);
basemaps.OSM.addTo(map);
  
 map.on('dblclick', function(e) {  });
 let kk=0;

 map.on('click', function(e) { 
   if(kk==0)kk=e.latlng;
   console.log(map.distance(kk,e.latlng));
   kk=e.latlng;
  //console.log(map.getSize());
  //var pointXY0 = L.point(e.containerPoint.x,e.containerPoint.y);
 // var pointXY1 = L.point(e.containerPoint.x+1000,e.containerPoint.y);
  //var pointXY2 = L.point(e.containerPoint.x,e.containerPoint.y+1000);
  //var pointL0 = map.containerPointToLatLng(pointXY0);
  //var pointL1 = map.containerPointToLatLng(pointXY1);
  //var pointL2 = map.containerPointToLatLng(pointXY2);
  //var dis1 = map.distance(pointL0,pointL1);
  //var dis2 = map.distance(pointL0,pointL2);
  //var mashtab1 = (dis1/1000).toFixed(5);
  //var mashtab2 = (dis2/1000).toFixed(5);
 // console.log(mashtab1);
 // console.log(mashtab2);

  //L.marker(pointL0).addTo(map);
  //L.marker(pointL1).addTo(map);
  //L.marker(pointL2).addTo(map);
  });

 

 var requestURL =   "./gz";
 var request = new XMLHttpRequest();
 request.open("GET", requestURL);
 //request1.responseType = "json";
 request.send();

 request.onload = function () {
   let files = request.response;
   let pos = -1;
   while ((pos = files.indexOf("=\"/gz/", pos + 1)) != -1) {names.push(files.substr(pos+6, 8));}
   tile(0);
  };
}
let names=[];
let zemgrup=[];
let kadgrup=[];
let km=2.963;
function tile(n) {
  if(n==names.length){
    let lgeozonee = L.layerGroup(kadgrup);
    layerControl.addOverlay(lgeozonee, "Кадастр інше");
     lgeozonee = L.layerGroup(zemgrup);
    layerControl.addOverlay(lgeozonee, "Кадастр землі");
    zemgrup
    $(".livesearch").chosen({search_contains : true});
    $('#lis0').on('change', function(evt, params) {
     kadgrup[parseInt($("#lis0").chosen().val())].openPopup();
     });
     map.setView([51.62995, 33.64288], 9);
   return;
  }
 
  let fname =names[n];
//=============================================================================================================
 var requestURL2 =   "./gz/"+fname+".geojson";
 var request2= new XMLHttpRequest();
 request2.open("GET", requestURL2);
 request2.responseType = "json";
 request2.send();

 request2.onload = function () {
  
  let Xtransform=fname.split('_')[0]-1216;
  let Ytransform=679-fname.split('_')[1];
  let mashtab1 =mashtabX();
  let mashtab2 =mashtabY();
  let fr_point=L.latLng(51.617970, 33.749981);
  var pointL0 = fr_point;
  var pointXY0 = map.latLngToContainerPoint(pointL0);
  pointXY0.x+=Math.round(Xtransform*4096/mashtab1*km);
  pointXY0.y-=Math.round(Ytransform*4096/mashtab2*km);

   var kadastr = request2.response;
   let data = kadastr.features;
   for(var i=0; i < data.length; i++){
    let poly = data[i].geometry.coordinates;
    //console.log(poly.length);
    for(var ii=0; ii < poly.length; ii++){
      for(var iii=0; iii < poly[ii].length; iii++){
        for(var iiii=0; iiii < poly[ii][iii].length; iiii++){

          let shift= map.containerPointToLatLng(L.point(pointXY0.x+(poly[ii][iii][iiii][0]/mashtab1*km),pointXY0.y-(poly[ii][iii][iiii][1]/mashtab2*km)));

          poly[ii][iii][iiii][0]=shift.lat;
          poly[ii][iii][iiii][1]=shift.lng;
        }
      }
    }
     
    
    let address = data[i].properties.address;
    let cadnum = data[i].properties.cadnum;
    let category = data[i].properties.category;
    let ownership = data[i].properties.ownership;
    let purpose = data[i].properties.purpose;
    let link = "https://kadastr.live/parcel/"+cadnum;
    var polygon = L.polygon(poly, {color: '#FF00FF', stroke: true,weight: 1, opacity: 0.4, fillOpacity: 0.3, smoothFactor:2});
    polygon.bindPopup('НОМЕР:   '+cadnum+'<br />'+'АДРЕСА:   '+address+'<br />'+'ПРИЗНАЧЕННЯ:   '+category+'<br />'+'ВЛАСНІСТЬ:   '+ownership+'<br />'+'ВИКОРИСТАННЯ:   '+purpose +'<br /> <a href="'+link+'"target="_blanc">держ реестр</a>');
    if(category=='Землі сільськогосподарського призначення') {zemgrup.push(polygon);} else{ kadgrup.push(polygon);}
   


    $('#lis0').append($('<option>').text(cadnum).val(i));
   }

   n++;
   tile(n);
 };

}

function mashtabX() {
  let fr_point=L.latLng(51.617970, 33.749981);
  var pointL0 = fr_point;
  var pointXY0 = map.latLngToContainerPoint(pointL0);
  var pointXY1 = L.point(pointXY0.x+1000,pointXY0.y);
  var pointL1 = map.containerPointToLatLng(pointXY1);
  var dis1 = map.distance(pointL0,pointL1);
  var mashtab1 = (dis1/1000).toFixed(5);
 return mashtab1;
}
function mashtabY() {
  let fr_point=L.latLng(51.617970, 33.749981);
  var pointL0 = fr_point;
  var pointXY0 = map.latLngToContainerPoint(pointL0);
  var pointXY2 = L.point(pointXY0.x,pointXY0.y+1000);
  var pointL2 = map.containerPointToLatLng(pointXY2);
  var dis2 = map.distance(pointL0,pointL2);
  var mashtab2 = (dis2/1000).toFixed(5);
 return mashtab2;
}

//let ps = prompt('');
//if(ps==55555){
// execute when DOM ready
$(document).ready(function () {
  // init session

  wialon.core.Session.getInstance().initSession("https://local3.ingps.com.ua");
  wialon.core.Session.getInstance().loginToken(TOKEN, "", // try to login
    function (code) { // login callback
      // if error code - print error message
      if (code){ msg(wialon.core.Errors.getErrorText(code)); return; }
      msg('Зеднання з Глухів - успішно');
      initMap();
      init(); // when login suceed then run init() function
      
      
    }
  );
});
//}else{
//  $('#unit_info').hide();
//  $('#map').hide();
//}




  
  
 let geo_layer=[];
 function clearGEO(){  
   for(var i=0; i < geo_layer.length; i++){
  map.removeLayer(geo_layer[i]);
   if(i == geo_layer.length-1){geo_layer=[];}
  }

 }



function Gozone_History() {
let now = new Date();
   let month = now.getMonth()+1;   
   let data = now.getDate()+ '.' +(month < 10 ? '0' : '') + month + '.' +now.getFullYear();
   let zone = Vibranaya_zona;
   let info = Vibranaya_zona.d+'||'+data+'|'+$('#robota').val();
   if(this.innerText=="додати"){
     let remotee= wialon.core.Remote.getInstance();  
  remotee.remoteCall('resource/update_zone',{"n":zone.n,"d":info,"t":zone.t,"w":zone.w,"f":zone.f,"c":zone.c,"tc":zone.tc,"ts":zone.ts,"min":zone.min,"max":zone.max,"oldItemId":zone.rid,"oldZoneId":zone.id,"libId":"","path":"","p":zone.p,"id":zone.id,"itemId":zone.rid,"callMode":"update"},function (error) { if (error) {msg(wialon.core.Errors.getErrorText(error));}else{
 $('#obrobka').append("<tr><td>"+data+"</td><td>"+$('#robota').val()+"</td><td>&#10060</td></tr>");
  }}); 
   }else{
   $('#robota').val(this.innerText);
 
   }


}



