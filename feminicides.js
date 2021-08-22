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
    .x(d3.scaleOrdinal().domain(citiesGroup.top(Infinity).map(d => d.key)))
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
    .x(d3.scaleOrdinal().domain(Object.values(weekDays)))
    .xUnits(dc.units.ordinal)
    .yAxis()
      .tickFormat(d3.format('d'))
      .ticks(6);

}

function histogram(data,color,select_name){
  let height = 500;
  let width=800;
  let margin = ({top: 20, right:50, bottom: 100, left: 100})
  let bins = d3.bin().thresholds(20)(data)
  let x = d3.scaleLinear()
    .domain([bins[0].x0, bins[bins.length - 1].x1])
    .range([margin.left, width - margin.right])
  let y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)]).nice()
    .range([height - margin.bottom, margin.top])
  const svg = d3.select(select_name).append("svg")
      .attr("viewBox", [0, 0, width, height]);

  svg.append("g")
      .attr("fill", color)
      .selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", d => x(d.x0) + 1)
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => y(d.length))
      .attr("height", d => y(0) - y(d.length));

  let xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80 ).tickSizeOuter(0))
    .call(g => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", -4)
        .attr("fill", "currentColor")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(data.x))

  let yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data.y))

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width/2)
    .attr("y", height-30)
    .text("Idades (Anos)");

  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 0)
    .attr("x", -200)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Count");

  return svg.node();
}

vitimas_sexo_plot = function(facts) {
  let SeriesDim = facts.dimension(d => [d.SEXO, d3.timeMonth(d.dtg)]);
  let colorScale = d3
    .scaleOrdinal()
    .domain(["Masculino","Feminino"])
    .range(["#ca0020", "#0571b0"]);

  let dateDim = facts.dimension(d=>d.DATA)
  let monthScale = d3.scaleTime().domain([ dateDim.bottom(1)[0].dtg,dateDim.top(1)[0].dtg]);
  let SexDim=(facts.dimension(d=>d.SEXO))
  let SexGroup = SexDim.group()
  let sexScale = d3.scaleOrdinal().domain(["Masculino","Feminino"]);
  let lineChart = dc.seriesChart(document.querySelector('#vitimas-sexo'));

  lineChart
    .width(800)
    .height(300)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right: 10, bottom: 30, left: 30})
    .chart(c => dc.lineChart(c))
    .seriesAccessor(d => d.key[0])
    .keyAccessor(d => d.key[1])
    .colors(colorScale)
    .colorAccessor(d => d.key[0])
    .valueAccessor(d => d.value)
    .x(monthScale)
    .legend(dc.legend().x(700-200).y(5).itemHeight(13).gap(5))
    lineChart.xAxisLabel("Data (dia)")
    lineChart.yAxisLabel("Número de CVLI")

};

function sex_barplot(data,facts,sexo_id,color){
  let MunDim=facts.dimension(d=>d.MUNICIPIO)
  let BarChart = dc.barChart(document.querySelector(sexo_id));
  let mun_map = new Map()
  MunDim.group().all().forEach(function(d){mun_map.set(d.key,d.value)})
  let mapSort1 = new Map([...mun_map.entries()].sort((a, b) => b[1] - a[1]))
  let cidades = Array.from( mapSort1.keys() ).slice(0,5)
  let new_dataset = data.filter(function(d){if(cidades.indexOf(d.MUNICIPIO) > -1){return d}})
  let new_facts=crossfilter(new_dataset)
  let new_MunDim = new_facts.dimension(d=>d.MUNICIPIO)
  let new_MunGroup = new_MunDim.group()

  let xScale = d3.scaleOrdinal().domain(cidades)
  BarChart
    .width(500)
    .height(300)
    .margins({top: 10, right: 30, bottom: 40, left: 40})
    .dimension(new_MunDim)
    .group(new_MunGroup)
    .x(xScale)
    .gap(20)
    .colors(color)
    .xAxis().tickValues(cidades)
    BarChart.xUnits(dc.units.ordinal)
    BarChart.xAxisLabel("Municipio")
    BarChart.yAxisLabel("Número de CVLI")
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
