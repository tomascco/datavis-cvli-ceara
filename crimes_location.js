function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(main);

vitimas_sexo_plot = function(facts) {
  let SeriesDim = facts.dimension(d => [d.SEXO, d3.timeMonth(d.dtg)]);
  let colorScale = d3
    .scaleOrdinal()
    .domain(["Masculino","Feminino"])
    .range(["#ca0020", "#0571b0"]);

  let dateDim = facts.dimension(d=>d.DATA)
  let monthScale = d3.scaleTime().domain([ dateDim.bottom(1)[0].dtg,dateDim.top(1)[0].dtg]);

  let lineChart = dc.seriesChart(document.querySelector('#vitimas-sexo'));

  lineChart
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right: 10, bottom: 20, left: 40})
    .chart(c => dc.lineChart(c))
    .seriesAccessor(d => d.key[0])
    .keyAccessor(d => d.key[1])
    .colors(colorScale)
    .colorAccessor(d => d.key[0])
    .valueAccessor(d => d.value)
    .x(monthScale);
};

async function main() {
  let dataset = await d3
    .csv('data/CVLI_2020_MAPS.csv')
    .then(function(data){
      let parseDate = d3.utcParse("%d/%m/%Y");

      data.forEach(function(item){
        item.dtg = parseDate(item.DATA)
      });
      return data;
    });

  let facts = crossfilter(dataset);

  vitimas_sexo_plot(facts);

  dc.renderAll();
}
