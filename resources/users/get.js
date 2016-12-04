//Si el usuario no está autentificado no se devuelve la información de usuario
cancelUnless(me, "No ha iniciado sesión", 401);

//Solo se devuelve la información del usuario actual
if (me.username != this.username){
    cancel();
}
//Propiedades añadidas
else{
    //Valores máximo, mínimo y media
    this.glucoseValues=getGlucoseValues(this.glucoseLevels);
    //Suma de calorías consumidas
    this.totalCalories=getTotalCalories(this.exercise);
}

//Funciones

//Funcion que recibe el histórico de glucosa y devuelve un array con el valor mínimo, máximo y medio
function getGlucoseValues(gLevels){
  var values = [];
  gLevels.forEach(function(value){
    values.push(value.gLevel);
  });

  //Se calcula la suma y la media de los valores de glucosa
  var sum = values.reduce(function(a, b) { return a + b; });
  var avg = sum / values.length;

  //Se devuelve el valor máximo, el mínimo y la media
  return [Math.max.apply(null, values), Math.min.apply(null, values), avg.toFixed(2)];
}

//Funcion que recibe el histórico de ejercicio y devuelve la suma de las calorías consumidas
function getTotalCalories(cal){
  var values = [];
  cal.forEach(function(value){
    values.push(value.calories);
  });

  //Se calcula la suma de las calorías consumidas
  var sum = values.reduce(function(a, b) { return a + b; });

  //Se devuelve la suma
  return sum;
}