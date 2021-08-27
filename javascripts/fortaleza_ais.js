function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let mapLayerGroups2 = []
let map2;
let dataset2_fortaleza;
let crime_scale2;
let map_AIS_count
//let facts;

ready(main);

function showLayer2(municipios) {
  for (let i = 0; i < municipios.length; i++) {
    var lg = mapLayerGroups2[municipios[i]];
    if (!(typeof lg === 'undefined')) {
      map2.addLayer(lg);
    }
  }
}

function hideLayer2(municipios) {
  for (let i = 0; i < municipios.length; i++) {
    var lg = mapLayerGroups2[municipios[i]];
    if (!(typeof lg === 'undefined')) {
      console.log(lg)
      map2.removeLayer(lg);
    }
  }
}

function updateMarkers2(idGroup, bairros_AIS) {
  let ids = idGroup.all()
  //console.log(ids)
  let todisplay = new Array(ids.length) //preallocate array to be faster
  let mc = 0; //counter of used positions in the array
  for (let i = 0; i < ids.length; i++) {
    let tId = ids[i];
    if (tId.value > 0) {
      //when an element is filtered, it has value > 0
      todisplay[mc] = tId.key[1]
      mc = mc + 1
    }
  }

  //console.log(todisplay)
  let ais_groups = [];

  for (let i = 0; i < todisplay.length; i++) {
    if (!(ais_groups.indexOf(todisplay[i]) > -1)) {
      ais_groups.push(todisplay[i])
    }
  }

  bairros_selected = []
  bairros_removed = []
  bairros_AIS.forEach(function (item) {
    if (ais_groups.indexOf(item.AIS) > -1) { bairros_selected.push(item.Nome) }
    if (!(ais_groups.indexOf(item.AIS) > -1)) { bairros_removed.push(item.Nome) }
  })

  hideLayer2(bairros_removed)
  showLayer2(bairros_selected)
}

async function genderControls3(facts) {
  genderDimension = facts.dimension(d => d.SEXO);
  let genderControls = dc.cboxMenu('#gender-controls_fortaleza');

  genderControls
    .dimension(genderDimension)
    .group(genderDimension.group())
    .multiple(true);
}

async function crimeControls3(facts) {
  crimeDimension = facts.dimension(d => d['NATUREZA DO FATO']);
  let kindOfCrimeControls = dc.cboxMenu('#kind-of-crime_fortaleza');

  kindOfCrimeControls
    .dimension(crimeDimension)
    .group(crimeDimension.group())
}

async function weaponControls3(facts) {
  weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  let weaponControls = dc.cboxMenu('#weapon-controls_fortaleza');

  weaponControls
    .dimension(weaponDimension)
    .group(weaponDimension.group())
}

function histogram3(facts) {
  ageDimension = facts.dimension(d => d.IDADE);
  ageCount = ageDimension.group().reduceCount();

  let histogram = dc.barChart("#hist_fortaleza");

  histogram
    .height(400)
    .dimension(ageDimension)
    .margins({ top: 10, right: 10, bottom: 30, left: 40 })
    .group(ageCount)
    .x(d3.scaleLinear().domain([0, 100]))
    .elasticY(true);

  histogram.xAxisLabel("Idade");
  histogram.yAxisLabel("Count");

}

function heatmapdays2(facts) {
  var sexDaydim_2 = facts.dimension(function (item) { return [item.Mes, item.DiaDaSemana] })
  var sexDayGroup_2 = sexDaydim_2.group();
  let heatmap_fortaleza = new dc.HeatMap("#heatmap_fortaleza")
  var ykeyorder = { 'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12 }
  var xkeyorder = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 7 }
  heatmap_fortaleza
    .height(300)
    .dimension(sexDaydim_2)
    .group(sexDayGroup_2)
    .margins({ top: 0, right: 30, bottom: 30, left: 55 })
    .keyAccessor(function (d) { return d.key[0]; })
    .valueAccessor(function (d) { return d.key[1]; })
    .colorAccessor(function (d) { return +d.value; })
    .colOrdering((a, b) => ykeyorder[a] - ykeyorder[b])
    .rowOrdering((a, b) => xkeyorder[a] - xkeyorder[b])
    .title(d => "Mês: " + d.key[0] + "\n" + "Dia da Semana:  " + d.key[1] + "\n" + "Número de CVLI: " + d.value);

  let maxValue = 0;
  sexDayGroup_2.all().forEach(function (item) { if (item.value > maxValue) { maxValue = item.value } })
  let minValue = maxValue;
  sexDayGroup_2.all().forEach(function (item) { if (item.value < minValue) { minValue = item.value } })
  let rangeValue = maxValue - minValue;

  heatmap_fortaleza.colors((d3.scaleSequential([minValue, maxValue], d3.interpolateBlues)));
  heatmap_fortaleza.calculateColorDomain();

  function updateHeatmapLegend(domain) {
    let numberFormatter = d3.format("d");
    let content = `
      <i class="gradient"></i> ${numberFormatter(domain[0])}-${numberFormatter(domain[1])} Ocorrências
    `;

    let container = document.querySelector('#fortaleza-heatmap-legend');

    container.innerHTML = '';

    let legend = document.createElement('div');
    legend.classList.add('legend', 'heatmap_legend');


    legend.innerHTML = content;
    container.append(legend);
  }

  heatmap_fortaleza.on('preRedraw', function (chart) {
    chart.calculateColorDomain();
    updateHeatmapLegend(chart.colors().domain());
  });

  updateHeatmapLegend(heatmap_fortaleza.colors().domain());
}

function horizontalbar2(facts_fortaleza, ais_groups, bairros_AIS, AIS_pop, crime_scale2, ais_group, ais_dim) {

  let idDim = facts_fortaleza.dimension(d => [d.ID, d.AIS])
  let idGroup = idDim.group()

  let xScale_ais = d3.scaleOrdinal().domain(ais_groups)
  let rChart = dc.rowChart(document.querySelector("#bar_fortaleza"));

  rChart
    .height(400)
    .width(300)
    .dimension(ais_dim)
    .group(ais_group)
    .margins({ top: 0, right: 20, bottom: 20, left: 10 })
    .x(xScale_ais)
    .elasticX(true)
    .on("filtered", function (chart, filter) { updateMarkers2(idGroup, bairros_AIS) })
    .colors(crime_scale2)
    .colorAccessor(function (item) { return item.value; });
  rChart.on('preRedraw', function () {
    let max_value = 0;
    ais_group = ais_dim.group()
    ais_group.all().forEach(function (item) {
      if (max_value < item.value * 100000 / AIS_pop.get(item.key)) { max_value = item.value * 100000 / AIS_pop.get(item.key) }
      item.value = item.value * 100000 / AIS_pop.get(item.key)
    })
    let min_value = max_value

    ais_group.all().forEach(function (item) {
      if (min_value > item.value * 100000 / AIS_pop.get(item.key)) { min_value = item.value * 100000 / AIS_pop.get(item.key) }
    })
    rChart.group(ais_group)
  })
  dc.renderAll()
  function AddXAxis(chartToUpdate, displayText) {
    chartToUpdate.svg()
      .append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", chartToUpdate.width() / 2)
      .attr("y", chartToUpdate.height() - 4.5)
      .text(displayText);

  }
  AddXAxis(rChart, "Taxa de CVLI por 100 mill");
}

async function renderMap3(facts, crime_scale2, AIS_pop, map_AIS_count, bairro_AIS_map) {
  let pop_mun = await d3
    .csv("data/pop_est@3.csv", item => {
      item.POP = parseInt(item.POP);

      return item;
    })
    .then(function (data) {
      let map_mun = new Map();

      data.forEach(item => {
        map_mun.set(item["NOME"], item["POP"])
      });

      return map_mun;
    });

  let cityDimension = facts.dimension(d => d.MUNICIPIO);
  let CITY_GROUP_BY = cityDimension.group().all();



  let geo_mun = await d3.json("data/FortalezaBairros.geojson");

  map2 = L.map('ais_fortaleza').setView([-3.792614, -38.515877], 11)

  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
    attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
                Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
    maxZoom: 17
  }).addTo(map2)

  let geoj = L.geoJson(geo_mun, {
    style: style,
    onEachFeature: onEachFeature2
  }).addTo(map2);

  let legendControl = L.control({ position: 'bottomright' });


  let colors = d3.schemeReds[9];
  let scale = d3.scaleQuantize().domain(crime_scale2.domain()).range(colors);
  legendControl.onAdd = function (_map) {
    let div = L.DomUtil.create('div', 'info legend'),
      labels = [],
      n = colors.length,
      from, to;

    for (let i = 0; i < n; i++) {
      let c = colors[i]
      let fromto = scale.invertExtent(c);
      labels.push(
        '<i style="background:' + colors[i] + '"></i> ' +
        d3.format("d")(fromto[0]) + (d3.format("d")(fromto[1]) ? '&ndash;' + d3.format("d")(fromto[1]) : '+'));
    }

    div.innerHTML = labels.join('<br>')
    return div
  }

  legendControl.addTo(map2)

  function zoomToFeature(e) {
    cityDimension.filterExact(e.target.feature.properties.name);
    map2.fitBounds(e.target.getBounds());

    dc.redrawAll();
  }
  function onEachFeature2(feature, layer) {
    var lg = mapLayerGroups2[feature.properties.NOME];

    if (lg === undefined) {
      lg = new L.layerGroup();
      //add the layer to the map
      lg.addTo(map2);
      //store layer
      mapLayerGroups2[feature.properties.NOME] = lg;
    }

    //add the feature to the layer
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
    lg.addLayer(layer);
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
      '<b>' + layer.feature.properties.NOME + '</br>' + bairro_AIS_map.get(layer.feature.properties.NOME) + '</b><br />').openTooltip();

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }
  }

  function resetHighlight(e) {
    geoj.resetStyle(e.target);
  }

  function style(feature) {
    return {
      weight: 0,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.6,
      fillColor: crime_scale2(map_AIS_count.get(bairro_AIS_map.get(feature.properties.NOME)))
    };
  }
  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }
  function onEachFeature2(feature, layer) {
    var lg = mapLayerGroups2[feature.properties.NOME];

    if (lg === undefined) {
      lg = new L.layerGroup();
      //add the layer to the map

      lg.addTo(map2);

      //store layer
      mapLayerGroups2[feature.properties.NOME] = lg;
    }

    //add the feature to the layer
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
    lg.addLayer(layer);
  }

}

function lineplot_3(facts) {
  let SeriesDim = facts.dimension(d => d3.timeMonth(d.dtg));

  let monthScale = d3.scaleTime().domain([SeriesDim.bottom(1)[0].dtg, SeriesDim.top(1)[0].dtg]);

  let lineChart = dc.lineChart(document.querySelector('#vitimas_fortaleza'));

  lineChart
    .height(300)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({ top: 10, right: 30, bottom: 40, left: 25 })
    .x(monthScale)
    .renderDataPoints(true)
    .elasticY(true)
    .elasticX(true)
  lineChart.xAxisLabel("Data (dia)");
  lineChart.yAxisLabel("Número de CVLI");
}

async function main() {
  let dataset2 = await d3
    .csv('data/CVLI_2020_map.csv')
    .then(function (data) {
      let parseDate = d3.utcParse("%d/%m/%Y");

      data.forEach(function (item) {
        item.dtg = parseDate(item.DATA);

      });

      return data;
    });

  let dataset2_fortaleza = [];

  let fil_dat = dataset2.filter(function (d) {

    return d.MUNICIPIO.indexOf('Fortaleza') !== -1
  })

  dataset2_fortaleza = dataset2_fortaleza.concat(fil_dat);
  let count = 0;
  dataset2_fortaleza.forEach(function (d) {
    d.ID = count; count = count + 1;
  })
  let ais_groups = ['AIS 1', 'AIS 2', 'AIS 3', 'AIS 4', 'AIS 5', 'AIS 6', 'AIS 7',
    'AIS 8', 'AIS 9', 'AIS 10']
  AIS_pop = await d3.csv('data/AIS_pop.csv').then(
    function (data) {
      let map_AIS_pop = new Map()
      data.forEach(function (item) { if (ais_groups.indexOf(item.AIS) > -1) { map_AIS_pop.set(item.AIS, item.POP) } }
      )
      return map_AIS_pop
    });
  AIS_MUN = new Map()
  //AIS_df.forEach(function(item){AIS_MUN.set(item.MUNICIPIO,item.AIS)})
  let bairros_AIS = await d3.csv("data/BAIRROS_AIS@1.csv");
  let bairro_AIS_map = new Map()
  bairros_AIS.forEach(function (d) { bairro_AIS_map.set(d.Nome, d.AIS) })
  let facts_fortaleza = crossfilter(dataset2_fortaleza)
  let ais_dim = facts_fortaleza.dimension(d => d.AIS)
  let ais_group = ais_dim.group()
  let max_value = 0
  map_AIS_count = new Map()

  ais_group.all().forEach(function (item) {
    if (max_value < item.value * 100000 / AIS_pop.get(item.key)) { max_value = item.value * 100000 / AIS_pop.get(item.key) }
    item.value = item.value * 100000 / AIS_pop.get(item.key)
    map_AIS_count.set(item.key, item.value)
  })
  let min_value = max_value

  ais_group.all().forEach(function (item) {
    if (min_value > item.value * 100000 / AIS_pop.get(item.key)) { min_value = item.value * 100000 / AIS_pop.get(item.key) }
  })





  crime_scale2 = d3.scaleSequential().domain([min_value - 10, max_value + 20])
    .interpolator(d3.interpolateReds)
  lineplot_3(facts_fortaleza);
  renderMap3(facts_fortaleza, crime_scale2, AIS_pop, map_AIS_count, bairro_AIS_map);
  horizontalbar2(facts_fortaleza, ais_groups, bairros_AIS, AIS_pop, crime_scale2, ais_group, ais_dim)
  histogram3(facts_fortaleza);
  heatmapdays2(facts_fortaleza);

  genderControls3(facts_fortaleza);
  crimeControls3(facts_fortaleza);
  weaponControls3(facts_fortaleza);
  dc.renderAll();
}
