function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
ready(main);

function headbarplot(data,facts,color){
  let mun_map = new Map()
  let MunDim=facts.dimension(d=>d.MUNICIPIO)
  let MunGroup =  MunDim.group()
  MunGroup.all().forEach(function(d){mun_map.set(d.key,d.value)})
  let mapSort = new Map([...mun_map.entries()].sort((a, b) => b[1] - a[1]))
  let cidades = Array.from(mapSort.keys()).slice(0,5)
  let new_dataset = data.filter(function(d){if(cidades.indexOf(d.MUNICIPIO) > -1){return d}})
  let new_facts=crossfilter(new_dataset)
  let new_MunDim = new_facts.dimension(d=>d.MUNICIPIO)
  let new_MunGroup = new_MunDim.group()
  let xScale = d3.scaleOrdinal().domain(cidades)
  let BarChart = dc.barChart(document.querySelector("#head_id"));  
  barplot(new_MunDim,new_MunGroup,color,cidades,xScale,BarChart)
}

function tailbarplot(facts,color){
  let mun_map = new Map()
  let MunDim=facts.dimension(d=>d.MUNICIPIO)
  let MunGroup = MunDim.group()
  MunGroup.all().forEach(function(d){mun_map.set(d.key,d.value)})
  let mapSort = new Map([...mun_map.entries()].sort((a, b) => a[1] - b[1]))
  let cidades = Array.from( mapSort.keys() ).slice(0,5)
  let new_dataset = data.filter(function(d){if(cidades.indexOf(d.MUNICIPIO) > -1){return d}})
  let new_facts=crossfilter(new_dataset)
  MunDim = new_facts.dimension(d=>d.MUNICIPIO)
  MunGroup = MunDim.group()
  let xScale = d3.scaleOrdinal().domain(cidades)
  let BarChart = dc.barChart(document.querySelector("#tail_id"));
  barplot(MunDim,MunGroup,color,cidades,xScale,BarChart)
}

function barplot(dim,group,color,cidades,xScale,BarChart){
  BarChart
    .width(500)
    .height(300)
    .margins({top: 10, right: 30, bottom: 40, left: 40})
    .dimension(dim)
    .group(group)
    .x(xScale)
    .gap(20)
    .colors(color)
    .xAxis().tickValues(cidades)
    BarChart.xUnits(dc.units.ordinal)
    BarChart.xAxisLabel("Municipio")
    BarChart.yAxisLabel("Número de CVLI")
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
  pop_mun = await d3.csv("data/pop_est@3.csv", function(d){
    d.POP=parseFloat(+d.POP); return d}).then(
    function(d){
      let map_mun = new Map()
      d.forEach(function(d){map_mun.set(d["NOME"],d["POP"])});
      return map_mun
    })  

  let facts = crossfilter(dataset);
  headbarplot(dataset,facts,'#777')
  //tailbarplot(facts,'#777')
  let munDim = facts.dimension(d=>[d.MUNICIPIO,d.LATITUTDE,d.LONGITUDE])
  let mumDimCount = munDim.group()
  //let crime_scale = d3.scaleQuantize().domain([0, max_value]).range(d3.schemeReds[9]);
  
  let geo_mun = await d3.json("https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-23-mun.json")
  let CITY_GROUP_BY=mumDimCount.all()
  
  let map = L.map('ceara_map').setView([-4.8864139104811946, -39.60018165919775],7)    
  
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
  let map_tax = new Map()
  let map_numbers =new Map()
  CITY_GROUP_BY.forEach(
      function (d) {
        map_tax.set(d.key[0],(d.value*100000/pop_mun.get(d.key[0])))
        map_numbers.set(d.key[0],+d.value)
      });

  infoControl.update = function (feat) {
      this._div.innerHTML = '<h5>Taxa de CVLIs <br> por 100 mill habitantes</h5>' +  (feat ?
        '<b>' + feat.properties.name +'<br/>'+'População: '+pop_mun.get(feat.properties.name )+
        '<br/>'+'Taxa por 100 mil: '+map_tax.get(feat.properties.name).toFixed(2)
        +'<br/>'+'Número total de CVLI: '+map_numbers.get(feat.properties.name)+
        '</b>'+'<br />'
        :'Passe o mouse sobre uma cidade para obter informação');
    }
  
  let svg = d3.select("#ceara_map");
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
  function style_ceara(feature) {
    let max_value = 249.9671095908433; 
    let crime_scale = d3.scaleQuantize().domain([0, max_value]).range(d3.schemeReds[9])   
  
    let map_tax = new Map()
    CITY_GROUP_BY.forEach(
      function (d) {
        map_tax.set(d.key[0],(d.value*100000/pop_mun.get(d.key[0])))
      });
  

    return {
          weight: 1,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.6,
          fillColor: crime_scale(map_tax.get(feature.properties.name))
        };
  }

  geoj = L.geoJson(geo_mun, {
        style: style_ceara,
        onEachFeature: onEachFeature
    }).addTo(map)

  infoControl.addTo(map);
  //d3.select("#histogram").append(svg)
  dc.renderAll();
}