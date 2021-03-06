function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
ready(main);
let mapLayerGroup =[];
let map;
let blues = d3.schemeReds[9]
let crime_scale_ceara;
let ais_map_tax=new Map();
let info = L.control();
function showLayer(municipios){
  for(let i=0;i<municipios.length;i++){
    var lg = mapLayerGroup[municipios[i]];
    if(!(typeof lg === 'undefined')){
    map.addLayer(lg);
    }
  }
}
function hideLayer(municipios){
  for(let i=0;i<municipios.length;i++){
    var lg = mapLayerGroup[municipios[i]];
    if(!(typeof lg === 'undefined')){
    map.removeLayer(lg);
    }
}
}

async function updateMarkers(idGroup,mun_ais){

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
  let municipios_selected = []
  let muncipios_removed = []

  var data_mun = await d3.csv('data/MUNICIPIO_AIS_interior.csv')
  data_mun.forEach(function(item){
                    if(ais_groups.indexOf(item.AIS) > -1){municipios_selected.push(item.MUNICIPIO)}
                    if(!(ais_groups.indexOf(item.AIS) > -1)){muncipios_removed.push(item.MUNICIPIO)}
                    })
  hideLayer(muncipios_removed)
  showLayer(municipios_selected)
}

function weaponKind_ceara(facts) {
  let weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  let weaponGroup = weaponDimension.group().reduceCount();
  let weapon_names = [];
  let soma=0
  weaponDimension.group().all().forEach(function(d){soma = d.value+soma;weapon_names.push(d.key)})
  let w_bar = dc.pieChart('#weapon-controls_ais');
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

function sexKind_ceara(facts) {
  let sexDimension = facts.dimension(d => d['SEXO']);
  let sexGroup = sexDimension.group();
  let pieChart_sex = dc.pieChart('#gender-controls_ais');
  let soma =0;
  let colorScale = d3.scaleOrdinal(['Masculino', 'Feminino'], ['#5f75de','#e05353']);
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
function crimeKind_ceara(facts) {
  let crimeDimension = facts.dimension(d => d['NATUREZA DO FATO']);
  let crimeGroup = crimeDimension.group();
  let soma=0;
  let crime_type_name=new Map()
  crime_type_name.set('HOMICIDIO DOLOSO','Homic??dio Doloso')
  crime_type_name.set('LESAO CORPORAL SEGUIDA DE MORTE', 'LCSM')
  crime_type_name.set('ROUBO SEGUIDO DE MORTE (LATROCINIO)','Latroc??nio')
  crime_type_name.set('FEMINIC??DIO','Feminic??dio')

  crimeDimension.group().all().forEach(function(item){soma=soma+item.value})

  let colorScale = d3.scaleOrdinal(crime_type_name.keys(), ['#0a98a8','#38c7a6','#a1239a','#766aaf']);

  let crimePie = dc.pieChart('#kind-of-crime_ais');
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


async function ceara_lineplot(facts){
  let SeriesDim = facts.dimension(d => d3.timeMonth(d.dtg));

  let monthScale = d3.scaleTime().domain([ SeriesDim.bottom(1)[0].dtg, SeriesDim.top(1)[0].dtg]);

  let lineChart = dc.lineChart(document.querySelector('#vitimas_ais'));

  lineChart
    .height(250)
    .width(500)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right:20, bottom: 40, left: 40})
    .x(monthScale)
    .elasticY(true)
    .xAxis().ticks(12).tickFormat(d3.timeFormat("%b"))


    lineChart.xAxisLabel("Data (dia)");
    lineChart.yAxisLabel("N??mero de CVLI");
}

function AddXAxis(chartToUpdate, displayText){
    chartToUpdate.svg()
                .append("text")
                .attr("class", "x-axis-label")
                .attr("text-anchor", "middle")
                .attr("x", chartToUpdate.width()/2)
                .attr("y", chartToUpdate.height()-3.5)
                .text(displayText);
}
function rowChart(facts,pop_ais){

  let ais_dim = facts.dimension(d=>d.AIS);


  let ais_labels = ['AIS 11','AIS 12','AIS 13','AIS 14','AIS 15','AIS 16','AIS 17','AIS 18','AIS 19','AIS 20','AIS 21','AIS 22']
  let idDim = facts.dimension(d=>[d.ID,d.AIS])
  let idGroup= idDim.group()
  let xScale_ais = d3.scaleOrdinal().domain(ais_labels)
  let rChart = dc.rowChart(document.querySelector("#bar_ais"));
  let max_value=0;
  let ais_group = ais_dim.group()
  ais_group.all().forEach(function(item){
        if(max_value<item.value*100000/pop_ais.get(item.key)){max_value=item.value*100000/pop_ais.get(item.key)}
          item.value = item.value*100000/pop_ais.get(item.key)
        })
  let min_value =max_value

  ais_group.all().forEach(function(item){
          if(min_value>item.value*100000/pop_ais.get(item.key)){min_value=item.value*100000/pop_ais.get(item.key)}
  })
  let crime_scale_ceara_bar=d3.scaleQuantize().domain([min_value, max_value+20]).range(blues)
  rChart
  .height(300)
  .width(300)
  .dimension(ais_dim)
  .group(ais_group)
  .margins({ top: 0, right: 20, bottom: 20, left: 50 })
  .x(xScale_ais)
  .elasticX(true)
  .on("filtered", function(chart,filter){updateMarkers(idGroup,mun_ais)})
  .colors(crime_scale_ceara_bar)
  .colorAccessor(function(item){return item.value;})
  .labelOffsetX(-10)
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
  rChart.on('preRedraw', function() {
  let ais_group = ais_dim.group()
  max_value =0;
  ais_group.all().forEach(function(item){
  if(max_value<item.value*100000/pop_ais.get(item.key)){max_value=item.value*100000/pop_ais.get(item.key)}
    item.value = item.value*100000/pop_ais.get(item.key)
  })
  let min_value =max_value

    ais_group.all().forEach(function(item){
    if(min_value>item.value*100000/pop_ais.get(item.key)){min_value=item.value*100000/pop_ais.get(item.key)}
  })
    crime_scale_ceara_bar = d3.scaleQuantize().domain([min_value, max_value+20]).range(blues)
    rChart.group(ais_group).colors(crime_scale_ceara_bar).colorAccessor(function(item){return item.value;})
    rChart.calculateColorDomain()
  })
  return rChart
}
function histogram_ceara(facts){
  ageDimension = facts.dimension(d => d.IDADE);
    ageCount = ageDimension.group().reduceCount();

    let histogram = dc.barChart("#hist_ais");

    histogram
      .height(250)
      .dimension(ageDimension)
      .margins({top: 20, right: 20, bottom: 30, left: 30})
      .group(ageCount)
      .x(d3.scaleLinear().domain([0, 90]))
      .elasticY(true)
      histogram.xAxisLabel("Idade",20);
      histogram.yAxisLabel("Count",20);
}
async function renderMap_ceara(facts) {
  let pop_mun = await d3.csv("data/pop_est@3.csv",
      item => {
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

  let pop_ais = await d3
    .csv("data/AIS_pop.csv", item => {
      item.POP = parseInt(item.POP);

      return item;
    })
    .then(function(data){
      let map_mun = new Map();

      data.forEach(item => {
        map_mun.set(item["AIS"], item["POP"])
      });

      return map_mun;
  });
  let aisDimension = facts.dimension(d=>d.AIS)
  let cityDimension = facts.dimension(d => d.MUNICIPIO);
  let CITY_GROUP_BY = cityDimension.group().all();

  let map_tax = new Map();
  let map_numbers =new Map();

  CITY_GROUP_BY.forEach(
      function (d) {
        map_tax.set(d.key,(d.value*100000/pop_mun.get(d.key)))
        map_numbers.set(d.key,+d.value)
      });
  aisDimension.group().all().forEach(
      function(d){
        ais_map_tax.set(d.key,d.value*100000/pop_ais.get(d.key))
      }
  )
  let geo_mun = await d3.json("https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-23-mun.json");

  map = L.map('ais_map').setView([-4.8864139104811946, -39.60018165919775], 6)

  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
                attribution:`&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
                Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
                maxZoom:13}).addTo(map)

  mun_ais = await d3
    .csv("data/MUNICIPIO_AIS_interior.csv")
    .then(function(data){
      let map_mun = new Map();

      data.forEach(item => {
        map_mun.set(item["MUNICIPIO"], item["AIS"])
      });

      return map_mun;
  });
  let geoj = L.geoJson(geo_mun,{
    style: style_ceara,
    onEachFeature: onEachFeature
  }).addTo(map)

  let legendControl = L.control({position: 'bottomright'});

  legendControl.onAdd = function (_map) {
    let div = L.DomUtil.create('div', 'info legend'),
      labels = [],
            n = blues.length,
      from, to;

    for (let i = 0; i < n; i++) {
      let c = blues[i]
            let fromto = crime_scale_ceara.invertExtent(c);
      labels.push(
        '<i style="background:' + blues[i] + '"></i> ' +
        d3.format("d")(fromto[0]) + (d3.format("d")(fromto[1]) ? '&ndash;' + d3.format("d")(fromto[1]) : '+'));
    }

    div.innerHTML = labels.join('<br>')
    return div
  }

  legendControl.addTo(map)

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
        '<b>' + layer.feature.properties.name +'<br/>'+'Popula????o: '+pop_mun.get(layer.feature.properties.name )+
        '<br/>'+'Taxa por 100 mil: '+map_tax.get(layer.feature.properties.name).toFixed(2)
        +'<br/>'+'N??mero total de CVLI: '+map_numbers.get(layer.feature.properties.name)+
        '</b>'+'<br />').openTooltip();

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }
  }

  function resetHighlight(e) {
    geoj.resetStyle(e.target);
  }

  function zoomToFeature(e) {
      map.fitBounds(e.target.getBounds());
  }
function onEachFeature(feature, layer) {
      var lg = mapLayerGroup[feature.properties.name];

      if (lg === undefined) {
          lg = new L.layerGroup();
          //add the layer to the map

          lg.addTo(map);

          //store layer
          mapLayerGroup[feature.properties.name] = lg;
      }

      //add the feature to the layer
      layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
          });
      lg.addLayer(layer);
  }

  function style_ceara(feature) {
    //let max_value = 249.9671095908433;
    //let crime_scale = d3.scaleQuantize().domain([0, 90]).range(d3.schemeReds[9])

    return {
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.6,
      fillColor: crime_scale_ceara(ais_map_tax.get(mun_ais.get(feature.properties.name)))
    };
  }
  let legend_ceara = L.control({position: 'bottomright'});

	legend_ceara.onAdd = function (map) {

		let div = L.DomUtil.create('div', 'info legend'),
			labels = [],
            n = blues.length,
			from, to;

		for (let i = 0; i < n; i++) {
			let c = blues[i]
            let fromto = crime_scale_ceara.invertExtent(c);
			labels.push(
				'<i style="background:' + blues[i] + '"></i> ' +
				d3.format("d")(fromto[0]) + (d3.format("d")(fromto[1]) ? '&ndash;' + d3.format("d")(fromto[1]) : '+'));
		}

		div.innerHTML = labels.join('<br>')
		return div
	}
  if(!(typeof lg === 'undefined')){
   	legend.addTo(map)
  }
}

async function ceara_heatmap(facts){
  var sexDaydim_2 = facts.dimension(function(item){return [item.Mes,item.DiaDaSemana]})
  var sexDayGroup_2 = sexDaydim_2.group();
  let heatmap = new dc.HeatMap("#heatmap_days")
  var ykeyorder = {'Jan':1,'Fev':2,'Mar':3,'Abr':4,'Mai':5,'Jun':6,'Jul':7,'Ago':8,'Set':9,'Out':10,'Nov':11,'Dez':12}
  var xkeyorder = {'Seg':1,'Ter':2,'Qua':3,'Qui':4,'Sex':5,'S??b':6,'Dom':7}

  heatmap
    .width(350)
    .height(300)
    .dimension(sexDaydim_2)
    .group(sexDayGroup_2)
    .margins({ top: 0, right: 30, bottom: 30, left: 50 })
    .keyAccessor(function(d) { return d.key[1]; })
    .valueAccessor(function(d) { return d.key[0]; })
    .colorAccessor(function(d) { return +d.value; })
    .colOrdering((a,b) => xkeyorder[a] - xkeyorder[b])
    .rowOrdering((a,b) => ykeyorder[a] - ykeyorder[b])
    .title(function(d) {
          return "M??s: " + d.key[0] + "\n" +
                "Dia da Semana:  " + d.key[1] + "\n" +
                "N??mero de CVLI: " + d.value})
    .colors(d3.scaleSequential([0,100], d3.interpolateOranges))
    .calculateColorDomain()
    .on('preRedraw', function(chart) {
      chart.calculateColorDomain();
      updateHeatmapLegend(chart.colors().domain());
    });


  function updateHeatmapLegend(domain) {
    let numberFormatter = d3.format("d");
    let content = `
      <i class="gradient"></i> <b>${numberFormatter(domain[0])}-${numberFormatter(domain[1])} Ocorr??ncias
    `;

    let container = document.querySelector('#ceara-heatmap-legend');

    container.innerHTML = '';

    let legend = document.createElement('div');
    legend.classList.add('legend', 'heatmap_legend');


    legend.innerHTML = content;
    container.append(legend);
  }
  updateHeatmapLegend(heatmap.colors().domain());
}

async function main() {
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
    .then(data=>data.filter(d=>!(d.MUNICIPIO=='Fortaleza')))
    .then(data => crossfilter(data));
  let pop_ais = await d3.csv("data/AIS_pop.csv", item => {
    item.POP = parseInt(item.POP);
    return item;
  }).then(function(data){
    let map_mun = new Map();
      data.forEach(item => {
        map_mun.set(item["AIS"], item["POP"])
      });
    return map_mun;
    });
    let ais_dim = facts.dimension(d=>d.AIS)
    let ais_group = ais_dim.group()
    let max_value =0;
    ais_group.all().forEach(function(item){
        if(max_value<item.value*100000/pop_ais.get(item.key)){max_value=item.value*100000/pop_ais.get(item.key)}
          item.value = item.value*100000/pop_ais.get(item.key)
        })
    let min_value =max_value

    ais_group.all().forEach(function(item){
          if(min_value>item.value*100000/pop_ais.get(item.key)){min_value=item.value*100000/pop_ais.get(item.key)}
    })

  crime_scale_ceara = d3.scaleQuantize().domain([min_value, max_value+20]).range(blues)
  //crime_scale_ceara = d3.scaleQuantize().domain([0, 100]).range(blues)


  ceara_lineplot(facts);
  renderMap_ceara(facts);
  let rChart=rowChart(facts,pop_ais);
  histogram_ceara(facts);

  weaponKind_ceara(facts);
  crimeKind_ceara(facts);
  sexKind_ceara(facts)
  ceara_heatmap(facts)
  dc.renderAll();
  //AddXAxis(rChart, "This is the x-axis!");
}
