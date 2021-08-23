function ready(fn) {
    if (document.readyState != 'loading'){
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  let mapLayerGroups_ceara =[]
  let map_ceara;
  let dataset_ceara;
  let crime_scale_ceara;

  async function showLayer(municipios){
    for(let i=0;i<municipios.length;i++){  
      var lg = mapLayerGroups_ceara[municipios[i]];
      if(!(typeof lg === 'undefined')){
      map_ceara.addLayer(lg);
      } 
     }   
  }
  
  async function hideLayer(municipios){
    for(let i=0;i<municipios.length;i++){  
      var lg = mapLayerGroups_ceara[municipios[i]];
      if(!(typeof lg === 'undefined')){
      map_ceara.removeLayer(lg);
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
    var municipios_selected = []
    var municipios_removed = []
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
    for(let i=0;i<municipios.length;i++){  
        var lg = mapLayerGroups_ceara[municipios[i]];
        if(!(typeof lg === 'undefined')){
            map.addLayer(lg);
          } 
    }   
}
async function hideLayer(municipios){
    for(let i=0;i<municipios.length;i++){  
      var lg = mapLayerGroups_ceara[municipios[i]];
      if(!(typeof lg === 'undefined')){
      console.log(lg)
      }  
  }
}

