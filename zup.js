


// global variables
var map;



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
let geozones = [];
let geozonesgrup = [];
let IDzonacord=[];
let geold=null;
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
           geozona.bindPopup(zone.n +'<br />' +zonegr);
           //geozona.bindTooltip(zone.n +'<br />' +zonegr,{opacity:0.8,sticky:true});
           geozona.zone = zone;
           geozones.push(geozona);   
           $('#lis1').append($('<option>').text(zone.n).val(geozones.length-1));
           geozona.on('click', function(e) {
           clearGEO(geo_layer);
           //$('#hidezone').click(function() { map.removeLayer(e.target);});
              //msg(Object.entries(e.target.name));
             // msg(e.target._latlngs[0][1].lat);
             //msg(e.target._latlngs[0].length);
             // msg(e.target.res);
              let point = e.target._latlngs[0];
              if(geold){
                geold.setStyle({color: '#03d1ec', stroke: true,weight: 2, opacity: 0.8,fill: true, fillOpacity: 0.3, fillColor: '#03d1ec'});
                geold=this;
                geold.setStyle({color: '#0000FF', stroke: true,weight: 3, opacity: 0.8,fill: false});
              }else{
                geold=this;
                geold.setStyle({color: '#0000FF', stroke: true,weight: 3, opacity: 0.8,fill: false});
              }
              
             
               $("#info_pole").html(this.zone.n);
              
          });
        
      }
      $(".livesearch").chosen({search_contains : true});

      $('#lis1').on('change', function(evt, params) {
        clearGEO(geo_layer);
        if(geozones[parseInt($("#lis1").chosen().val())]._latlngs[0]){
        let point = geozones[parseInt($("#lis1").chosen().val())]._latlngs[0];
              let ramka=[];
              let cord = point[0];
              for (let i = 0; i < point.length; i++) {
              let lat =point[i].lat;
              let lng =point[i].lng;
              ramka.push([lat, lng]);
              if(i == point.length-1 && ramka[0]!=ramka[i])ramka.push(ramka[0]); 
                     }
              map.setView(cord, 14);
              zoomupdate();
              let polilane = L.polyline(ramka, {color: '#0000FF',weight:3}).addTo(map);
              geo_layer.push(polilane);  
        }
       });
  
      //let lgeozone = L.layerGroup(geozones);
      //layerControl.addOverlay(lgeozone, "Геозони");
   

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


 
  


   
}




var layerControl=0;
var Layer=0;
var layerGrup=0;
var lgeozone=0;
let basemaps=0;
let cord0=0;
let allgeo=[];
function initMap() {
  
  map = L.map('map', {
    doubleClickZoom: false,
    inertia: false,
    zoomAnimation: false,
    fadeAnimation: false
    
  }).setView([51.62995, 33.64288], 9);
  let sc= L.control.scale({imperial:false}).addTo(map);
   basemaps = {
    OSM:L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}),
    'Google Hybrid':L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{ subdomains:['mt0','mt1','mt2','mt3'],layers: 'OSM-Overlay-WMS,TOPO-WMS'})
};

layerControl=L.control.layers(basemaps).addTo(map);
basemaps.OSM.addTo(map);
layerGrup = L.featureGroup().addTo(map);
lgeozone = L.featureGroup().addTo(map);




cord0 =map.getCenter();

map.on('mouseup', function(e) {
  let cord=map.getCenter();
  if(map.distance(cord0, cord)>1000){
    let zoom = map.getZoom();
    let radius=8000;
    if(zoom>=13){radius=6000}
    if(zoom>=14){radius=3000}
    if(zoom>=15){radius=2000}
    cord0=cord;
    layerGrup.clearLayers();
    lgeozone.clearLayers();
    if(zoom>=13){
    for(var i=0; i < allgeo.length; i++){
        if(allgeo[i].options.a==1){if($("#pai").is(":checked")==false) {continue;}}
        if(allgeo[i].options.a==0){if($("#inshe").is(":checked")==false) {continue;}}
          let latlng = allgeo[i]._latlngs[0][0][0];
      if(map.distance(cord0,latlng)<radius){allgeo[i].addTo(layerGrup);}
    }
  }
    if($("#polya").is(":checked")) {
      for(var i=0; i < geozones.length; i++){
        let latlng = geozones[i]._latlngs[0][0];
        if(map.distance(cord0,latlng)<radius*20){geozones[i].addTo(lgeozone);}
      }
    }
  }
  //lgeozone.bringToFront();
});
map.on('zoomend', function(e) {zoomupdate();});
  

$('input[name=checkbox]').change(function() {  zoomupdate()});
 

 var requestURL =   "data.geojson";
 var request = new XMLHttpRequest();
 request.open("GET", requestURL);
 request.responseType = "json";
 request.send();

 request.onload = function () {
  var data = request.response;
  for(var i=0; i < data.length; i++){
    let poly = data[i].coordinates;
    let address = data[i].address;
    let cadnum = data[i].cadnum;
    let category = data[i].category;
    let ownership = data[i].ownership;
    let purpose = data[i].purpose;
    let link = "https://kadastr.live/parcel/"+cadnum;
    let color = '#FF00FF';
    let ind=0;
    if(category=='Землі сільськогосподарського призначення') {color='#FF0000'; ind=1;} 
    var polygon = L.polygon(poly, {color: color, stroke: true,weight: 1, opacity: 0.4, fillOpacity: 0.3, a:ind});
    polygon.bindPopup('НОМЕР:   '+cadnum+'<br />'+'АДРЕСА:   '+address+'<br />'+'ПРИЗНАЧЕННЯ:   '+category+'<br />'+'ВЛАСНІСТЬ:   '+ownership+'<br />'+'ВИКОРИСТАННЯ:   '+purpose +'<br /> <a href="'+link+'"target="_blanc">держ реестр</a>',{minWidth: 100});
    allgeo.push(polygon);
    polygon.on('click', function(e) {
      if($("#grup_info").is(":checked")==false) {clearGEO(geo_layer1);}
      if(e.target._latlngs[0][0]){
      let point = e.target._latlngs[0][0];
            let ramka=[];
            for (let i = 0; i < point.length; i++) {
            let lat =point[i].lat;
            let lng =point[i].lng;
            ramka.push([lat, lng]);
            if(i == point.length-1 && ramka[0]!=ramka[i])ramka.push(ramka[0]); 
                   }
            let polilane = L.polyline(ramka, {color: 'red',weight:2}).addTo(map);
            geo_layer1.push(polilane);
               if($("#grup_info").is(":checked")==false) {
              $("#info_kad").html(this._popup._content.split('<br />')[0]); 
             }else{
              $("#info_kad").html( $("#info_kad").html()+'<br />'+this._popup._content.split('<br />')[0]); 
             }
           
      }
        });
    $('#lis0').append($('<option>').text(cadnum).val(i));
  }

  $('#lis0').on('change', function(evt, params) {
    clearGEO(geo_layer1);
    if(allgeo[parseInt($("#lis0").chosen().val())]._latlngs[0][0]){
    let point = allgeo[parseInt($("#lis0").chosen().val())]._latlngs[0][0];
          let ramka=[];
          let cord = point[0];
          for (let i = 0; i < point.length; i++) {
          let lat =point[i].lat;
          let lng =point[i].lng;
          ramka.push([lat, lng]);
          if(i == point.length-1 && ramka[0]!=ramka[i])ramka.push(ramka[0]); 
                 }
          map.setView(cord, 15);
          zoomupdate();
          let polilane = L.polyline(ramka, {color: 'red',weight:2}).addTo(map);
          geo_layer1.push(polilane);  
    }
   });
  };
}

function zoomupdate(){
  
  let zoom = map.getZoom();
  let radius=8000;
  let cord=map.getCenter();
    cord0=cord;
  if(zoom>=13){radius=6000}
  if(zoom>=14){radius=3000}
  if(zoom>=15){radius=2000}
  layerGrup.clearLayers();
  lgeozone.clearLayers();
  if(zoom>=13){
  for(var i=0; i < allgeo.length; i++){
    if(allgeo[i].options.a==1){if($("#pai").is(":checked")==false) {continue;} }
    if(allgeo[i].options.a==0){if($("#inshe").is(":checked")==false) {continue;} }
    let latlng = allgeo[i]._latlngs[0][0][0];
    if(map.distance(cord0,latlng)<radius){ allgeo[i].addTo(layerGrup); }
  }
}
  if($("#polya").is(":checked")) {
    for(var i=0; i < geozones.length; i++){
      let latlng = geozones[i]._latlngs[0][0];
      if(map.distance(cord0,latlng)<radius*20){geozones[i].addTo(lgeozone);}
    }
  }

//basemaps.OSM.redraw();
}



eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('$(m).l(4(){2.1.6.5().k("j://i.h.g.f");2.1.6.5().e(\'d\',"",4(0){c(0){3(2.1.b.a(0));9}3(\'Зеднання з Глухів - успішно\');8();7()})});',23,23,'code|core|wialon|msg|function|getInstance|Session|init|initMap|return|getErrorText|Errors|if|0999946a10477f4854a9e6f27fcbe842A247D1374A465F550351447C6D99FB325422B89D|loginToken|ua|com|ingps|local3|https|initSession|ready|document'.split('|'),0,{}))





  
  
 let geo_layer=[];
 let geo_layer1=[];

 function clearGEO(data){  
   for(var i=0; i < data.length; i++){
  map.removeLayer(data[i]);
   if(i == data.length-1){data=[];}
  }

 }






