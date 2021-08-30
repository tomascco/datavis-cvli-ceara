const weekDays = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado'
}

function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
ready(main);

async function citiesChart(facts) {
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

  let citiesDimension = facts.dimension(d => d.MUNICIPIO);
  let citiesGroup = citiesDimension.group();
  let city_names = []
  citiesGroup.all().forEach(function(item){city_names.push(item.key)})
  let xScale_ais = d3.scaleOrdinal().domain(city_names)
  let rChart = dc.rowChart('#feminicides-by-city')
  rChart
    .height(400)
    .dimension(citiesDimension)
    .group(citiesGroup)
    .margins({ top: 20, right: 20, bottom: 40, left: 150 })
    .x(xScale_ais)
    .elasticX(true)
    .colors('#1f77b4')
    .labelOffsetX(-20)
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
}

function weaponKind(facts) {
  weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  weaponGroup = weaponDimension.group();
  let soma = 0;
  weaponGroup.all().forEach(function(item){soma=soma+item.value})
  let weapon_scale = d3.scaleOrdinal(['Arma branca', 'Arma de fogo', 'Outros meios'], ['#f8be34','#53A051','#006D9C']);

  pieChart = dc.pieChart('#weapon-kind');

  pieChart
    .dimension(weaponDimension)
    .group(weaponGroup)
    .height(200)
    .colors(weapon_scale)
    .legend(dc.legend().highlightSelected(true))
    .label(function(d) { return Math.floor(d.value /soma * 100)+"%" })
    .on('preRedraw', function(chart) {
      let soma =0;
      weaponDimension.group().all().forEach(function(item){soma=soma+item.value})
      chart.group(weaponDimension.group())
       .label(function(d) { return (Math.round(d.value /soma * 100)).toFixed(2)+"%" })
    })
}


function weekDay(facts) {
  dayDimension = facts.dimension(d => d.day);
  dayGroup = dayDimension.group();

  barChart = dc.barChart('#weekday');

  barChart
    .dimension(dayDimension)
    .group(dayGroup)
    .height(200)
    .gap(10)
    .x(d3.scaleBand().domain(Object.values(weekDays)))
    .xUnits(dc.units.ordinal)
    .yAxis()
      .tickFormat(d3.format('d'))
      .ticks(6);

}

async function main() {
  let facts = await d3
    .csv('data/CVLI_2020_MAPS_feminicides.csv')
    .then(function(data){
      let parseDate = d3.utcParse("%d/%m/%Y");

      data.forEach(function(item){
        item.dtg = parseDate(item.DATA);
        item.day = weekDays[item.dtg.getDay()];

        item.IDADE = parseInt(item.IDADE);
      });
      return data;
    })
    .then(data => crossfilter(data));

    citiesChart(facts);
    weaponKind(facts);
    weekDay(facts);

    dc.renderAll();
}
