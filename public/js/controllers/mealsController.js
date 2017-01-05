//Controlador de recetas
glucontrole.controller('MealsController',['$scope', '$http', '$location', function($scope, $http, $location){
  $scope.user = [];
  $scope.ranking = [];
  $scope.foodList = [];
  $scope.mealFood = [];
  var sendMeal = [];
  $scope.entradas = [];
  $scope.wellness = 0;
  $scope.trapezGlucosa = [];
  $scope.trapezEjercicio = [];
  $scope.trapezCglucemica = [];

  //Variables para ranking
  var notifyType = "";
  var notifyIcon = "";
  var notifyMessage = "";
  var notifyTimeout = 0;
  var notifyType1 = "";
  var notifyIcon1 = "";
  var notifyMessage1 = "";
  var notifyWellness = "";
  var attrIndex = -1;
  var fechaString = "";

  //Se definen las opciones por defecto de las notificaciones
  $.notifyDefaults({
    newest_on_top: false,
    delay: 4000,
    mouse_over: "pause",
    animate: {
            enter: 'animated bounceIn',
            exit: 'animated fadeOut'
          }
  });

  $http.get('/users/me').success(function(data){
    $scope.user = data;

    //Se inician los campos del formulario
    $scope.limpiar();
  });

  $http.get('/ranking').success(function(data){
    $scope.ranking = data[0];
  });

  //Obtenemos el listado de alimentos
  $http
    .get('/food')
    .success(function(data){
      $scope.foodList = data;
    });

  //Función para añadir una nueva comida
  $scope.addMealData = function(){
    //Se modifica la hora por la indicada por el usuario
    var mealDate = changeDate($scope.fecha, $scope.hora);

    //Se actualiza la fecha del ranking
    var rankingDate = new Date (mealDate);
    rankingDate.setHours("00");
    rankingDate.setMinutes("00");
    rankingDate.setSeconds("00");
    rankingDate.setMilliseconds("00");

    attrIndex = findWithAttr($scope.user.ranking, "date", rankingDate.getTime());

    //Se comprueba si existe el día de la medida insertada en el ranking
    if(attrIndex == -1){
      //Si no existe el día, se añade un día nuevo al ranking del usuario
      var rankingData = {
        //Se mete la fecha en formato Unix
        "date": rankingDate.getTime(),
        "gCount": 0,
        "points": 0
      };
      $scope.user.ranking.push(rankingData);

      //Se añade en el nuevo día una medida más al contador
      attrIndex = $scope.user.ranking.length - 1;
    }

    //Propiedades de la comida
    var mealData = {
      //Se mete la fecha en formato Unix
      "date": mealDate.getTime(),
      "type": $scope.mealType,
      "food": $scope.mealFood
    };

    //Se calcula la media de la Carga Glucémica de toda la comida
    var mediaCG = $scope.getTotal(mealData.food)/mealData.food.length

    if(mediaCG <= 10){
      notifyType = "success";
      notifyIcon = "glyphicon glyphicon-star";
      notifyMessage = "¡Una comida muy saludable! ¡Has ganado 1 punto! ¡Sigue así!";
      $scope.user.ranking[attrIndex].points += 1;
    }
    else if(mediaCG > 10 && mediaCG <= 20){
      notifyType = "warning";
      notifyIcon = "glyphicon glyphicon-thumbs-up";
      notifyMessage = "¡No está mal! ¡Has ganado 0.5 puntos! Intenta ingerir alimentos con Carga Glucémica menor que 10...";
      $scope.user.ranking[attrIndex].points += 0.5;
    }
    else{
      notifyType = "danger";
      notifyIcon = "glyphicon glyphicon-thumbs-down";
      notifyMessage = "¡Una comida muy poco saludable! Pierdes 1 punto...";
      $scope.user.ranking[attrIndex].points -= 1;
    }

    var newRanking = $scope.user.ranking;

    //Se añade la última comida
    if($scope.user.meals == ""){
      sendMeal.push(mealData);
    }
    else{
      sendMeal = $scope.user.meals;
      sendMeal.push(mealData);
    }

    //Se crea la nueva comida
    $http.post('/users/'+$scope.user.id, {meals: sendMeal})
      .success(function(correct){
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
          //Se limpian los campos del formulario
          $scope.limpiar();
          $scope.mealFood = [];

          $.notify({
            icon: notifyIcon,
            message: notifyMessage
          },{
            type: notifyType,
          });

          $scope.addRankingData(newRanking);

          $scope.wellness = getWellness();

          notifyWellness = getWellnessMessage($scope.entradas[0], $scope.entradas[1], $scope.entradas[2]);

          setTimeout(function() {
            $.notify({
              icon: "glyphicon glyphicon-dashboard",
              message: notifyWellness
            },{
              type: "info",
            });
          }, 4000);

          //Se vuelve a cargar la lista de comidas
          $location.path('/meals');
        });
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido añadir la medida'); 
    });
  };

  //Función para añadir una nueva comida
  $scope.addMealFood = function(food, multFactor, serving){
    //Propiedades del alimento ingerido
    var mealInfo = {
      "type": food.type,
      "name": food.name,
      //"serving": servingName;
      "amount": multFactor.toFixed(1),
      "gCarbs": serving.toFixed(2)*multFactor.toFixed(1),
      "gIndex": parseInt(food.gIndex),
      "gLoad": serving.toFixed(2)*multFactor.toFixed(1)*parseInt(food.gIndex)/100
    };

    $scope.mealFood.push(mealInfo);
  };

  //Función para añadir información de ranking del usuario
  $scope.addRankingData = function(newRanking){
    $http.post('/users/'+$scope.user.id, {ranking: newRanking})
      .success(function(correct){
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;

          //Se actualiza la clasificación total
          updateRanking();

          //Se actualizan las medallas
          mealMedals();
        });
      })

      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido añadir la puntuación'); 
    });
  };

  //Función para limpiar los campos del formulario
  $scope.limpiar = function(){
    var today = new Date();
    var mes = today.getMonth() + 1;
    var horaFormateada = parseInt(today.getMinutes())<10 ? "0"+today.getMinutes() : today.getMinutes();

    $scope.fecha = today.getDate()+"/"+mes+"/"+today.getFullYear();
    $scope.hora = today.getHours()+":"+horaFormateada;

    $scope.multFactor = "1";
    $scope.servingCarbs = "food.serving[0].gCarbs";
    $scope.mealType = "";
    $scope.inputSuccess = "";
  };

  //Función para cambiar la fecha actual por la de la comida introducida
  function changeDate(dia, hora){
    var changedTime = new Date();

    var trozosHora = hora.split(":");
    var trozosFecha = dia.split("/");

    var mes = parseInt(trozosFecha[1]) - 1;

    changedTime.setDate(trozosFecha[0]);
    changedTime.setMonth(mes);
    changedTime.setFullYear(trozosFecha[2]);
    changedTime.setHours(trozosHora[0]);
    changedTime.setMinutes(trozosHora[1]);
    changedTime.setSeconds("00");

    return changedTime;
  }

  //Función para eliminar una comida del histórico
  $scope.deleteMealData = function(meal){
    //Se busca el índice de la comida a eliminar y se elimina
    var index = -1;

    for (var i = 0; i < $scope.user.meals.length; i++) {
      if(angular.equals($scope.user.meals[i], meal)) {
            index = i;
        }
    }

    if (index > -1) {
      $scope.user.meals.splice(index, 1);
    }

    //Se actualiza la fecha del ranking
    var rankingDate = new Date(meal.date);
    rankingDate.setHours("00");
    rankingDate.setMinutes("00");
    rankingDate.setSeconds("00");
    rankingDate.setMilliseconds("00");
    fechaString = rankingDate.getDate()+"/"+(rankingDate.getMonth()+1)+"/"+rankingDate.getFullYear();

    attrIndex = findWithAttr($scope.user.ranking, "date", rankingDate.getTime());

    //Se calcula la media de la Carga Glucémica de toda la comida
    var mediaCG = $scope.getTotal(meal.food)/meal.food.length

    notifyType = "danger";
    notifyIcon = "glyphicon glyphicon-exclamation-sign";

    if(mediaCG <= 10){
      notifyMessage = "Has eliminado una comida saludable. Pierdes 1 punto del día "+fechaString+"...";
      $scope.user.ranking[attrIndex].points -= 1;
    }
    else if(mediaCG > 10 && mediaCG <= 20){
      notifyMessage = "Has eliminado una comida normal. Pierdes 0.5 puntos del día "+fechaString+"...";
      $scope.user.ranking[attrIndex].points -= 0.5;
    }
    else{
      notifyMessage = "Has eliminado una comida poco saludable. Recuperas 1 punto del día "+fechaString+"...";
      $scope.user.ranking[attrIndex].points += 1;
    }

    var newRanking = $scope.user.ranking;

    //Se actualiza el histórico de comidas
    $http.post('/users/'+$scope.user.id, {meals: $scope.user.meals})
      .success(function(correct){
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
          $.notify({
            icon: notifyIcon,
            message: notifyMessage
          },{
            type: notifyType,
          });

          $scope.deleteRankingData(newRanking);

          $scope.wellness = getWellness();

          notifyWellness = getWellnessMessage($scope.entradas[0], $scope.entradas[1], $scope.entradas[2]);

          setTimeout(function() {
            $.notify({
              icon: "glyphicon glyphicon-dashboard",
              message: notifyWellness
            },{
              type: "info",
            });
          }, 4000);

          //Se vuelve a cargar la lista de comidas
          $location.path('/meals');
        });
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido eliminar la comida'); 
    });
  };

  //Función para eliminar un alimento de una comida del histórico
  $scope.deleteFoodData = function(meal, serving){
    //Se busca el índice del alimento a eliminar y se elimina
    var indexMeal = -1;
    var indexServing = -1;

    for (var i = 0; i < $scope.user.meals.length; i++) {
      if(angular.equals($scope.user.meals[i], meal)) {
            indexMeal = i;
        }
    }

    if (indexMeal > -1) {
      //Si se encuentra la comida, se busca el alimento a eliminar
      for (var i = 0; i < $scope.user.meals[indexMeal].food.length; i++) {
        if(angular.equals($scope.user.meals[indexMeal].food[i], serving)) {
              indexServing = i;
          }
      }
      $scope.user.meals[indexMeal].food.splice(indexServing, 1);

      //Si se eliminan todos los alimentos de una comida, se elimina también la comida
      if($scope.user.meals[indexMeal].food.length == 0){
        $scope.user.meals.splice(indexMeal, 1);        
      }
    }

    //Se actualiza el histórico de comidas
    $http.post('/users/'+$scope.user.id, {meals: $scope.user.meals})
      .success(function(correct){
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
          
          //Se vuelve a cargar la lista de comidas
          $location.path('/meals');
        });
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido eliminar la comida'); 
    });
  };

  //Función para eliminar un alimento de una nueva comida
  $scope.deleteMealFood = function(alimento){
    //Se busca el índice de la medida a eliminar y se elimina
    var index = $scope.mealFood.indexOf(alimento);
    if (index > -1) {
      $scope.mealFood.splice(index, 1);
    }
  };

  //Función para quitar puntos del ranking y actualizar los datos en la tabla
  $scope.deleteRankingData = function(newRanking){
    $http.post('/users/'+$scope.user.id, {ranking: newRanking})
    .success(function(correct){
      //Se vuelve a descargar la información del usuario
      $http.get('/users/me').success(function(data){
        $scope.user=data;

        //Se actualiza la clasificación total
        updateRanking();

        //Se actualizan las medallas
        mealMedals();
      });
    })

    //Mensaje de error
    .error(function(err){
      alert(err.message || 'No se ha podido añadir la puntuación'); 
    });
  };

  //Función para actualizar el ranking de un usuario en la tabla de rankings
  function updateRanking(){
    var rankingUpdate = {
      "userid": $scope.user.id,
      "username": $scope.user.username,
      "name": $scope.user.firstName+" "+$scope.user.secondName,
      "points": getTotalPoints($scope.user.ranking)
    };

    var rankingIndex = findWithAttr($scope.ranking.rankings, "userid", $scope.user.id);

    $scope.ranking.rankings[rankingIndex] = rankingUpdate;

    $http.post('/ranking/'+$scope.ranking.id, {rankings: $scope.ranking.rankings})
      .success(function(correct){
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
        });
      })

      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido actualizar el ranking'); 
    });
  }

  //Función que devuelve el índice en un array de un objeto por un atributo concreto.
  function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] == value) {
          return i;
        }
    }
    return -1;
  }

  //Funcion que recibe el histórico de alimentación y devuelve la suma de la CG consumida
  $scope.getTotal = function(food){
    var values = [];
    food.forEach(function(value){
      values.push(value.gLoad);
    });

    //Se calcula la suma de las calorías consumidas
    var sum = values.reduce(function(a, b) { return a + b; });

    //Se devuelve la suma
    return sum.toFixed(2);
  }

  //Funcion que recibe el histórico ranking y devuelve la suma de los puntos del usuario
  function getTotalPoints(ranking){
    var values = [];
    ranking.forEach(function(value){
      values.push(value.points);
    });

    //Se calcula la suma de las calorías consumidas
    var sum = values.reduce(function(a, b) { return a + b; });

    //Se devuelve la suma
    return sum;
  }

  //Funcion que recibe el histórico de alimentación y devuelve la suma de la CG consumida
  $scope.getTotalMeal = function(food){
    var values = [];
    food.forEach(function(value){
      values.push(value.gLoad);
    });

    //Se calcula la suma de las calorías consumidas
    var sum = values.reduce(function(a, b) { return a + b; });

    //Se devuelve la suma
    return sum.toFixed(2);
  }

  function compareDate(a,b){
    if(a.date < b.date)
      return -1;
    if(a.date > b.date)
      return 1;
    return 0;
  }

  function compareExercise(a,b){
    if(a.startTime < b.startTime)
      return -1;
    if(a.startTime > b.startTime)
      return 1;
    return 0;
  }

  //Función que comprueba la cantidad de días seguidos que se ha comido con carga glucémica menor a 10 y a 20
  function mealMedals(){
    var days10 = 0;
    var days20 = 0;
    var days10Bool = 0;
    var days20Bool = 0;

    //Se recorre cada día
    for (var dia in $scope.user.groupedMealsReverse){
      //Se recorre cada comida
      $scope.user.groupedMealsReverse[dia].forEach(function(comida){
        //Se calcula la media de la Carga Glucémica de toda la comida
        var mediaCG = $scope.getTotal(comida.food)/comida.food.length;

        if(days20Bool != 2){
          if(mediaCG <= 20){
            if(days10Bool != 2){
              if(mediaCG <= 10){
                days10Bool = 1;
              }
              else{
                days10Bool = 2;
              }
            }
            days20Bool = 1;
          }
          else{
            days10Bool = 2
            days20Bool = 2;
          }
        }
      });
      
      if(days20Bool == 1){
        days20++;
      }
      else{
        days20 = 0;
      }

      if(days10Bool == 1){
        days10++;
      }
      else{
        days10 = 0;
      }

      days10Bool = 0;
      days20Bool = 0;
    }

    //Si se superan los días necesarios con comidas por debajo de carga glucémica 10 y 20, se añade la medalla correspondiente
    if(days20 >= 7 && !$scope.user.medals[4]){
      var mensaje = "¡Has ganado la medalla de Saludable por una semana de comidas de carga glucémica de menos de 20! Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      changeMedal(4, 1, mensaje);
    }
    else if(days20 < 7 && $scope.user.medals[4]){
      var mensaje = "¡Has perdido la medalla de Saludable por eliminar una comida de carga glucémica de menos de 20! Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      changeMedal(4, 0, mensaje);
    }

    if(days10 >= 7 && !$scope.user.medals[5]){
      var mensaje = "¡Has ganado la medalla de ¡Ligerito, ligerito! por una semana de comidas de carga glucémica de menos de 10! Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      changeMedal(5, 1, mensaje);
    }
    else if(days10 < 7 && $scope.user.medals[5]){
      var mensaje = "¡Has perdido la medalla de ¡Ligerito, ligerito! por eliminar una comida de carga glucémica de menos de 10! Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      changeMedal(5, 0, mensaje);
    }
  }

  //Función que modifica las medallas al usuario
  function changeMedal(index, valor, mensaje){
    //Se asigna el valor a la medalla
    $scope.user.medals[index] = valor;

    var tipo = "";
    var titulo = "";

    //Tipo de notificación
    if(valor){
      tipo = "success";
      titulo = "<strong>¡Enhorabuena!</strong><br/>";
    }
    else{
      tipo = "danger";
      titulo = "<strong>¡Mala suerte!</strong><br/>";
    }
      
    //Se crea la nueva medida
    $http.post('/users/'+$scope.user.id, {medals: $scope.user.medals})
      .success(function(correct){
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;

          setTimeout(function() {
            $.notify({
              icon: "images/icons/"+$scope.ranking.medals[index].badge+"On.png",
              title: titulo,
              message: mensaje
            },{
              type: tipo,
              icon_type: "image"
            });
          }, 8000);
        });
      })

      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido añadir la medalla'); 
      });
  }

  //Funcion para calcular la mediana de un array
  function median(values) {
      values.sort(function(a,b) {
        return a - b;
      });
      var half = Math.floor(values.length/2);
      if(values.length % 2)
          return values[half];
      else
          return (values[half-1] + values[half]) / 2.0;
  }

  /*funcion para obtener los umbrales de la variables glucosa, ejercicio y alimentacion
  recibe como parámetro un usuario, devuelve los arrays que se emplean en el objeto variables_input
  para el calculo de fuzzy logic*/
  function getUmbrales(usuario, minimo){

    //Arrays para almacenar los umbrales de cada variable
    var glucLevels=[];
    var exerciseLevels=[];
    var mealLevels=[];

    //Si no se llega al mínimo de medidas, se definen los umbrales por defecto
    if(usuario.glucoseLevels.length < minimo){
      $scope.trapezGlucosa = [
            [0,0,65,75],
            [65,75,155,165],
            [155,165,240,240]
          ];
    }
    else{
      //Se hace lo mismo con los niveles de glucosa
      usuario.glucoseLevels.forEach(function(level){
        glucLevels.push(level.gLevel);
      });

      //Calculo de umbrales de glucosa
      //Se obtiene la mediana de las medidas de glucosa
      var medianaGlucosa=Math.round(median(glucLevels));

      /*En las variables de incremento, dependiendo de la variable se calcula un valor proporcional 
      a la mediana que se emplea para fijar la distancia entre unos valores de los umbrales y otros*/

      //Variable incremento utilizada en la variable glucosa
      var incrementoGlucosa=Math.round((2*medianaGlucosa)/50);

      //Los umbrales de glucosa se almacenan en array del tipo [[0,0,A,B],[A,B,C,D],[C,D,2*MEDIANA,2*MEDIANA]]
      /*Calculamos los valores de A,B,C,D estos valores se calculan usando como patrón unos umbrales 
      estándar [[0,0,60,65],[60,65,130,135],[130,135,230,230]], tratando de mantener la proporción que 
      hay entre estos umbrales y los que se van a calcular empleando el historico del usuario*/
      var trapGlucosaA=Math.round((medianaGlucosa/2)+incrementoGlucosa);
      var trapGlucosaB=Math.round((medianaGlucosa/2)+(2*incrementoGlucosa));
      var trapGlucosaC=trapGlucosaB*2;
      var trapGlucosaD=trapGlucosaC+incrementoGlucosa;
      /*Una vez calculados los valores A,B,C,D podemos calcular el array con los umbrales en base al 
      historial del usuario*/
      $scope.trapezGlucosa=[[0,0,trapGlucosaA,trapGlucosaB],
        [trapGlucosaA,trapGlucosaB,trapGlucosaC,trapGlucosaD],
        [trapGlucosaC,trapGlucosaD,2*medianaGlucosa,2*medianaGlucosa]];
    }

    //Si no se llega al mínimo de medidas, se definen los umbrales por defecto
    if(usuario.exercise.length < minimo){
      $scope.trapezEjercicio = [
            [0,0,100,150],
            [100,150,250,300],
            [250,300,400,400]
          ];
    }
    else{
      //Se recorren las mediciones de ejercicio del usuario, se añaden las calorias consumidas al array
      usuario.exercise.forEach(function(ex){
        exerciseLevels.push(ex.calories);
      });

      //Calculo de umbrales de ejercicio
      var medianaEjercicio=Math.round(median(exerciseLevels));
      var incrementoEjercicio=Math.round((2*medianaEjercicio)/30);

      //El umbral de ejercicio es un array del tipo [[0,0,A,B],[A,B,C,D],[C,D,2*MEDIANA,2*MEDIANA]]
      /*En este caso el patrón de ejercicio es [[0,0,100,150],[100,150,250,300],[250,300,400,400]]
      este patron se vuelve a utilizar para calcular los valores A,B,C,D a partir del historial del usuario*/
      var trapEjercicioA=Math.round(((medianaEjercicio*2)/3)-incrementoEjercicio);
      var trapEjercicioB=trapEjercicioA+2*incrementoEjercicio;
      var trapEjercicioC=medianaEjercicio+4*incrementoEjercicio;
      var trapEjercicioD=trapEjercicioC+2*incrementoEjercicio;

      $scope.trapezEjercicio=[[0,0,trapEjercicioA,trapEjercicioB],
        [trapEjercicioA,trapEjercicioB,trapEjercicioC,trapEjercicioD],
        [trapEjercicioC,trapEjercicioD,2*medianaEjercicio,2*medianaEjercicio]];
    }

    //Si no se llega al mínimo de medidas, se definen los umbrales por defecto
    if(usuario.meals.length < minimo){
      $scope.trapezCglucemica = [
            [0,0,9,11],
            [9,11,19,21],
            [19,21,30,30]
          ];
    }
    else{
      //Se recorren las comidas del usuario
      usuario.meals.forEach(function(meal){
        var totalGload=0;
        //Para cada comida se suma la carga glucemica de cada alimento
        meal.food.forEach(function (f){
          totalGload+=f.gLoad;
        });
        //Se añade al array de comidas la media de la carga glucemica de la comida
        mealLevels.push(Math.round(totalGload/meal.food.length));
      });

      //Calculo de umbrales de carga glucemica
      var medianaCglucemica=Math.round(median(mealLevels));
      var incrementoCglucemica=Math.round((2*medianaCglucemica)/15);

      //El patron utilizado para calcular los valores A,B,C,D es [[0,0,9,11],[9,11,19,21],[19,21,30,30]]
      var trapCglucemicaA=Math.round(((medianaCglucemica*2)/3)-incrementoCglucemica/2);
      var trapCglucemicaB=trapCglucemicaA+incrementoCglucemica;
      var trapCglucemicaC=medianaCglucemica+2*incrementoCglucemica;
      var trapCglucemicaD=trapCglucemicaC+incrementoCglucemica;

      $scope.trapezCglucemica=[[0,0,trapCglucemicaA,trapCglucemicaB],
        [trapCglucemicaA,trapCglucemicaB,trapCglucemicaC,trapCglucemicaD],
        [trapCglucemicaC,trapCglucemicaD,2*medianaCglucemica,2*medianaCglucemica]];
    }

    //Devolvemos un array con los 3 arrays de umbrales de las 3 variables
    return [$scope.trapezGlucosa,$scope.trapezEjercicio,$scope.trapezCglucemica];
  }

  //Función que calcula el bienestar de un usuario
  function getWellness(){
    //Se definen los crisp_input
    var sortedGlucose = $scope.user.glucoseLevels.sort(compareDate);
    var sortedExercise = $scope.user.exercise.sort(compareExercise);
    var sortedMeals = $scope.user.meals.sort(compareDate);
    var glucoseInput = 0;
    var exerciseInput = 0;
    var mealsInput = 0;

    if(sortedGlucose.length){
      glucoseInput = sortedGlucose[sortedGlucose.length-1].gLevel;
    }
    if(sortedExercise.length){
      exerciseInput = sortedExercise[sortedExercise.length-1].calories;
    }
    if(sortedMeals.length){
      mealsInput = parseFloat($scope.getTotalMeal(sortedMeals[sortedMeals.length-1].food)/sortedMeals[sortedMeals.length-1].food.length);
    }

    $scope.entradas = [
          glucoseInput, 
          exerciseInput, 
          mealsInput
        ];

    console.log("Glucosa: "+$scope.entradas[0]+"; Ejercicio: "+$scope.entradas[1]+"; Comida: "+$scope.entradas[2]);

    //Se definen los umbrales
    var umbrales = getUmbrales($scope.user, 20);

    console.log(umbrales);


    //Objeto donde se definen los valores por defecto de las variables de entrada y salida, así como las inferencias
    var fuzzyParam = {
      crisp_input: $scope.entradas,
      variables_input: [
        {
          name: "Glucosa",
          setsName: ["Baja", "Óptima", "Alta"],
          sets: umbrales[0]
        },
        {
          name: "Ejercicio (cal)",
          setsName: ["Bajo", "Medio", "Alto"],
          sets: umbrales[1]
        },
        {
          name: "Comida (carga glucémica)",
          setsName: ["Baja", "Media", "Alta"],
          sets: umbrales[2]
        }
      ],
      variable_output: {
        name: "Bienestar",
        setsName: ["Bajo", "Medio", "Alto"],
        sets: [
          [0,15,15,30],
          [30,45,45,60],
          [60,75,75,90]
        ]
      },
      inferences: [
        [0,2,0],
        [0,1,2],
        [2,1,0]
      ]
    };

    var fl = new FuzzyLogic();
    return (Math.floor(fl.getResult(fuzzyParam)));
  }

  //Función que se llama para calcular el bienestar mínimo deseado para un usuario
  function getDesiredWellness(glucosa, ejercicio, comida){
    //Se definen los umbrales
    var umbrales = getUmbrales($scope.user, 20);

    //Objeto donde se definen los valores por defecto de las variables de entrada y salida, así como las inferencias
    var fuzzyParam = {
      crisp_input: [glucosa, ejercicio, comida],
      variables_input: [
        {
          name: "Glucosa",
          setsName: ["Baja", "Óptima", "Alta"],
          sets: umbrales[0]
        },
        {
          name: "Ejercicio (cal)",
          setsName: ["Bajo", "Medio", "Alto"],
          sets: umbrales[1]
        },
        {
          name: "Comida (carga glucémica)",
          setsName: ["Baja", "Media", "Alta"],
          sets: umbrales[2]
        }
      ],
      variable_output: {
        name: "Bienestar",
        setsName: ["Bajo", "Medio", "Alto"],
        sets: [
          [0,15,15,30],
          [30,45,45,60],
          [60,75,75,90]
        ]
      },
      inferences: [
        [0,2,0],
        [0,1,2],
        [2,1,0]
      ]
    };

    var fl = new FuzzyLogic();
    return (Math.floor(fl.getResult(fuzzyParam)));
  }

  //Función que calcula el mensaje personalizado de bienestar
  function getWellnessMessage(glucosa, ejercicio, dieta){
    var newWellness = 0;
    var calories = 0;
    var mealGL = 0;

    //Se almacenan los umbrales para cada entrada
    var gMin = $scope.trapezGlucosa[1][1];
    var gMax = $scope.trapezGlucosa[1][2];
    var exMin = $scope.trapezEjercicio[1][1];
    var exMax = $scope.trapezEjercicio[1][2];
    var mMin = $scope.trapezCglucemica[1][1];
    var mMax = $scope.trapezCglucemica[1][2];

    if($scope.wellness < 60){
      if(glucosa < gMin){
        return "Tienes la glucosa demasiado baja... come algo y mide tu glucosa dos horas después.";
      }
      else if(glucosa > gMax){
        calories = 300;
        var calPerMinute = getCalPerMin();

        return "Tienes la glucosa demasiado alta... sal a caminar al menos "+Math.round(calories/calPerMinute)+" minutos para quemar "+calories+" calorías y vuelve a medir tu glucosa después. Deberías también evitar los alimentos de Carga Glucémica mayor que 10.";
      }
      else{
        //Dieta óptima y ejercicio bajo
        if(dieta <= mMin && ejercicio <= exMax){
          while(newWellness < 60){
            if(calories < 300){
              //Se aumentan las calorias a consumir hasta un máximo de 300 para evitar bucles infinitos en Fuzzy Logic
              calories +=10;

              newWellness = getDesiredWellness(glucosa, calories, dieta);
            }
            else{
              break;
            }
          }
          var calPerMinute = getCalPerMin();

          return "Tienes un buen nivel de glucosa y muy buena alimentación, pero puedes salir a caminar "+Math.round(calories/calPerMinute)+" minutos para quemar "+calories+" calorías y mejorar aún más tu bienestar.";
        }
        //Dieta normal y ejercicio bajo
        else if(dieta <= mMax && ejercicio <= exMax){
          while(newWellness < 60){
            if(calories < 300){
              //Se aumentan las calorias a consumir hasta un máximo de 300 para evitar bucles infinitos en Fuzzy Logic
              calories +=10;

              newWellness = getDesiredWellness(glucosa, calories, mMin);
            }
            else{
              break;
            }
          }
          var calPerMinute = getCalPerMin();

          return "Tienes un buen nivel de glucosa pero tu alimentación puede mejorar. Deberías salir a caminar "+Math.round(calories/calPerMinute)+" minutos para quemar "+calories+" calorías y comer alimentos de Carga Glucémica menor que 10 para mejorar tu bienestar.";
        }
        //Dieta normal y ejercicio alto
        else if(dieta <= mMax && ejercicio > exMax){
          return "Tienes un buen nivel de glucosa y de ejercicio, pero tu alimentación puede mejorar. Deberías comer alimentos de Carga Glucémica menor que 10 para mejorar tu bienestar.";
        }
        //Dieta mala y ejercicio bajo
        else if(dieta > mMax && ejercicio <= exMax){
          while(newWellness < 60){
            if(calories < 300){
              //Se aumentan las calorias a consumir hasta un máximo de 300 para evitar bucles infinitos en Fuzzy Logic
              calories +=10;

              newWellness = getDesiredWellness(glucosa, calories, mMax);
            }
            else{
              break;
            }
          }
          var calPerMinute = getCalPerMin();

          return "Tienes un buen nivel de glucosa pero tu alimentación no es saludable. Deberías salir a caminar "+Math.round(calories/calPerMinute)+" minutos para quemar "+calories+" calorías y comer alimentos de Carga Glucémica menor que 10 para evitar subidas de glucosa en sangre.";
        }
        //Dieta mala y ejercicio alto
        else if(dieta > mMax && ejercicio > exMax){
          return "Tienes un buen nivel de glucosa y de ejercicio, pero tu alimentación no es saludable. Deberías comer alimentos de Carga Glucémica menor que 10 para mejorar tu bienestar.";
        }
      }
    }
    else{
      return "Tienes un nivel de bienestar óptimo. ¡Sigue así!";
    }
  }

  //Función que calcula las calorías por minuto que consume el usuario basado en su histórico
  function getCalPerMin(){
    var exerciseLevels=[];
    var caloriesPerMinute=[];

    //Se recorren las mediciones de ejercicio del usuario, se añaden las calorias consumidas al array
    $scope.user.exercise.forEach(function(ex){
      exerciseLevels.push(ex.calories);

      inicio = new Date(ex.startTime);
      fin = new Date(ex.endTime);

      //Se pasan los milisegundos a minutos 
      var minutos = (fin.getTime()-inicio.getTime())/60000;
      caloriesPerMinute.push(ex.calories/minutos);
    });

    //Cálculo de la media de calorías por minuto
    var sum = caloriesPerMinute.reduce(function(a, b) { return a + b; });
    var media = sum/caloriesPerMinute.length;
    //$scope.calPerMinute = media.toFixed(2);
    return media.toFixed(2);
  }
}]);