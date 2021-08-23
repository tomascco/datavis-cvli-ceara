function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
let mapLayerGroups =[]
let map;
let dataset;
let crime_scale_ceara;
//let facts;

ready(main);
async function showLayer(municipios){
  for(let i=0;i<municipios.length;i++){  
    var lg = mapLayerGroups[municipios[i]];
    if(!(typeof lg === 'undefined')){
      console.log(lg)
    map.addLayer(lg);
    } 
   }   
}

async function hideLayer(municipios){
  for(let i=0;i<municipios.length;i++){  
    var lg = mapLayerGroups[municipios[i]];
    if(!(typeof lg === 'undefined')){
    console.log(lg)
    map.removeLayer(lg);
    }  
}
}

async function updateMarkers(idGroup,AIS_df){
  
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
  //console.log(todisplay)
  var ais_groups =[];

  for(let i=0;i<todisplay.length;i++){
    if(!(ais_groups.indexOf(todisplay[i]) > -1)){
      ais_groups.push(todisplay[i])
    }
  }
  municipios_selected = []
  municipios_removed = []
  AIS_df.forEach(function(item){
                    if(ais_groups.indexOf(item.AIS) > -1){municipios_selected.push(item.MUNICIPIO)}
                    if(!(ais_groups.indexOf(item.AIS) > -1)){municipios_removed.push(item.MUNICIPIO)}
                    }
                    
                    
  
  )
  hideLayer(municipios_removed) 
  showLayer(municipios_selected)
}

async function genderControls2(facts) {
  genderDimension = facts.dimension(d => d.SEXO);
  let genderControls = dc.cboxMenu('#gender-controls_ais');

  genderControls
    .dimension(genderDimension)
    .group(genderDimension.group())
    .multiple(true);
}

async function crimeControls2(facts) {
  crimeDimension = facts.dimension(d => d['NATUREZA DO FATO']);
  let kindOfCrimeControls = dc.cboxMenu('#kind-of-crime_ais');

  kindOfCrimeControls
    .dimension(crimeDimension)
    .group(crimeDimension.group())
}

async function weaponControls2(facts) {
  weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  let weaponControls = dc.cboxMenu('#weapon-controls_ais');

  weaponControls
    .dimension(weaponDimension)
    .group(weaponDimension.group())
}



async function showLayer(municipios){
    console.log(municipios)
    for(let i=0;i<municipios.length;i++){  
      var lg = mapLayerGroups[municipios[i]];
      if(!(typeof lg === 'undefined')){
        console.log(lg)
      map.addLayer(lg);
      } 
     }   
}

async function hideLayer(municipios){
    for(let i=0;i<municipios.length;i++){  
      var lg = mapLayerGroups[municipios[i]];
      if(!(typeof lg === 'undefined')){
      console.log(lg)
      map.removeLayer(lg);
      }  
  }
}

async function updateMarkers(idGroup,AIS_df){
  
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
  //console.log(todisplay)
  var ais_groups =[];

  for(let i=0;i<todisplay.length;i++){
    if(!(ais_groups.indexOf(todisplay[i]) > -1)){
      ais_groups.push(todisplay[i])
    }
  }
  bairros_selected = []
  bairros_removed = []
  AIS_df.forEach(function(item){
                    if(ais_groups.indexOf(item.AIS) > -1){bairros_selected.push(item.MUNICIPIO)}
                    if(!(ais_groups.indexOf(item.AIS) > -1)){bairros_removed.push(item.MUNICIPIO)}
                    }
                    
                    
  
  )
  hideLayer(bairros_removed) 
  showLayer(bairros_selected)
}

async function histogram_2(facts){
  ageDimension = facts.dimension(d => d.IDADE);
  ageCount = ageDimension.group().reduceCount();

  let histogram = dc.barChart("#hist_ais");

  histogram
    .height(400)
    .dimension(ageDimension)
    .margins({top: 10, right: 10, bottom: 10, left: 40})
    .group(ageCount)
    .x(d3.scaleLinear().domain([0, 100]))
    .elasticY(true);

  histogram.xAxisLabel("Idade");
  histogram.yAxisLabel("Count");

}

async function heatmapdays(facts){
  let sexDaydim = facts.dimension(function(item){return [item.Mes,item.DiaDaSemana]})
  let sexDayGroup = sexDaydim.group();
  let heatmap = new dc.HeatMap("#heatmap_days")
  let map_sexday = new Map();
  sexDayGroup.all().forEach(function(item){map_sexday.set(String([item.key[0],item.key[1]]),item.value)})
  console.log(map_sexday)
  let dias = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
  let meses= ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  let new_group_data =[]
  meses.forEach(
  function(m_item){
      let value; 
      dias.forEach(function(item_d){
        value =map_sexday.get(String([m_item,item_d]))
        new_group_data.push({'key':[m_item,item_d],'value':value});

      })
  })
  let count =0;
  sexDayGroup.all().forEach(function(item){item.key=new_group_data[count].key;item.value=new_group_data[count].value;count=count+1}) 
  heatmap
  .height(400)
  .width(450)
  .dimension(sexDaydim)
  .group(sexDayGroup)
  .margins({top: 0, right: 0, bottom: 30, left: 60})
  .keyAccessor(function(d) { return d.key[1]; })
  .valueAccessor(function(d) { return d.key[0]; })
  .colorAccessor(function(d) { return +d.value; })
  .title(function(d) {
        return "Mês: " + d.key[0] + "\n" +
               "Dia da Semana:  " + d.key[1] + "\n" +
               "Número de CVLI: " + d.value})
  .colors(["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"])
  .calculateColorDomain();
}
async function horizontalbar(facts,ais_groups,AIS_df,AIS_pop,crime_scale_ceara,ais_group_ceara,ais_dim){
  
  let idDim = facts.dimension(d=>[d.ID,d.AIS])
  let idGroup= idDim.group()
  let xScale_ais = d3.scaleOrdinal().domain(ais_groups)
  let rChart = dc.rowChart(document.querySelector("#bar_ais"));
  rChart
      .height(400)
      .width(400)
      .dimension(ais_dim)
      .group(ais_group_ceara)
      .margins({top: 0, right: 20, bottom: 20, left: 10})
      .x(xScale_ais)
      .elasticX(true)
      .on("filtered", function(chart,filter){
                      ais_filtred=updateMarkers(idGroup,AIS_df)})
      .colors(crime_scale_ceara)
      .colorAccessor(function(item){return item.value;});
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

async function  renderMap2(facts,crime_scale_ceara,AIS_pop,map_AIS_count,AIS_MUN){
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

  map = L.map('ais_map').setView([-4.8864139104811946, -39.60018165919775], 7)

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
  function onEachFeature(feature, layer) {
    var lg = mapLayerGroups[feature.properties.name];

    if (lg === undefined) {
        lg = new L.layerGroup();
        //add the layer to the map
        lg.addTo(map);
        //store layer
        mapLayerGroups[feature.properties.name] = lg;
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
  
  function style_ceara(feature) {
    

    return {
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.6,
      fillColor:crime_scale_ceara(map_AIS_count.get(AIS_MUN.get(feature.properties.name))*100000/AIS_pop.get(AIS_MUN.get(feature.properties.name)))
    };
  }
}


async function lineplot_2(facts){
  let SeriesDim = facts.dimension(d => d3.timeMonth(d.dtg));

  let monthScale = d3.scaleTime().domain([ SeriesDim.bottom(1)[0].dtg, SeriesDim.top(1)[0].dtg]);

  let lineChart = dc.lineChart(document.querySelector('#vitimas_ais'));
  
  lineChart
    .height(400)
    .width(800)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right:40, bottom: 40, left: 30})
    .x(monthScale)
    .renderDataPoints(true)
    .elasticY(true);

    lineChart.xAxisLabel("Data (dia)");
    lineChart.yAxisLabel("Número de CVLI");
}
async function main() {
dataset_ceara = await d3.csv('data/CVLI_2020_map.csv')
                    .then(function(data){
                    let parseDate = d3.utcParse("%d/%m/%Y");
                    data.forEach(function(item){
                  item.dtg = parseDate(item.DATA);});
    
      return data;
  });
  let count =0;
  dataset_ceara.forEach(function(d){
    d.ID=count;count=count+1;
  })
  AIS_pop = await d3.csv('data/AIS_pop.csv').then(
      function(data){
      let map_AIS_pop = new Map()
      data.forEach(function(item){map_AIS_pop.set(item.AIS,item.POP)}
      )
  return map_AIS_pop
  });
  let AIS_df = await d3.csv('data/MUNICIPIO_AIS_interior.csv');
  let AIS_MUN = new Map()
  AIS_df.forEach(function(item){AIS_MUN.set(item.MUNICIPIO,item.AIS)})
  
  let facts_ceara = crossfilter(dataset_ceara)
  let ais_dim_ceara = facts_ceara.dimension(d=>d.AIS)
  let ais_group_ceara = ais_dim_ceara.group()
  console.log(ais_dim_ceara.group().all())
  let max_value = 0
  let map_AIS_count = new Map()
  
  ais_group_ceara.all().forEach(function(item){
    if(max_value<item.value*100000/AIS_pop.get(item.key)){max_value=item.value*100000/AIS_pop.get(item.key)}
    console.log(item.value) 
    console.log(AIS_pop.get(item.key))   
    map_AIS_count.set(item.key,+item.value)
    item.value = item.value*100000/AIS_pop.get(item.key)
    return item
  })
  let min_value =max_value
  ais_group_ceara.all().forEach(function(item){
    if(min_value>item.value*100000/AIS_pop.get(item.key)){min_value=item.value*100000/AIS_pop.get(item.key)}
  }) 
  var ais_groups=['AIS 1', 'AIS 2', 'AIS 3', 'AIS 4', 'AIS 5', 'AIS 6', 'AIS 7', 
                  'AIS 8', 'AIS 9', 'AIS 10', 'AIS 11', 'AIS 12', 'AIS 13', 'AIS 14', 
                  'AIS 15', 'AIS 16', 'AIS 17', 'AIS 18', 'AIS 19', 'AIS 20', 'AIS 21', 'AIS 22']

  
  
  crime_scale_ceara = d3.scaleSequential().domain([min_value-10, max_value+20]).interpolator(d3.interpolateReds)
  lineplot_2(facts_ceara);
  renderMap2(facts_ceara,crime_scale_ceara,AIS_pop,map_AIS_count,AIS_MUN);
  horizontalbar(facts_ceara,ais_groups,AIS_df,AIS_pop,crime_scale_ceara,ais_group_ceara,ais_dim_ceara)
  histogram_2(facts_ceara);
  heatmapdays(facts_ceara);

  genderControls2(facts_ceara);
  crimeControls2(facts_ceara);
  weaponControls2(facts_ceara);
  dc.renderAll();
}