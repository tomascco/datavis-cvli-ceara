function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(main);
function horizontalbar(dataset,ais_groups,colorScale_ais){
  let dataset_fortaleza= [];

  let fil_dat=dataset.filter(function(d) {
  
  return d.MUNICIPIO.indexOf('Fortaleza') !== -1
  })

  dataset_fortaleza=dataset_fortaleza.concat(fil_dat);
  let count =0;
  dataset_fortaleza.forEach(function(d){
    d.ID=count;count=count+1;
  })
  let facts_id = crossfilter(dataset_fortaleza)
  let AISfor = facts_id.dimension(d=>d.AIS)
  let xScale_ais = d3.scaleOrdinal().domain(ais_groups)
  let rChart = dc.rowChart(document.querySelector("#bar_chart"));
  rChart
      .width(450)
      .height(400)
      .dimension(AISfor)
      .group(AISfor.group())
      .margins({top: 0, right: 20, bottom: 20, left: 10})
      .x(xScale_ais)
      .elasticX(true)
      .colors(colorScale_ais)
      .colorAccessor(d => d.key)
      .on("filtered",
      function(chart,filter){
        
      })
  dc.renderAll()
}
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
  let ais_groups=['AIS 1','AIS 2','AIS 3', 'AIS 4', 'AIS 5', 'AIS 6', 'AIS 7', 'AIS 8', 'AIS 9', 'AIS 10']  
  let colors=d3.schemeCategory10;
  let colorScale_ais = d3.scaleOrdinal()
                 .domain(ais_groups)
                 .range(colors)
  horizontalbar(dataset,ais_groups,colorScale_ais)
  let facts = crossfilter(dataset);

  //let crime_scale = d3.scaleQuantize().domain([0, max_value]).range(d3.schemeReds[9]);
  //let geo_mun = await d3.json("https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-23-mun.json")
  let bairros = await d3.json("data/FortalezaBairros.geojson");
  let bairros_AIS = await d3.csv("data/BAIRROS_AIS@1.csv");
  let bairro_AIS_map = new Map()
    bairros_AIS.forEach(function(d){
    bairro_AIS_map.set(d.Nome,d.AIS)
    })

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
      this._div.innerHTML = '<h5>Bairros por AIS:</h5>' +  (feat ?
        '<b>' + feat.properties.NOME +' '+bairro_AIS_map.get(feat.properties.NOME)+ '</b><br />'
        : 'Passe o mouse sobre um bairro');
  }

  infoControl.addTo(map);
  
  let svg = d3.select("#fortaleza_map");
  
  function highlightFeature(e) {
      let layer = e.target;
      console.log(e.target)
  
    layer.setStyle({
          weight: 2,
          color: '#fcba03',
          dashArray: '',
          fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }

    infoControl.update(layer.feature);
  }
  
  let geoj;

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
          fillColor:colorScale_ais(bairro_AIS_map.get(feature.properties.NOME))
          };
  }
  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }
  function onEachFeature(feature, layer) {
    layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
  }

  geoj=L.geoJson(bairros, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map)

  //d3.select("#histogram").append(svg)
  dc.renderAll();
}
