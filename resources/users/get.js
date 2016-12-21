//Si el usuario no está autentificado no se devuelve la información de usuario
cancelUnless(me, "No ha iniciado sesión", 401);

//Solo se devuelve la información del usuario actual
if (me.username != this.username){
  cancel();
}
//Propiedades añadidas
else{
  //Valores máximo, mínimo y media
  if(this.glucoseLevels.length){
    this.glucoseValues=getGlucoseValues(this.glucoseLevels);
  }
  else{
   this.glucoseValues=[0, 0, 0]; 
  }
  //Entrenamientos agrupados por fecha y por fecha inversa
  if(this.exercise.length){
    this.groupedExercise=groupExerciseByDate(this.exercise);
    this.groupedExerciseReverse=reverseOrder(this.groupedExercise);
  }
  //Alimentación agrupada por fecha y por fecha inversa
  if(this.meals.length){
    this.groupedMeals=groupMealsByDate(this.meals);
    this.groupedMealsReverse=reverseOrder(this.groupedMeals);
  }
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

//Función que agrupa los entrenamientos por día
function groupExerciseByDate(exerciseData) {
  var groups = {};

  for (var i = 0; i < exerciseData.length; i++){
    var date = new Date(exerciseData[i].startTime);
    var fecha = new Date(date.getMonth()+1+"/"+date.getDate()+"/"+date.getFullYear());
    groups[fecha.getTime()] || (groups[fecha.getTime()] = []);
    groups[fecha.getTime()].push(exerciseData[i]);
  }
  return groups;
};

//Función que agrupa los entrenamientos por día
function groupMealsByDate(mealData) {
  var groups = {};

  for (var i = 0; i < mealData.length; i++){
    var date = new Date(mealData[i].date);
    var fecha = new Date(date.getMonth()+1+"/"+date.getDate()+"/"+date.getFullYear());
    groups[fecha.getTime()] || (groups[fecha.getTime()] = []);
    groups[fecha.getTime()].push(mealData[i]);
  }
  return groups;
};

//Función que invierte el orden de las fechas
function reverseOrder(exerciseData) {
  var groups = {};
  var sorted_keys = Object.keys(exerciseData).sort();
  var reversed_keys = sorted_keys.reverse();

  reversed_keys.forEach(function(value){
    groups[value] = exerciseData[value];
  });

  return groups;
};