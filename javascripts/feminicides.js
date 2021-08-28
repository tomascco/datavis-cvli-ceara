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
  let citiesGroup = citiesDimension.group().reduceSum(d => 100000/pop_mun.get(d.MUNICIPIO));

  let barChart = dc.barChart('#feminicides-by-city')
  barChart
    .dimension(citiesDimension)
    .group(citiesGroup)
    .x(d3.scaleBand().domain(citiesGroup.top(Infinity).map(d => d.key)))
    .gap(20)
    .xUnits(dc.units.ordinal)
    .height(400);

    barChart.xAxisLabel("Localidade");
    barChart.yAxisLabel("Taxa");

}

function weaponKind(facts) {
  weaponDimension = facts.dimension(d => d['ARMA-UTILZADA']);
  weaponGroup = weaponDimension.group();

  pieChart = dc.pieChart('#weapon-kind');

  pieChart
    .dimension(weaponDimension)
    .group(weaponGroup)
    .height(200)
    .ordinalColors(['#f8be34','#53A051','#006D9C'])
    .legend(dc.legend().highlightSelected(true));
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
