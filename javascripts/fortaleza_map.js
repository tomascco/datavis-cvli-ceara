function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(main);

async function main() {
  let dataset = await d3
    .csv('data/CVLI_2020_MAPS.csv')
    .then(function(data){
      let parseDate = d3.utcParse("%d/%m/%Y");

      data.forEach(function(item){
        item.dtg = parseDate(item.DATA);

      });

      return data;
  });

  let dataset_fortaleza= [];

  let fil_dat=dataset.filter(function(d) {

  return d.MUNICIPIO.indexOf('Fortaleza') !== -1
  })

  dataset_fortaleza=dataset_fortaleza.concat(fil_dat);
  let count =0;
  dataset_fortaleza.forEach(function(d){
    d.ID=count;count=count+1;
  })

  let facts_fortaleza = crossfilter(dataset_fortaleza)
  let ais_dim = facts_fortaleza.dimension(d=>d.AIS)
  let ais_group = ais_dim.group()
  let max_value = 0
  let map_AIS_count = new Map()
  let mapLayerGroups =[];
  let idDim = facts_fortaleza.dimension(d=>[d.ID,d.AIS])
  let idGroup= idDim.group()

  ais_group.all().forEach(function(item){
    if(max_value<item.value){max_value=item.value}
    map_AIS_count.set(item.key,+item.value)
  })
  let min_value =max_value

  ais_group.all().forEach(function(item){
    if(min_value>item.value){min_value=item.value}
  })
  //let crime_scale = d3.scaleQuantize().domain([0, max_value+20]).range(d3.schemeReds[9])

  let ais_groups=['AIS 1','AIS 2','AIS 3', 'AIS 4', 'AIS 5', 'AIS 6', 'AIS 7', 'AIS 8', 'AIS 9', 'AIS 10']
  let colors=d3.schemeCategory10;
  let colorScale_ais = d3.scaleOrdinal()
                 .domain(ais_groups)
                 .range(colors)


  let facts = crossfilter(dataset);
  let crime_scale = d3.scaleSequential().domain([min_value-10, max_value+20])
  .interpolator(d3.interpolateReds)

  let bairros = await d3.json("data/FortalezaBairros.geojson");
  let bairros_AIS = await d3.csv("data/BAIRROS_AIS@1.csv");
  let bairro_AIS_map = new Map()
  bairros_AIS.forEach(function(d){bairro_AIS_map.set(d.Nome,d.AIS)})

  let map = L.map('fortaleza_map').setView([-3.792614,-38.515877], 11)

  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
                attribution:`&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
                Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
                maxZoom:17}).addTo(map)


  let infoControl = L.control()

  infoControl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  }

  infoControl.update = function (feat) {
  }



  infoControl.addTo(map);

  let svg = d3.select("#fortaleza_map");

  function highlightFeature(e) {
      let layer = e.target;

    layer.setStyle({
          weight: 2,
          color: '#fcba03',
          dashArray: '',
          fillOpacity: 0.7
    });

    layer.bindTooltip(
        '<b>' + layer.feature.properties.NOME +'</br>'+bairro_AIS_map.get(layer.feature.properties.NOME)+ '</b><br />').openTooltip();

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }

    infoControl.update(layer.feature);
  }

  let geoj;

  function horizontalbar(dataset,ais_groups,colorScale_ais,bairros_AIS){
    let dataset_fortaleza= [];

    let fil_dat=dataset.filter(function(d) {
      return d.MUNICIPIO.indexOf('Fortaleza') !== -1
    })

  dataset_fortaleza=dataset_fortaleza.concat(fil_dat);
  let count =0;
  dataset_fortaleza.forEach(function(d){d.ID=+count;count=count+1;})

  let facts_id = crossfilter(dataset_fortaleza)
  let AISfor = facts_id.dimension(d=>d.AIS)
  let ais_group= AISfor.group()

  let idDim = facts_id.dimension(d=>[d.ID,d.AIS])
  let idGroup= idDim.group()

  let xScale_ais = d3.scaleOrdinal().domain(ais_groups)
  let rChart = dc.rowChart(document.querySelector("#bar_chart"));
  let max_value=0;
  let map_AIS_count = new Map()
  ais_group.all().forEach(function(item){
    if(max_value<+item.value){max_value=item.value}
    map_AIS_count.set(item.key,+item.value)
  })
  let min_value =max_value

  ais_group.all().forEach(function(item){
    if(min_value>item.value){min_value=item.value}
  })

  let crime_scale = d3.scaleSequential(d3.interpolateReds)
                      .domain([min_value-40, max_value+40])


  rChart
      .height(400)
      .dimension(AISfor)
      .group(ais_group)
      .margins({top: 0, right: 20, bottom: 20, left: 10})
      .x(xScale_ais)
      .elasticX(true)
      .on("filtered", function(chart,filter){
                      globalThis.ais_filtred=updateMarkers(idGroup)})
      .colors(crime_scale)
      .colorAccessor(function(item){return item.value;});
    dc.renderAll()
  function AddXAxis(chartToUpdate, displayText){
  chartToUpdate.svg()
                .append("text")
                .attr("class", "x-axis-label")
                .attr("text-anchor", "middle")
                .attr("x", chartToUpdate.width()/2)
                .attr("y", chartToUpdate.height()-3.5)
                .text(displayText);

  }
    AddXAxis(rChart, "This is the x-axis!");
  }
  function showLayer(bairros) {
    for(let i=0;i<bairros.length;i++){
      var lg = mapLayerGroups[bairros[i]];
      map.addLayer(lg);
    }
}
  function hideLayer(bairros) {
    for(let i=0;i<bairros.length;i++){
      var lg = mapLayerGroups[bairros[i]];
      map.removeLayer(lg);
  }
}
horizontalbar(dataset,ais_groups,colorScale_ais)
function updateMarkers(idGroup){

  let ids = idGroup.all()
  let todisplay = new Array(ids.length) //preallocate array to be faster
  let mc = 0; //counter of used positions in the array
  for (let i = 0; i < ids.length; i++) {
  let tId = ids[i];
    if(tId.value > 0){
      //when an element is filtered, it has value > 0
      todisplay[mc] =tId.key[1]
      mc = mc + 1
    }
  }
  let ais_groups =[];

  for(let i=0;i<todisplay.length;i++){
    if(!(ais_groups.indexOf(todisplay[i]) > -1)){
      ais_groups.push(todisplay[i])
    }
  }
  bairros_selected = []
  bairros_removed = []
  bairros_AIS.forEach(function(item){
                    if(ais_groups.indexOf(item.AIS) > -1){bairros_selected.push(item.Nome)}
                    if(!(ais_groups.indexOf(item.AIS) > -1)){bairros_removed.push(item.Nome)}
                    }



  )
  hideLayer(bairros_removed)
  showLayer(bairros_selected)

  }
  function resetHighlight(e) {
    geoj.resetStyle(e.target);
    infoControl.update();
  }
  function style(feature) {
    return {
          weight: 0,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.6,
          fillColor:crime_scale(map_AIS_count.get(bairro_AIS_map.get(feature.properties.NOME)))
          };
  }
  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }
  function onEachFeature(feature, layer) {
    var lg = mapLayerGroups[feature.properties.NOME];

    if (lg === undefined) {
        lg = new L.layerGroup();
        //add the layer to the map
        lg.addTo(map);
        //store layer
        mapLayerGroups[feature.properties.NOME] = lg;
    }

    //add the feature to the layer
    layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
    lg.addLayer(layer);
  }


  geoj=L.geoJson(bairros, {
        style: style,
        onEachFeature: onEachFeature,
    }).addTo(map)

}
