//Controlador de glucosa
glucontrole.controller('GlucoseController',['$scope', '$http', '$location', function($scope, $http, $location){
  $scope.user = [];
  $scope.ranking = [];
  var sendGlucose = [];
  var notifyType = "";
  var notifyIcon = "";
  var notifyMessage = "";
  var notifyType1 = "";
  var notifyIcon1 = "";
  var notifyMessage1 = "";
  var attrIndex = -1;
  var fechaString = "";
  
  //Se definen las opciones por defecto de las notificaciones
  $.notifyDefaults({
    newest_on_top: true,
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
    if($scope.user.glucoseLevels == ""){
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
    }
    else if($scope.user.ranking[attrIndex].gCount > 3){
      notifyType1 = "warning";
      notifyIcon1 = "glyphicon glyphicon-thumbs-up";
      notifyMessage1 = "¡Bien hecho! ¡Has medido tu glucosa "+$scope.user.ranking[attrIndex].gCount+" veces hoy! ¡Has ganado 0.5 puntos! ¡Sigue así!";
      $scope.user.ranking[attrIndex].points += 0.5;
    }

    $http.post('/users/'+$scope.user.id, {ranking: $scope.user.ranking})
      .success(function(correct){
        if($scope.user.ranking[attrIndex].gCount >= 3){
          $.notify({
            icon: notifyIcon1,
            message: notifyMessage1
          },{
            type: notifyType1
          });
        }

        //Se actualiza la clasificación total
        updateRanking();
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
        
        //Se vuelve a descargar la información del usuario
        /*$http.get('/users/me').success(function(data){
          $scope.user=data;
        });*/

        $.notify({
          icon: notifyIcon,
          message: notifyMessage
        },{
          type: notifyType,
        });

        $scope.deleteRankingData();

        //Se vuelve a cargar la lista de medidas de glucosa
        $location.path('/glucose');
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido eliminar la medida'); 
    });
  };

  //Función para añadir una medida de glucosa nueva
  $scope.deleteRankingData = function(){

    //Se definen las notificaciones
    notifyType1 = "danger";
    notifyIcon1 = "glyphicon glyphicon-exclamation-sign";

    if($scope.user.ranking[attrIndex].gCount == 3){
      notifyMessage1 = "Has eliminado una medida del día "+fechaString+". Pierdes 1 punto de ese día...";
      $scope.user.ranking[attrIndex].points -= 1;
    }
    else if($scope.user.ranking[attrIndex].gCount > 3){
      notifyMessage1 = "Has eliminado una medida del día "+fechaString+". Pierdes 0.5 puntos de ese día...";
      $scope.user.ranking[attrIndex].points -= 0.5;
    }
    $scope.user.ranking[attrIndex].gCount -= 1;

    $http.post('/users/'+$scope.user.id, {ranking: $scope.user.ranking})
    .success(function(correct){
      if($scope.user.ranking[attrIndex].gCount >= 3){
        $.notify({
          icon: notifyIcon1,
          message: notifyMessage1
        },{
          type: notifyType1
        });
      }

      //Se actualiza la clasificación total
      updateRanking();
    })

    //Mensaje de error
    .error(function(err){
      alert(err.message || 'No se ha podido añadir la puntuación'); 
    });
  };

  //Función para añadir una medida de glucosa nueva
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
}]);
