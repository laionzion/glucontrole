//Controlador de glucosa
glucontrole.controller('GlucoseController',['$scope', '$http', '$location', function($scope, $http, $location){
  $scope.user = [];
  $scope.ranking = [];
  var sendGlucose = [];
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

  //Función para añadir una medida de glucosa nueva
  $scope.addGlucoseData = function(){
    //Se modifica la hora por la indicada por el usuario
    var glucoseDate = changeDate($scope.fecha, $scope.hora);

    //Se actualiza la fecha del ranking
    var rankingDate = new Date (glucoseDate);
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
      $scope.user.ranking[attrIndex].gCount += 1;
    }
    else{
      //Si existe el día ya en el ranking, se añade una medida más al contador
      $scope.user.ranking[attrIndex].gCount += 1;
    }

    //Propiedades de la medida realizada
    var glucoseData = {
      //Se mete la fecha en formato Unix
      "date": glucoseDate.getTime(),
      "mType": $scope.glucoseType,
      "gLevel": parseInt($scope.glucoseValue)
    };

    if(glucoseData.gLevel > 70 && glucoseData.gLevel <= 145){
      notifyType = "success";
      notifyIcon = "glyphicon glyphicon-star";
      notifyMessage = "¡Buena medida de glucosa! ¡Has ganado 1 punto! ¡Sigue así!";
      $scope.user.ranking[attrIndex].points += 1;
    }
    else if(glucoseData.gLevel > 145 && glucoseData.gLevel <= 160){
      notifyType = "warning";
      notifyIcon = "glyphicon glyphicon-thumbs-up";
      notifyMessage = "¡No está mal! ¡Has ganado 0.5 puntos! Intenta bajar a menos de 145...";
      $scope.user.ranking[attrIndex].points += 0.5;
    }
    else if(glucoseData.gLevel > 160){
      notifyType = "danger";
      notifyIcon = "glyphicon glyphicon-thumbs-down";
      notifyMessage = "¡Tienes la glucosa demasiado alta! Pierdes 1 punto...";
      $scope.user.ranking[attrIndex].points -= 1;
    }
    else{
      notifyType = "danger";
      notifyIcon = "glyphicon glyphicon-thumbs-down";
      notifyMessage = "¡Tienes la glucosa demasiado baja! Pierdes 1 punto...";
      $scope.user.ranking[attrIndex].points -= 1;
    }

    //Se añade la última medida
    if($scope.user.glucoseLevels == null){
      sendGlucose.push(glucoseData);
    }
    else{
      sendGlucose = $scope.user.glucoseLevels;
      sendGlucose.push(glucoseData);
    }

    //Se crea la nueva medida
    $http.post('/users/'+$scope.user.id, {glucoseLevels: sendGlucose})
      .success(function(correct){
        //Se limpian los campos del formulario
        $scope.limpiar();

        $.notify({
          icon: notifyIcon,
          message: notifyMessage
        },{
          type: notifyType,
        });

        $scope.addRankingData();

        $scope.wellness = getWellness();

        notifyWellness = getWellnessMessage($scope.entradas[0], $scope.entradas[1], $scope.entradas[2]);

        if(notifyTimeout == 0){
          setTimeout(function() {
            $.notify({
              icon: "glyphicon glyphicon-dashboard",
              message: notifyWellness
            },{
              type: "info",
            });
          }, 4000);
        }
        else if(notifyTimeout == 1){
          setTimeout(function() {
            $.notify({
              icon: "glyphicon glyphicon-dashboard",
              message: notifyWellness
            },{
              type: "info",
            });
          }, 8000);
          notifyTimeout = 0;
        }

        //Se vuelve a cargar la lista de medidas de glucosa
        $location.path('/glucose');
      })

      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido añadir la medida'); 
    });
  };

  //Función para añadir una medida de glucosa nueva
  $scope.addRankingData = function(){
    if($scope.user.ranking[attrIndex].gCount == 3){
      notifyType1 = "success";
      notifyIcon1 = "glyphicon glyphicon-star";
      notifyMessage1 = "¡Bien hecho! ¡Has medido tu glucosa "+$scope.user.ranking[attrIndex].gCount+" veces hoy! ¡Has ganado 1 punto! ¡Sigue así!";
      $scope.user.ranking[attrIndex].points += 1;
      notifyTimeout = 1;
    }
    else if($scope.user.ranking[attrIndex].gCount > 3){
      notifyType1 = "warning";
      notifyIcon1 = "glyphicon glyphicon-thumbs-up";
      notifyMessage1 = "¡Bien hecho! ¡Has medido tu glucosa "+$scope.user.ranking[attrIndex].gCount+" veces hoy! ¡Has ganado 0.5 puntos! ¡Sigue así!";
      $scope.user.ranking[attrIndex].points += 0.5;
      notifyTimeout = 1;
    }

    $http.post('/users/'+$scope.user.id, {ranking: $scope.user.ranking})
      .success(function(correct){
        if($scope.user.ranking[attrIndex].gCount >= 3){
          setTimeout(function() {
            $.notify({
              icon: notifyIcon1,
              message: notifyMessage1
            },{
              type: notifyType1
            });
          }, 4000);
        }

        //Se actualiza la clasificación total
        updateRanking();

        //Se actualizan las medallas
        glucoseMedals();
      })

      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido añadir la puntuación'); 
    });
  };

  //Función para limpiar los campos del formulario
  $scope.limpiar=function(){
    var today = new Date();
    var mes = today.getMonth() + 1;
    var horaFormateada = parseInt(today.getMinutes())<10 ? "0"+today.getMinutes() : today.getMinutes();

    $scope.fecha = today.getDate()+"/"+mes+"/"+today.getFullYear();
    $scope.hora = today.getHours()+":"+horaFormateada;

    $scope.glucoseValue="";
    $scope.glucoseType="";
  }

  //Función para cambiar la fecha actual por la del ejercicio introducido
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

  //Función para eliminar una medida de glucosa
  $scope.deleteGlucoseData = function(medida){
    //Se busca el índice de la medida a eliminar y se elimina
    var index = $scope.user.glucoseLevels.indexOf(medida);
    if (index > -1) {
      $scope.user.glucoseLevels.splice(index, 1);
    }

    //Se actualiza la fecha del ranking
    var rankingDate = new Date(medida.date);
    rankingDate.setHours("00");
    rankingDate.setMinutes("00");
    rankingDate.setSeconds("00");
    rankingDate.setMilliseconds("00");
    fechaString = rankingDate.getDate()+"/"+(rankingDate.getMonth()+1)+"/"+rankingDate.getFullYear();

    attrIndex = findWithAttr($scope.user.ranking, "date", rankingDate.getTime());

    notifyType = "danger";
    notifyIcon = "glyphicon glyphicon-exclamation-sign";

    if(medida.gLevel > 70 && medida.gLevel <= 145){
      notifyMessage = "Has eliminado una buena medida de glucosa. Pierdes 1 punto del día "+fechaString+"...";
      $scope.user.ranking[attrIndex].points -= 1;
    }
    else if(medida.gLevel > 145 && medida.gLevel <= 160){
      notifyMessage = "Has eliminado una medida de glucosa normal. Pierdes 0.5 puntos del día "+fechaString+"...";
      $scope.user.ranking[attrIndex].points -= 0.5;
    }
    else if(medida.gLevel > 160){
      notifyMessage = "Has eliminado una medida de glucosa alta. Recuperas 1 punto del día "+fechaString+"...";
      $scope.user.ranking[attrIndex].points += 1;
    }
    else{
      notifyMessage = "Has eliminado una medida de glucosa baja. Recuperas 1 punto del día "+fechaString+"...";
      $scope.user.ranking[attrIndex].points += 1;
    }

    //Se actualizan las medidas de glucosa
    $http.post('/users/'+$scope.user.id, {glucoseLevels: $scope.user.glucoseLevels})
      .success(function(correct){
        $.notify({
          icon: notifyIcon,
          message: notifyMessage
        },{
          type: notifyType,
        });

        $scope.deleteRankingData();

        $scope.wellness = getWellness();

        notifyWellness = getWellnessMessage($scope.entradas[0], $scope.entradas[1], $scope.entradas[2]);

        if(notifyTimeout == 0){
          setTimeout(function() {
            $.notify({
              icon: "glyphicon glyphicon-dashboard",
              message: notifyWellness
            },{
              type: "info",
            });
          }, 4000);
        }
        else if(notifyTimeout == 1){
          setTimeout(function() {
            $.notify({
              icon: "glyphicon glyphicon-dashboard",
              message: notifyWellness
            },{
              type: "info",
            });
          }, 8000);
          notifyTimeout = 0;
        }

        //Se vuelve a cargar la lista de medidas de glucosa
        $location.path('/glucose');
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido eliminar la medida'); 
    });
  };

  //Función para quitar puntos del ranking y actualizar los datos en la tabla
  $scope.deleteRankingData = function(){

    //Se definen las notificaciones
    notifyType1 = "danger";
    notifyIcon1 = "glyphicon glyphicon-exclamation-sign";

    if($scope.user.ranking[attrIndex].gCount == 3){
      notifyMessage1 = "Has eliminado una medida del día "+fechaString+". Pierdes 1 punto de ese día...";
      $scope.user.ranking[attrIndex].points -= 1;
      notifyTimeout = 1;
    }
    else if($scope.user.ranking[attrIndex].gCount > 3){
      notifyMessage1 = "Has eliminado una medida del día "+fechaString+". Pierdes 0.5 puntos de ese día...";
      $scope.user.ranking[attrIndex].points -= 0.5;
      notifyTimeout = 1;
    }
    $scope.user.ranking[attrIndex].gCount -= 1;

    $http.post('/users/'+$scope.user.id, {ranking: $scope.user.ranking})
    .success(function(correct){
      if($scope.user.ranking[attrIndex].gCount >= 2){
        setTimeout(function() {
          $.notify({
            icon: notifyIcon1,
            message: notifyMessage1
          },{
            type: notifyType1
          });
        }, 4000);
      }

      //Se actualiza la clasificación total
      updateRanking();

      //Se actualizan las medallas
      glucoseMedals();
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
      "points": getTotal($scope.user.ranking)
    };

    var rankingIndex = findWithAttr($scope.ranking.rankings, "userid", $scope.user.id);

    $scope.ranking.rankings[rankingIndex] = rankingUpdate;

    $http.post('/ranking/'+$scope.ranking.id, {rankings: $scope.ranking.rankings})
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

  //Funcion que recibe el histórico ranking y devuelve la suma de los puntos del usuario
  function getTotal(ranking){
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

  //Función que comprueba la cantidad de días seguidos que se ha medido la glucosa al menos tres veces diarias
  function glucoseMedals(){
    var days = 0;
    $scope.user.ranking.forEach(function(value){
      if(value.gCount >= 3){
        days++;
      }
      else{
        days = 0;
      }
      console.log(days);
    });

    console.log(days);

    //Si se superan los días necesarios con más de 3 medidas diarias, se añade la medalla correspondiente.
    if(days >= 30 && !$scope.user.medals[3] && $scope.user.medals[2] && $scope.user.medals[1]){
      var mensaje = "¡Has ganado la medalla de Sheriff por medirte la glucosa al menos 3 veces diarias durante un mes! Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      changeMedal(3, 1, mensaje);
    }
    else if(days >= 14 && !$scope.user.medals[2] && $scope.user.medals[1]){
      var mensaje = "¡Has ganado la medalla a la Dedicación por medirte la glucosa al menos 3 veces diarias durante 2 semanas! Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      changeMedal(2, 1, mensaje);

      if($scope.user.medals[3]){
        var mensaje = "¡Has perdido la medalla de Sheriff! Haz al menos 3 medidas hoy para recuperarla. Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
        changeMedal(3, 0, mensaje);
      }
    }
    else if(days >= 7 && !$scope.user.medals[1]){
      var mensaje = "¡Has ganado la medalla de Constante por medirte la glucosa al menos 3 veces diarias durante 1 semana! Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      changeMedal(1, 1, mensaje);

      if($scope.user.medals[2]){
        var mensaje = "¡Has perdido la medalla a la Dedicación! Haz al menos 3 medidas hoy para recuperarla. Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
        changeMedal(2, 0, mensaje);
      }
    }
    else if(days < 7 && $scope.user.medals[1]){
      var mensaje = "¡Has perdido la medalla de Constante! Haz al menos 3 medidas hoy para recuperarla. Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      changeMedal(1, 0, mensaje);  
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
        setTimeout(function() {
          $.notify({
            icon: "images/icons/"+$scope.ranking.medals[index].badge+"On.png",
            title: titulo,
            message: mensaje
          },{
            type: tipo,
            icon_type: "image"
          });
        }, 12000);
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
