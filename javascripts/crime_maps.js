function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
let map_general;
ready(main_fortaleza);

function weaponKindEstado(facts) {
  let weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  let weaponGroup = weaponDimension.group().reduceCount();
  let weapon_names = [];
  let soma=0
  weaponDimension.group().all().forEach(function(d){soma = d.value+soma;weapon_names.push(d.key)})
  let w_bar = dc.pieChart('#weapon-controls');
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


function sexKind(facts) {
  let sexDimension = facts.dimension(d => d['SEXO']);
  let sexGroup = sexDimension.group();
  let pieChart_sex = dc.pieChart('#gender-controls');
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



function crimeKind(facts) {
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

  let crimePie = dc.pieChart('#kind-of-crime');
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

async function histogram1(facts,map_general){
  ageDimension = facts.dimension(d => d.IDADE);
  ageCount = ageDimension.group().reduceCount();

  let histogram = dc.barChart("#ceara_hist");

  histogram
    .height(250)
    .dimension(ageDimension)
    .group(ageCount)
    .x(d3.scaleLinear().domain([0, 100]))
    .elasticY(true)

  histogram.xAxisLabel("Idade");
  histogram.yAxisLabel("Count");

}

async function lineplot(facts) {
  let SeriesDim = facts.dimension(d => d3.timeMonth(d.dtg));

  let monthScale = d3.scaleTime().domain([ SeriesDim.bottom(1)[0].dtg, SeriesDim.top(1)[0].dtg]);

  let lineChart = dc.lineChart('#vitimas_mes');

  lineChart
    .height(250)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right:20, bottom: 40, left: 40})
    .x(monthScale)
    .renderDataPoints(true)
    .elasticY(true)
    .xAxis().ticks(12).tickFormat(d3.timeFormat("%b"))
    lineChart.xAxisLabel("Data (dia)");
    lineChart.yAxisLabel("Número de CVLI");
};

async function renderMap(facts) {
  let pop_mun = await d3
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
    map_general.setView([-4.8864139104811946, -39.60018165919775], 7);

  });

  let map_tax = new Map()
  let map_numbers =new Map()

  CITY_GROUP_BY.forEach(function(d) {
    map_tax.set(d.key,(d.value*100000/pop_mun.get(d.key)))
    map_numbers.set(d.key,+d.value)
  });

  let geo_mun = await d3.json("https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-23-mun.json");

  let colors = d3.schemeReds[9];
  let crime_scale = d3.scaleQuantize().domain([0, 249.96]).range(colors);

  map_general = L.map('ceara_map').setView([-4.8864139104811946, -39.60018165919775], 7)

  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
                attribution:`&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
                Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
                maxZoom:17}).addTo(map_general)

  let geoj = L.geoJson(geo_mun,{
    style: style_ceara,
    onEachFeature: onEachFeature
  }).addTo(map_general)

  let legendControl = L.control({position: 'bottomright'});

  legendControl.onAdd = function (_map_general) {
    let div = L.DomUtil.create('div', 'info legend'),
      labels = [],
            n = colors.length,
      from, to;

    for (let i = 0; i < n; i++) {
      let c = colors[i]
            let fromto = crime_scale.invertExtent(c);
      labels.push(
        '<i style="background:' + colors[i] + '"></i> ' +
        d3.format("d")(fromto[0]) + (d3.format("d")(fromto[1]) ? '&ndash;' + d3.format("d")(fromto[1]) : '+'));
    }

    div.innerHTML = labels.join('<br>')
    return div
  }

  legendControl.addTo(map_general)


  function zoomToFeature(e) {
    cityDimension.filterExact(e.target.feature.properties.name);
    map_general.fitBounds(e.target.getBounds());

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
  }

  function resetHighlight(e) {
    geoj.resetStyle(e.target);
  }

  function onEachFeature(_feature, layer) {
    layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
  }

  function style_ceara(feature) {
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

async function heatmapgeral(facts){
  var sexDaydim_2 = facts.dimension(function(item){return [item.Mes,item.DiaDaSemana]})
  var sexDayGroup_2 = sexDaydim_2.group();
  let heatmap = new dc.HeatMap("#heatmapgeral_days")
  var ykeyorder = {'Jan':1,'Fev':2,'Mar':3,'Abr':4,'Mai':5,'Jun':6,'Jul':7,'Ago':8,'Set':9,'Out':10,'Nov':11,'Dez':12}
  var xkeyorder = {'Seg':1,'Ter':2,'Qua':3,'Qui':4,'Sex':5,'Sáb':6,'Dom':7}
  let colorScale = d3.scaleSequential([0,100], d3.interpolateOranges);

  heatmap
    .height(300)
    .dimension(sexDaydim_2)
    .group(sexDayGroup_2)
    .margins({top: 0, right:20 , bottom: 30, left:120})
    .keyAccessor(function(d) { return d.key[1]; })
    .valueAccessor(function(d) { return d.key[0]; })
    .colorAccessor(function(d) { return +d.value; })
    .colOrdering((a,b) => xkeyorder[a] - xkeyorder[b])
    .rowOrdering((a,b) => ykeyorder[a] - ykeyorder[b])
    .title(function(d) {
          return "Mês: " + d.key[0] + "\n" +
                  "Dia da Semana:  " + d.key[1] + "\n" +
                  "Número de CVLI: " + d.value})
    .colors(colorScale)
    .calculateColorDomain()
    .on('preRedraw', function(chart) {
      chart.calculateColorDomain();
      updateHeatmapLegend(chart.colors().domain());
    })

  function updateHeatmapLegend(domain) {
    let numberFormatter = d3.format("d");
    let content = `
      <i class="gradient"></i> <b>${numberFormatter(domain[0])}-${numberFormatter(domain[1])} Ocorrências
    `;

    let container = document.querySelector('#city-heatmap-legend');

    container.innerHTML = '';

    let legend = document.createElement('div');
    legend.classList.add('legend', 'heatmap_legend');


    legend.innerHTML = content;
    container.append(legend);
  }
  updateHeatmapLegend(heatmap.colors().domain());
}

async function main_fortaleza() {
  let facts = await d3
    .csv('data/CVLI_2020_map.csv')
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

  histogram1(facts,map_general);
  lineplot(facts);


  heatmapgeral(facts);

  weaponKindEstado(facts);
  sexKind(facts);
  crimeKind(facts);
  dc.renderAll();
}
