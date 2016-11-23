//Si el usuario no está autentificado no se devuelve la información de usuario
cancelUnless(me, "No ha iniciado sesión", 401);

//Solo se devuelve la información del usuario actual
if (me.glucontrole != this.glucontrole){
    cancel();
}
//Propiedades añadidas
else{
    //Texto con la cantidad de producto
    /*this.quantityText=formatQuantity(this.quantity,this.unit);
    //Propiedad para saber si el producto va a caducar/esta caducado
    this.dateAlert=dateDiffInDays(this.dateOfExpiry)<=2?true:false;
    //Obtenemos la información nutricional
    this.nutrInfo=getNutriInfo(this);
    //Obtenemos los alérgenos
    this.allergies=getAllergies(this);
    //Calculamos si hay algún alérgeno
    this.showAller=this.allergies.length>0 ? true : false;
    //Calculamos el texto de la localizacion de la antena
    this.antennaLoc=getAntennaLoc(this.antenna);*/
}

//Funciones

//Funcion para formatear la cantidad de producto
function formatQuantity(quantity, unit){
	switch(unit){
		case "g":
            return (quantity < 1000) ?
				quantity+" "+unit : (quantity/1000).toFixed(2)+" kg";
		case "G":
            return (quantity < 1000) ?
				quantity+" g" : (quantity/1000).toFixed(2)+" kg";
		case "ml":
			return (quantity<1000) ?
				quantity+" "+unit : (quantity/1000).toFixed(2)+" l";
		case "ML":
			return (quantity<1000) ?
				quantity+" ml" : (quantity/1000).toFixed(2)+" l";
		default :
				return quantity+" "+unit;
	}
}



//Funcion para calcular cuantos días quedan para llegar a la fecha actual
function dateDiffInDays(espDate) {
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  var date = new Date(convertToEngDate(espDate));
  var now = new Date();
  var utc1 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  var utc2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((utc1 - utc2) / _MS_PER_DAY);
}

//Funcion para convertir una fecha con el formato dd/mm/yyyy a mm/dd/yyy
function convertToEngDate(espDate){
  espDate = espDate || '';
	var day = espDate.substring(0, 2);
	var month = espDate.substring(3, 5);
	var year = espDate.substring(6, 10);
	return (month + "/" + day + "/" + year);
}

//Funcion que recibe una producto y devuelve un array con sus alergias preparadas para ser mostradas
function getAllergies(product){
  //Alergias del producto
  var prodAll=[];
  //Traducción de alergias
  var allergies={
  "cGluten":"Gluten",
  "cMilk":"Lácteos",
  "cSoy":"Soja",
  "cEgg":"Huevo",
  "cPeanuts":"Cacahuetes",
  "cNut":"Frutos con cáscara",
  "cFish":"Pescado",
  "cShellFish":"Marisco",
  "cCelery":"Apio",
  "cSesame":"Sesamo",
  "cMustard":"Mostaza"
  };

  //Se recorren todas las alergias
  for (var allergy in allergies){
    //Para cada alergia positiva se añade al array de alergias
    product[allergy] ? prodAll.push(allergies[allergy]) : '';
  }
  return prodAll;
}

//Funcion que recibe una producto y devuelve un array con su información nutricional
function getNutriInfo(product){
  return [product.energy+" kcals","Proteinas: "+product.protein+" g","Hidratos: "+product.carbo+" g",
  "Grasas: "+product.fat+" g"];
}

//Funcion que recibe una antena y devuelve el texto de donde está situada
function getAntennaLoc(antenna){
    var texto="";
    switch(antenna) {
        case "01":
            texto="Frigorífico";
        break;
        case "02":
            texto="Despensa";
        break;
        case "03":
            texto="Despensa 2";
        break;
    }
    return texto;
}