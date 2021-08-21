function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
ready(main);

async function histogram1(facts){
  ageDimension = facts.dimension(d => d.IDADE);
  ageCount = ageDimension.group().reduceCount();

  let histogram = dc.barChart("#ceara_hist");

  histogram
    .height(400)
    .dimension(ageDimension)
    .group(ageCount)
    .x(d3.scaleLinear().domain([0, 100]))
    .elasticY(true);

  histogram.xAxisLabel("Idade");
  histogram.yAxisLabel("Count");

}

async function lineplot(facts) {
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

async function genderControls(facts) {
  genderDimension = facts.dimension(d => d.SEXO);
  let genderControls = dc.cboxMenu('#gender-controls');

  genderControls
    .dimension(genderDimension)
    .group(genderDimension.group())
    .multiple(true);
}

async function crimeControls(facts) {
  crimeDimension = facts.dimension(d => d['NATUREZA DO FATO']);
  let kindOfCrimeControls = dc.cboxMenu('#kind-of-crime');

  kindOfCrimeControls
    .dimension(crimeDimension)
    .group(crimeDimension.group())
}

async function weaponControls(facts) {
  weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  let weaponControls = dc.cboxMenu('#weapon-controls');

  weaponControls
    .dimension(weaponDimension)
    .group(weaponDimension.group())
}

async function renderMap(facts) {
  pop_mun = await d3
    .csv("data/pop_est@3.csv", item => {
      item.POP = parseInt(item.POP);

      return item;
    })
    .then(function(data){
      let map_mun = new Map();

      data.forEach(item => {
        map_mun.set(item["NOME"], item["POP"])
      });

      return map_mun;
    });

  let cityDimension = facts.dimension(d => d.MUNICIPIO);
  let CITY_GROUP_BY = cityDimension.group().all();

  d3.select('#clear-all').on('click', () => {
    cityDimension.filterAll();
    dc.redrawAll();
    map.setView([-4.8864139104811946, -39.60018165919775], 7);
  });

  let map_tax = new Map()
  let map_numbers =new Map()

  CITY_GROUP_BY.forEach(
      function (d) {
        map_tax.set(d.key,(d.value*100000/pop_mun.get(d.key)))
        map_numbers.set(d.key,+d.value)
      });

  let geo_mun = await d3.json("https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-23-mun.json");

  let map = L.map('ceara_map').setView([-4.8864139104811946, -39.60018165919775], 7)

  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
                attribution:`&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
                Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
                maxZoom:17}).addTo(map)

  let infoControl = L.control();

  let geoj = L.geoJson(geo_mun,{
    style: style_ceara,
    onEachFeature: onEachFeature
  }).addTo(map)

  infoControl.onAdd = function (_map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
    }

  infoControl.update = function (feat) {
    }

  infoControl.addTo(map);

  function zoomToFeature(e) {
    cityDimension.filterExact(e.target.feature.properties.name);
    map.fitBounds(e.target.getBounds());

    dc.redrawAll();
  }

  function highlightFeature(e) {
    let layer = e.target;

    layer.setStyle({
          weight: 2,
          color: '#fcba03',
          dashArray: '',
          fillOpacity: 0.7
    });
    layer.bindTooltip(
        '<b>' + layer.feature.properties.name +'<br/>'+'População: '+pop_mun.get(layer.feature.properties.name )+
        '<br/>'+'Taxa por 100 mil: '+map_tax.get(layer.feature.properties.name).toFixed(2)
        +'<br/>'+'Número total de CVLI: '+map_numbers.get(layer.feature.properties.name)+
        '</b>'+'<br />').openTooltip();

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }

    infoControl.update(layer.feature);
  }

  function resetHighlight(e) {
    geoj.resetStyle(e.target);
    infoControl.update();
  }

  function onEachFeature(_feature, layer) {
    layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
  }

  function style_ceara(feature) {
    let max_value = 249.9671095908433;
    let crime_scale = d3.scaleQuantize().domain([0, max_value]).range(d3.schemeReds[9])

    return {
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.6,
      fillColor: crime_scale(map_tax.get(feature.properties.name))
    };
  }
}

async function main() {
  let facts = await d3
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
    .then(data => crossfilter(data));

  renderMap(facts);

  histogram1(facts);
  lineplot(facts);

  genderControls(facts);
  crimeControls(facts);
  weaponControls(facts);

  dc.renderAll();
}
