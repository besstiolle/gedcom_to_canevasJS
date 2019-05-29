var boxes = new Map()
var personsMap = new Map();
var maxCurrentGeneration = null;
var maxCurrentSosa = null;
const MAX_GEN = 10;

var start = Date.now();

function init(){
  document.getElementsByTagName("input")[0].addEventListener('change', run);
}

function run() {
  startTimer()

  readFile()

  /*

    //Calculate max gen of our tree
    calculateMaxCurrentSosa()

    //Populate virtual box
    processPerson(1) //Start with sosa 1

    // Draw boxes & links & other things
    draw()*/

}
function startTimer(){
  console.info("restart 0ms")
  start = Date.now();
}
function timer(message){
  console.log(message + " ms elapsed = " + (Date.now()-start) + "ms");
}
function readFile() {
    var input = document.getElementsByTagName("input")[0];
    var output = document.getElementsByTagName("textarea")[0];

    /*if (input.files.length === 0) {
        output.value = 'No file selected';
        window.setTimeout(readFile, 1000);
        return;
    }*/

    startTimer()
    readFileAsArrayBuffer(input.files[0], function(data) {
        var array = new Int8Array(data);
        var line = ""
        var indi = null // One Individu
        var indis = new Map() //All Individus
        var fam = null //One Familly
        var fams = new Map() //All famillies
        timer("start parsing gedcom")

        for (var i = 0; len = array.length, i < array.length; i++) {
            let char = array[i]
            if(char == 10 || char == 13) { //Return line
              //process previous line
              if(line.startsWith('0 @I')){
                //Save previous indiv
                if(indi != null){
                  indis.set(indi['id'], indi)
                }
                // Initiate array
                let matches = line.match("^0 @I([0-9]*)@ INDI$");
                indi = []
                indi['id'] = matches[1]
              }

              if(line.startsWith("1 NAME ")){
                  if(indi != null) {
                    var matches = line.match('^1 NAME (.*)\/(.*)\/$');
                    indi['firstname'] = matches[1].replace(/"/g,'')
                    indi['lastname'] = matches[2]
                  }
              }

              if(line.startsWith("1 FAMC @F")){
                if(indi != null) {
                  var matches = line.match('^1 FAMC @F([0-9]+)@$');
                  indi['famc'] = matches[1]
                }
              }

              if(line.startsWith("1 SEX ")){
                if(indi != null) {
                  var matches = line.match('^1 SEX ([FM])$');
                  indi['sex'] = matches[1]
                }
              }

              if(line.startsWith("0 @F") & line.endsWith("@ FAM")){
                //Save previous family
                if(fam != null){

                  fams.set(fam['id'], fam)
                }
                // Initiate array
                let matches = line.match("^0 @F([0-9]*)@ FAM$");
                fam = []
                fam['id'] = matches[1]
              }

              if(line.startsWith("1 HUSB @I")){
                if(indi != null) {
                  var matches = line.match('^1 HUSB @I([0-9]*)@$');
                  fam['father'] = matches[1]
                }
              }

              if(line.startsWith("1 WIFE @I")){
                if(indi != null) {
                  var matches = line.match('^1 WIFE @I([0-9]*)@$');
                  fam['mother'] = matches[1]
                }
              }

              //Start next line
              line = ''
              continue
            }

            line += String.fromCharCode(char)
        }
        timer("start of exploit")
        console.info(indis)
        //console.info(fams)
        exploit(1, "1", indis, fams)
        console.info(personsMap)
        timer("end of exploit")

        timer("start calculateMaxCurrentSosa")
        calculateMaxCurrentSosa()
        timer("end calculateMaxCurrentSosa")

        //Populate virtual box
        timer("start processPerson")
        processPerson(1) //Start with sosa 1
        timer("end processPerson")


        // Draw boxes & links & other things
        timer("start draw")
        draw()
        timer("end draw")
        console.info(boxes)

        console.info("end")

    }, function (e) {
        console.error(e);
    });
    timer("end")
}

function exploit(sosa, position, indis, fams){
  if(indis.has(position)){
    //Limitation
    if(getGeneration(sosa) > MAX_GEN){
      return
    }
    personsMap.set(sosa,{'sosa':sosa,'name':indis.get(""+position)['firstname'], 'surname':indis.get(""+position)['lastname']})

    //Process his father and mothers
    let familyId = indis.get(""+position)['famc']
    if(fams.has(familyId)) {
      let family = fams.get(familyId)
      let sosaFather = getFatherOfSosa(sosa)
      let sosaMother = getMotherOfSosa(sosa)
      if(family['father'] != null && family['father'] != undefined) {
      //  console.info("start process father" + sosaFather)
        exploit(sosaFather, family['father'], indis, fams)
      }else {
        //console.info("mother is undefined")
      }
      if(family['mother'] != null && family['mother'] != undefined) {
        //console.info("start process mother" + sosaMother)
        exploit(sosaMother, family['mother'], indis, fams)
      } else {
          //console.info("mother is undefined")
      }
    } else {
      //console.info("family is undefined")
    }
  } else {
    console.info("individu #" + position + " is undefined")
  }
}

function readFileAsArrayBuffer(file, success, error) {
    var fr = new FileReader();
    fr.addEventListener('error', error, false);
    if (fr.readAsBinaryString) {
        fr.addEventListener('load', function () {
            var string = this.resultString != null ? this.resultString : this.result;
            var result = new Uint8Array(string.length);
            for (var i = 0; i < string.length; i++) {
                result[i] = string.charCodeAt(i);
            }
            success(result.buffer);
        }, false);
        return fr.readAsBinaryString(file);
    } else {
        fr.addEventListener('load', function () {
            success(this.result);
        }, false);
        return fr.readAsArrayBuffer(file);
    }
}

function calculateMaxCurrentSosa(){
  maxCurrentSosa = 1
  for(var value of personsMap){
      if(value[0] > maxCurrentSosa){
        maxCurrentSosa = value[0]
      }
  }
  maxCurrentGeneration = getGeneration(maxCurrentSosa)
  if(maxCurrentGeneration > MAX_GEN){
    maxCurrentGeneration = MAX_GEN
  }
}

function draw(){
  var canvas = document.getElementById('graph');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    //ctx.strokeRect(2348, 134, 2, 2)
    //return
    for(var value of boxes){
      let sosa = value[0]
      let box = value[1]

      if(sosa==1){
        console.info("me")
      }

      // Dessin de la box
      ctx.strokeRect(box.getX(), box.getY(), Box.width(), Box.height())
      ctx.fillText('#'+sosa,box.getX() + Box.width() / 3, box.getY() + Box.height() / 1.5 );

      //Si père existe : liaison
      if(boxes.has(getFatherOfSosa(sosa))){
        let father = boxes.get(getFatherOfSosa(sosa))
        let middleY = (father.getBottomJunctionPoint().y + box.getTopJunctionPoint().y) / 2
        ctx.beginPath();
        ctx.moveTo(box.getTopJunctionPoint().x, box.getTopJunctionPoint().y)
        ctx.lineTo(box.getBottomJunctionPoint().x, middleY);
        ctx.lineTo(father.getBottomJunctionPoint().x, middleY);
        ctx.lineTo(father.getBottomJunctionPoint().x, father.getBottomJunctionPoint().y);
        ctx.stroke();
      }
      //Si mère existe : liaison
      if(boxes.has(getMotherOfSosa(sosa))){
        let mother = boxes.get(getMotherOfSosa(sosa))
        let middleY = (mother.getBottomJunctionPoint().y + box.getTopJunctionPoint().y) / 2
        ctx.beginPath();
        ctx.moveTo(box.getTopJunctionPoint().x, box.getTopJunctionPoint().y)
        ctx.lineTo(box.getBottomJunctionPoint().x, middleY);
        ctx.lineTo(mother.getBottomJunctionPoint().x, middleY);
        ctx.lineTo(mother.getBottomJunctionPoint().x, mother.getBottomJunctionPoint().y);
        ctx.stroke();
      }
    }
  }
}

function processPerson(sosa){
    let box = null
    if(personsMap.has(sosa)) {
      let father = processPerson(getFatherOfSosa(sosa))
      let mother = processPerson(getMotherOfSosa(sosa))

      let xCenter = null
      if(father != null && mother != null){
        xCenter = Math.floor((father.getBottomJunctionPoint().x + mother.getBottomJunctionPoint().x) / 2)
      } else if(father != null){
        xCenter = father.getBottomJunctionPoint().x
      } else if(mother != null){
        xCenter = mother.getBottomJunctionPoint().x
      }

      box=new Box(sosa, xCenter, maxCurrentGeneration);
      boxes.set(sosa, box)
  }
  return box

}


class Box{
  x; //x position in canvas
  y; //y position in canvas
  sosa; //sosa value

  constructor(sosa, xCenter, maxGen){
    let gen = getGeneration(sosa)
    let minSosa = getMinSosaOfGeneration(gen)
    let diffSosa = sosa - minSosa
    let diffGen = maxGen - gen

    //Calcul x value
    if(xCenter == null){
      this.x = diffSosa * (Box.width() + Box.widthPadding()) + Box.leftMargin()
    } else {
      this.x = xCenter - Box.width() / 2
    }
    //Calcul y value
    this.y = diffGen * (Box.height() + Box.heightPadding()) + Box.leftMargin()

    this.sosa=sosa
  }

  getX = function(){
    return this.x;
  }

  getY = function(){
    return this.y;
  }

  getBottomJunctionPoint = function(){
    return {"x" : this.x + Box.width() / 2 , "y" : this.y + Box.height()};
  }
  getTopJunctionPoint = function(){
    return {"x" : this.x + Box.width() / 2 , "y" : this.y };
  }

  static leftMargin(){return 20} // left margin
  static widthPadding(){return 5} // horizontal padding between box
  static heightPadding(){return 10} // vertical padding between box
  static width(){return 40;} //width of box in px
  static height(){return 30;} //height of box in px
}

/**
* Return n° of generation based on sosa
* tkt to Rolland (https://www.lorand.org/spip.php?article1459)
**/
function getGeneration(sosa){
  return Math.floor(Math.log(sosa) / Math.LN2)+1
}

function getMinSosaOfGeneration(generation){
   return Math.pow(2,(generation - 1))
}

function getMaxSosaOfGeneration(generation){
  return Math.pow(2,generation)-1
}

function getFatherOfSosa(sosa){
  return sosa * 2
}

function getMotherOfSosa(sosa){
  return sosa * 2 + 1
}