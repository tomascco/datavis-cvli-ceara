function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let mapLayerGroups2 = [];
let map2;
let dataset2_fortaleza;
let map_AIS_count;
let reds = d3.schemeReds[9];
let bairro_AIS_map;
let AIS_pop;
let geoj

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
      map2.removeLayer(lg);
    }
  }
}

function updateMarkers2(idGroup, bairros_AIS) {
  let ids = idGroup.all()
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

function histogram3(facts) {
  ageDimension = facts.dimension(d => d.IDADE);
  ageCount = ageDimension.group().reduceCount();

  let histogram = dc.barChart("#hist_fortaleza");

  histogram
    .height(250)
    .dimension(ageDimension)
    .margins({ top: 10, right:40 , bottom: 40, left: 40 })
    .group(ageCount)
    .x(d3.scaleLinear().domain([0, 90]))
    .elasticY(true);

  histogram.xAxisLabel("Idade");
  histogram.yAxisLabel("Count");

}

function heatmapdays2(facts) {
  var sexDaydim_2 = facts.dimension(function (item) { return [item.Mes, item.DiaDaSemana] })
  var sexDayGroup_2 = sexDaydim_2.group();
  let heatmap_fortaleza = new dc.HeatMap("#heatmap_fortaleza")
  var ykeyorder = {'Jan':1,'Fev':2,'Mar':3,'Abr':4,'Mai':5,'Jun':6,'Jul':7,'Ago':8,'Set':9,'Out':10,'Nov':11,'Dez':12}
  var xkeyorder = {'Seg':1,'Ter':2,'Qua':3,'Qui':4,'Sex':5,'Sáb':6,'Dom':7}


  heatmap_fortaleza
    .height(300)
    .width(350)
    .dimension(sexDaydim_2)
    .group(sexDayGroup_2)
    .margins({ top: 0, right: 30, bottom: 30, left: 50 })

    .keyAccessor(function (d) { return d.key[1]; })
    .valueAccessor(function (d) { return d.key[0]; })
    .colorAccessor(function (d) { return +d.value; })
    .colOrdering((a, b) => xkeyorder[a] - xkeyorder[b])
    .rowOrdering((a, b) => ykeyorder[a] - ykeyorder[b])
    .title(d => "Mês: " + d.key[0] + "\n" + "Dia da Semana:  " + d.key[1] + "\n" + "Número de CVLI: " + d.value)

  let maxValue = 0;
  sexDayGroup_2.all().forEach(function (item) { if (item.value > maxValue) { maxValue = item.value } })
  let minValue = maxValue;
  sexDayGroup_2.all().forEach(function (item) { if (item.value < minValue) { minValue = item.value } })
  let rangeValue = maxValue - minValue;
  heatmap_fortaleza.colors((d3.scaleSequential([minValue, maxValue], d3.interpolateOranges)));
  heatmap_fortaleza.calculateColorDomain();
  const interpolate = d3.scaleSequential([minValue, maxValue], d3.interpolateOranges)
  let  colors = [];
  let  dark = d3.lab(interpolate(0)).l < 50;
    for (let i = 0; i <100; ++i) {
      colors.push(d3.rgb(interpolate(i)).hex());
    }
  function updateHeatmapLegend(domain) {
    let numberFormatter = d3.format("d");
    let content = `
      <i class="gradient"></i> <b>${numberFormatter(domain[0])}-${numberFormatter(domain[1])} Ocorrências
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

function horizontalbar2(facts_fortaleza, ais_groups, bairros_AIS, AIS_pop, crime_scale2, ais_group, ais_dim,map2) {

  let idDim = facts_fortaleza.dimension(d => [d.ID, d.AIS])
  let idGroup = idDim.group()

  let xScale_ais = d3.scaleOrdinal().domain(ais_groups)
  let rChart = dc.rowChart(document.querySelector("#bar_fortaleza"));

  rChart
    .height(300)
    .width(310)
    .dimension(ais_dim)
    .group(ais_group)
    .margins({ top: 0, right: 10, bottom: 20, left: 50 })
    .x(xScale_ais)
    .elasticX(true)
    .on("filtered", function (chart, filter) { updateMarkers2(idGroup, bairros_AIS) })
    .colors(crime_scale2)
    .colorAccessor(function (item) { return item.value; })
    .labelOffsetX(-10)
    .colorAccessor(function (item) { return item.value;})
    .on('renderlet', function (chart) {
                            chart.selectAll("g.row  text")
                                .style("text-anchor", "end")
                                .call(function (t) {
                                    t.each(function (d) {
                                        var self = d3.select(this);
                                        var text = self.text();
                                        if (text.length > 18) {
                                            self.text('');
                                            text = text.substring(0, 18) + '..';
                                            self.text(text);
                                        }
                                    })
                                });
                        })
  rChart.on('preRedraw', function () {
    let max_value = 0;
    let ais_group = ais_dim.group()
    let map_AIS_count = new Map()
    ais_group.all().forEach(function (item) {
      if (max_value < item.value * 100000 / AIS_pop.get(item.key)) { max_value = item.value * 100000 / AIS_pop.get(item.key) }
      item.value = item.value * 100000 / AIS_pop.get(item.key)
      map_AIS_count.set(item.key, item.value)
    })
    let min_value = max_value

    ais_group.all().forEach(function (item) {
      if (min_value > item.value * 100000 / AIS_pop.get(item.key)) { min_value = item.value * 100000 / AIS_pop.get(item.key) }
    })
    crime_scale2 = d3.scaleQuantize().domain([min_value, max_value+20]).range(reds)
    rChart.group(ais_group)
    crime_scale_ceara_bar = d3.scaleQuantize().domain([min_value, max_value+20]).range(blues)
    rChart.group(ais_group).colors(crime_scale_ceara_bar).colorAccessor(function(item){return item.value;})
    rChart.calculateColorDomain()
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





  let geo_mun = await d3.json("data/FortalezaBairros.geojson");


  map2 = L.map('ais_fortaleza').setView([-3.792614, -38.515877], 10.5)

  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
    attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
                Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
    maxZoom: 17
  }).addTo(map2)

  geoj = L.geoJson(geo_mun, {
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

function weaponKind_f(facts) {
  let weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  let weaponGroup = weaponDimension.group().reduceCount();
  let weapon_names = [];
  let soma=0
  weaponDimension.group().all().forEach(function(d){soma = d.value+soma;weapon_names.push(d.key)})
  let w_bar = dc.pieChart('#weapon-controls_fortaleza');
  let weapon_scale = d3.scaleOrdinal(['Arma branca', 'Arma de fogo', 'Outros meios'], ['#f8be34','#53A051','#006D9C']);

  w_bar
    .height(200)
    .innerRadius(70)
    .radius(140)
    .dimension(weaponDimension)
    .group(weaponGroup)
    .renderLabel(false)
    .legend(dc.legend().highlightSelected(true))
    .colors(weapon_scale)
    .label(function(d) { return (Math.round(d.value /soma * 100)).toFixed(2)+"%" })
    .on('preRedraw', function(chart) {
      let soma =0;
      weaponDimension.group().all().forEach(function(item){soma=soma+item.value})
      chart.group(weaponDimension.group())
      .label(function(d) { return (Math.round(d.value /soma * 100)).toFixed(2)+"%" })
    })
}

function sexKind_f(facts) {
  let sexDimension = facts.dimension(d => d['SEXO']);
  let sexGroup = sexDimension.group();
  let pieChart_sex = dc.pieChart('#gender-controls_fortaleza');
  let soma =0;
  let colorScale = d3.scaleOrdinal(['Masculino', 'Feminino'], ['#1635c7','#e05353']);
  sexDimension.group().all().forEach(function(item){soma=soma+item.value})
  pieChart_sex
    .height(200)
    .innerRadius(70)
    .dimension(sexDimension)
    .group(sexGroup)
    .renderLabel(false)
    .legend(dc.legend())
    .colors(colorScale)
     .label(function(d) { return (Math.round(d.value /soma * 100)).toFixed(2)+"%" })
    .on('preRedraw', function(chart) {
      let soma =0;
      sexDimension.group().all().forEach(function(item){soma=soma+item.value})
      chart.group(sexDimension.group())
       .label(function(d) { return (Math.round(d.value /soma * 100)).toFixed(2)+"%" })
    })
}

function crimeKind_f(facts) {
  let crimeDimension = facts.dimension(d => d['NATUREZA DO FATO']);
  let crimeGroup = crimeDimension.group();
  let soma=0;
  let crime_type_name=new Map()
  crime_type_name.set('HOMICIDIO DOLOSO','Homicídio Doloso')
  crime_type_name.set('LESAO CORPORAL SEGUIDA DE MORTE', 'LCSM')
  crime_type_name.set('ROUBO SEGUIDO DE MORTE (LATROCINIO)','Latrocínio')
  crime_type_name.set('FEMINICÍDIO','Feminicídio')

  crimeDimension.group().all().forEach(function(item){soma=soma+item.value})

  let colorScale = d3.scaleOrdinal(crime_type_name.keys(), ['#0a98a8','#38c7a6','#a1239a','#766aaf']);

  let crimePie = dc.pieChart('#kind-of-crime_fortaleza');
  crimePie
    .height(200)
    .innerRadius(70)
    .dimension(crimeDimension)
    .group(crimeGroup)
    .renderLabel(false)
    .legend(dc.legend().legendText(d => crime_type_name.get(d.name)))
    .colors(colorScale)
     .label(function(d) { return (Math.round(d.value /soma * 100)).toFixed(2)+"%" })
    .on('preRedraw', function(chart) {
      let soma =0;
      crimeDimension.group().all().forEach(function(item){soma=soma+item.value})
      chart.group(crimeDimension.group())
       .label(function(d) { return (Math.round(d.value /soma * 100)).toFixed(2)+"%" })
    })
  }


function lineplot_3(facts,crime_scale2) {
  let SeriesDim = facts.dimension(d => d3.timeMonth(d.dtg));

  let monthScale = d3.scaleTime().domain([SeriesDim.bottom(1)[0].dtg, SeriesDim.top(1)[0].dtg]);

  let lineChart = dc.lineChart(document.querySelector('#vitimas_fortaleza'));

  lineChart
    .height(250)
    .width(500)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right:20, bottom: 40, left: 40})
    .x(monthScale)
    .renderDataPoints(true)
    .elasticY(true)
     .xAxis().ticks(12).tickFormat(d3.timeFormat("%b"))

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
        item.IDADE = parseInt(item.IDADE)
      });

      return data;
    })
    .then(data => data.filter(d => typeof(d.IDADE) === 'number' && !isNaN(d.IDADE)))

  let dataset2_fortaleza = [];

  let fil_dat = dataset2.filter(function (d) {

    return d.MUNICIPIO.indexOf('Fortaleza') !== -1
  })

  dataset2_fortaleza = dataset2_fortaleza.concat(fil_dat);
  let count = 0;
  dataset2_fortaleza.forEach(function (d) {
    d.ID = count; count = count + 1;
  })
  ais_groups = ['AIS 1', 'AIS 2', 'AIS 3', 'AIS 4', 'AIS 5', 'AIS 6', 'AIS 7',
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
  bairros_AIS = await d3.csv("data/BAIRROS_AIS@1.csv");
   bairro_AIS_map = new Map()
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





  let crime_scale2 = d3.scaleQuantize().domain([min_value, max_value+20]).range(reds)
  lineplot_3(facts_fortaleza,crime_scale2);
  renderMap3(facts_fortaleza, crime_scale2, AIS_pop, map_AIS_count, bairro_AIS_map);
  horizontalbar2(facts_fortaleza, ais_groups, bairros_AIS, AIS_pop, crime_scale2, ais_group, ais_dim,map2)
  histogram3(facts_fortaleza);
  heatmapdays2(facts_fortaleza);

  //genderControls3(facts_fortaleza);
  //crimeControls3(facts_fortaleza);
  //weaponControls3(facts_fortaleza);
  weaponKind_f(facts_fortaleza)
  sexKind_f(facts_fortaleza);
  crimeKind_f(facts_fortaleza);
  dc.renderAll();
}
