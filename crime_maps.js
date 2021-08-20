function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
ready(main);

function histogram1(facts){
  ageDimension = facts.dimension(d => d.IDADE);
  ageCount = ageDimension.group().reduceCount();

  let histogram = dc.barChart("#ceara_hist");

  histogram
    .height(400)
    .dimension(ageDimension)
    .group(ageCount)
    .x(d3.scaleLinear().domain([0, 100]))

  histogram.xAxisLabel("Idade");
  histogram.yAxisLabel("Count");

}

function lineplot(facts) {
  let SeriesDim = facts.dimension(d => d3.timeMonth(d.dtg));

  let monthScale = d3.scaleTime().domain([ SeriesDim.bottom(1)[0].dtg, SeriesDim.top(1)[0].dtg]);

  let lineChart = dc.lineChart('#vitimas_mes');

  lineChart
    .height(300)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right: 10, bottom: 40, left: 30})
    .x(monthScale)
    .renderDataPoints(true)
    .elasticY(true);

    lineChart.xAxisLabel("Data (dia)");
    lineChart.yAxisLabel("Número de CVLI");
};


async function main() {
  let dataset = await d3
    .csv('data/CVLI_2020_MAPS.csv')
    .then(function(data){
      let parseDate = d3.utcParse("%d/%m/%Y");

      data.forEach(function(item){
        item.dtg = parseDate(item.DATA);
        item.IDADE = parseInt(item.IDADE);
      });
      return data;
    })
    .then(data => data.filter(d => typeof(d.IDADE) === 'number' && !isNaN(d.IDADE)))
  pop_mun = await d3.csv("data/pop_est@3.csv", function(d){
    d.POP=parseFloat(+d.POP); return d}).then(
    function(d){
      let map_mun = new Map();
      d.forEach(function(d){map_mun.set(d["NOME"],d["POP"])});
      return map_mun;
    });

  let facts = crossfilter(dataset);

  let munDim = facts.dimension(d => [d.MUNICIPIO, d.LATITUTDE, d.LONGITUDE]);
  let mumDimCount = munDim.group();
  let CITY_GROUP_BY = mumDimCount.all();

  let geo_mun = await d3.json("https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-23-mun.json");

  let map = L.map('ceara_map').setView([-4.8864139104811946, -39.60018165919775], 7)

  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
                attribution:`&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
                Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
                maxZoom:17}).addTo(map)

  let infoControl = L.control();

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

    CITY_GROUP_BY.forEach(function(d) {
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

  histogram1(facts);
  lineplot(facts);


  dc.renderAll();
}
