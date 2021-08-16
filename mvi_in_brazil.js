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
    let locationNames = facts.all()
      .map(item => item.location);

    let barChart = dc.barChart(document.querySelector('#cvli-in-brazil'));

    barChart
      .height(300)
      .dimension(locationDimension)
      .x(d3.scaleOrdinal().domain(locationNames))
      .xUnits(dc.units.ordinal)
      .renderHorizontalGridLines(true)
      .group(homicidesByLocation)
  })(facts);

  dc.renderAll();
}
