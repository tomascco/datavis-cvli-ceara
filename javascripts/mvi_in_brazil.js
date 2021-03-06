function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(main);

async function main() {
  let dataset = await d3
    .csv('data/mvi_brazil.csv')
    .then(data => {
      data.forEach(item => {
        item.homicidesRatio = parseFloat(item.homicidesRatio);
      });
      return data;
    });

  facts = crossfilter(dataset);

  (function(facts) {
    let locationDimension = facts.dimension(item => item.location);
    let homicidesByLocation = locationDimension.group().reduceSum(item => item.homicidesRatio);
    let mapValues = new Map()
    facts.all().forEach(function(item){
      mapValues.set(item.location,item.homicidesRatio)
    })
    let locationMap = new Map([...mapValues.entries()].sort((a, b) => b[1] - a[1]))
    let estados = Array.from( locationMap.keys())
    let barChart = dc.barChart('#cvli-in-brazil');

    barChart
      .height(300)
      .margins({top: 10, right: 30, bottom: 40, left: 40})
      .dimension(locationDimension)
      .group(homicidesByLocation)
      .x(d3.scaleBand().domain(estados))
      .gap(10)
      .colorCalculator(d => (d.key === 'Brasil' || d.key === 'CE') ? '#e6550d' : '#3182bd')
      .xAxis().tickValues(estados);

    barChart.xUnits(dc.units.ordinal);
    barChart.xAxisLabel("Localidade");
    barChart.yAxisLabel("Taxa");
    })(facts);

  dc.renderAll();
}
