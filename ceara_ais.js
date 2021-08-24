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
    console.log(lg)
    map.removeLayer(lg);
    }  
}
}


async function updateMarkers(idGroup,mun_ais){
    
  let ids = idGroup.all()
  //console.log(ids)
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
  console.log(municipios_selected)
  hideLayer(muncipios_removed) 
  showLayer(municipios_selected)
}

async function genderControls_ceara(facts) {
  genderDimension = facts.dimension(d => d.SEXO);
  let genderControls = dc.cboxMenu('#gender-controls_ais');

  genderControls
    .dimension(genderDimension)
    .group(genderDimension.group())
    .multiple(true);
}

async function crimeControls_ceara(facts) {
  crimeDimension = facts.dimension(d => d['NATUREZA DO FATO']);
  let kindOfCrimeControls = dc.cboxMenu('#kind-of-crime_ais');

  kindOfCrimeControls
    .dimension(crimeDimension)
    .group(crimeDimension.group())
}
async function ceara_lineplot(facts){
  let SeriesDim = facts.dimension(d => d3.timeMonth(d.dtg));
  
  let monthScale = d3.scaleTime().domain([ SeriesDim.bottom(1)[0].dtg, SeriesDim.top(1)[0].dtg]);

  let lineChart = dc.lineChart(document.querySelector('#vitimas_ais'));
  
  lineChart
    .height(300)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right:0, bottom: 40, left: 25})
    .x(monthScale)
    .renderDataPoints(true)
    .elasticY(true);

    lineChart.xAxisLabel("Data (dia)");
    lineChart.yAxisLabel("Número de CVLI");
}  
async function weaponControls_ceara(facts) {
  weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  let weaponControls = dc.cboxMenu('#weapon-controls_ais');

  weaponControls
    .dimension(weaponDimension)
    .group(weaponDimension.group())
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
  console.log(ais_group.all())
  rChart
  .height(400)
  .width(300)
  .dimension(ais_dim)
  .group(ais_group)
  .margins({top: 0, right: 20, bottom: 20, left: 10})
  .x(xScale_ais)
  .elasticX(true)
  .on("filtered", function(chart,filter){updateMarkers(idGroup,mun_ais)})
  .colors(crime_scale_ceara)
  .colorAccessor(function(item){return item.value;});
  rChart.on('preRedraw', function() {
  let max_value=0;
  let ais_group = ais_dim.group()  
  ais_group.all().forEach(function(item){
  if(max_value<item.value*100000/AIS_pop.get(item.key)){max_value=item.value*100000/pop_Ais.get(item.key)}
    item.value = item.value*100000/pop_ais.get(item.key)
  })
  let min_value =max_value

  ais_group.all().forEach(function(item){
    if(min_value>item.value*100000/pop_ais.get(item.key)){min_value=item.value*100000/pop_ais.get(item.key)}
  }) 
  rChart.group(ais_group)
})
dc.renderAll()
function AddXAxis(chartToUpdate, displayText){
chartToUpdate.svg()
            .append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", chartToUpdate.width()/2)
            .attr("y", chartToUpdate.height()-4.5)
            .text(displayText);
            
}
AddXAxis(rChart, "Taxa de CVLI por 100 mill");
}
function histogram_ceara(facts){
  ageDimension = facts.dimension(d => d.IDADE);
    ageCount = ageDimension.group().reduceCount();
  
    let histogram = dc.barChart("#hist_ais");

    histogram
      .height(400)
      .dimension(ageDimension)
      .margins({top: 10, right: 10, bottom: 30, left: 40})
      .group(ageCount)
      .x(d3.scaleLinear().domain([0, 100]))
      .elasticY(true);
  
    histogram.xAxisLabel("Idade");
    histogram.yAxisLabel("Count");
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

  let infoControl_ceara = L.control();
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

  infoControl_ceara.onAdd = function (_map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
    }

  infoControl_ceara.update = function (feat) {
    }

  infoControl_ceara.addTo(map);

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

    infoControl_ceara.update(layer.feature);
  }

  function resetHighlight(e) {
    geoj.resetStyle(e.target);
    infoControl_ceara.update();
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
    var ykeyorder = {'Janeiro':1,'Fevereiro':2,'Março':3,'Abril':4,'Maio':5,'Junho':6,'Julho':7,'Agosto':8,'Setembro':9,'Outubro':10,'Novembro':11,'Dezembro':12}
    var xkeyorder = {'Segunda':1,'Terça':2,'Quarta':3,'Quinta':4,'Sexta':5,'Sábado':6,'Domingo':7}
    heatmap
    .height(300)
    .dimension(sexDaydim_2)
    .group(sexDayGroup_2)
    .margins({top: 0, right:20 , bottom: 30, left:120})
    .keyAccessor(function(d) { return d.key[0]; })
    .valueAccessor(function(d) { return d.key[1]; })
    .colorAccessor(function(d) { return +d.value; })
    .colOrdering((a,b) => ykeyorder[a] - ykeyorder[b])
    .rowOrdering((a,b) => xkeyorder[a] - xkeyorder[b])
    .title(function(d) {
          return "Mês: " + d.key[0] + "\n" +
                 "Dia da Semana:  " + d.key[1] + "\n" +
                 "Número de CVLI: " + d.value})
    .colors(d3.scaleSequential([0,100], d3.interpolateBlues))
    .calculateColorDomain()
    .on('preRedraw', function() {
      heatmap.calculateColorDomain();
    })
  
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
    let pop_ais = await d3
  .csv("data/AIS_pop.csv", item => {
    item.POP = parseInt(item.POP);

    return item;
  }) .then(function(data){
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
  rowChart(facts,pop_ais);
  histogram_ceara(facts);
  genderControls_ceara(facts);
  crimeControls_ceara(facts);
  weaponControls_ceara(facts);
  ceara_heatmap(facts)
  dc.renderAll();
}
