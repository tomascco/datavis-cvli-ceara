function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(main);
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

function lineplot(facts) {
  let SeriesDim = facts.dimension(d => d3.timeMonth(d.dtg));
  let dateDim = facts.dimension(d=>d.DATA)
  let monthScale = d3.scaleTime().domain([ dateDim.bottom(1)[0].dtg,dateDim.top(1)[0].dtg]);
  let SexDim=(facts.dimension(d=>d.SEXO))
  let SexGroup = SexDim.group()
  let sexScale = d3.scaleOrdinal().domain(["Masculino","Feminino"]);
  let lineChart = dc.lineChart(document.querySelector('#vitimas_mes'));
  
  lineChart
    .width(700)
    .height(300)
    .dimension(SeriesDim)
    .group(SeriesDim.group())
    .margins({top: 10, right: 10, bottom: 40, left: 30})
    .x(monthScale)
    lineChart.xAxisLabel("Data (dia)")
    lineChart.yAxisLabel("Número de CVLI")

};
async function main() {
  let total_age =[];
  let h_age =[];
  let w_age =[];
  let dataset = await d3
    .csv('data/CVLI_2020_MAPS.csv')
    .then(function(data){
      let parseDate = d3.utcParse("%d/%m/%Y");

      data.forEach(function(item){
        item.dtg = parseDate(item.DATA);
        total_age.push(+item.IDADE);
        
        if(item.SEXO=='Masculino'){
          h_age.push(+item.IDADE);
        }
        if(item.SEXO=='Feminino'){
          w_age.push(+item.IDADE);
        
        };
      });
    
      return [data,total_age,h_age,w_age];
    });

  let facts_1 = crossfilter(dataset[0]);
  let facts_2 = crossfilter(dataset[0].filter(function(d){if(d.SEXO=='Masculino'){return d}}));
  let facts_3 = crossfilter(dataset[0].filter(function(d){if(d.SEXO=='Feminino'){return d}}));

  vitimas_sexo_plot(facts_1);
  lineplot(facts_1) 
  let svg_1 = histogram(dataset[2],"#ca0020","#histogram_homem");
  let svg_2 = histogram(dataset[3],"#0571b0","#histogram_mulher");
  let svg_3 = histogram(dataset[1],"#0571b0","#ceara_hist");
  sex_barplot(dataset[0],facts_2,"#bar_homem","#ca0020");
  sex_barplot(dataset[0],facts_3,"#bar_mulher","#0571b0");
  dc.renderAll();
}
