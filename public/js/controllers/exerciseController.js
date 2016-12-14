//Controlador de entrenamientos
glucontrole.controller('ExerciseController',['$scope', '$http', '$location', function($scope, $http, $location){

  $scope.user = [];
  var sendExercise = [];

  $http.get('/users/me').success(function(data){
    $scope.user = data;
    
    //Se inician los campos del formulario
    $scope.limpiar();
  });

  //Función para añadir un entrenamiento nuevo
  $scope.addExerciseData = function(){

    var startTime = changeDate($scope.fecha, $scope.horaInicio);
    var endTime = changeDate($scope.fecha, $scope.horaFin);

    //Propiedades del ejercicio realizado
    var exerciseData = {
      //Se mete la fecha en formato Unix
      "startTime": startTime.getTime(),
      "endTime": endTime.getTime(),
      "calories": parseInt($scope.calorias)
    };

    //Se añade el último ejercicio
    if($scope.user.exercise == ""){
      sendExercise.push(exerciseData);
    }
    else{
      sendExercise = $scope.user.exercise;
      sendExercise.push(exerciseData);
    }

    //Se crea el nuevo entrenamiento
    $http.post('/users/'+$scope.user.id, {exercise: sendExercise})
      .success(function(correct){
        
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
        });

        //Se limpian los campos del formulario
        $scope.limpiar();

        //Se vuelve a cargar la lista de entrenamientos
        $location.path('/exercise');
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido añadir el entrenamiento'); 
    });
  };

  //Función para limpiar el formulario e iniciar la fecha actual
  $scope.limpiar=function(){
    var today = new Date();
    var mes = today.getMonth() + 1;

    $scope.fecha=today.getDate()+"/"+mes+"/"+today.getFullYear();
    $scope.horaInicio="";
    $scope.horaFin="";
    $scope.calorias="";
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

  //Función para eliminar un entrenamiento
  $scope.deleteExerciseData = function(ejercicio){
    //Se busca el índice del entrenamiento a eliminar y se elimina
    var index = -1;

    for (var i = 0; i < $scope.user.exercise.length; i++) {
      if(angular.equals($scope.user.exercise[i], ejercicio)) {
            index = i;
        }
    }

    if (index > -1) {
      $scope.user.exercise.splice(index, 1);
    }

    //Se actualiza la lista de entrenamientos
    $http.post('/users/'+$scope.user.id, {exercise: $scope.user.exercise})
      .success(function(correct){
        
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
        });

        //Se vuelve a cargar la lista de entrenamientos
        $location.path('/exercise');
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido eliminar el entrenamiento'); 
    });
  };

  //Funcion que recibe el histórico de ejercicio y devuelve la suma de las calorías consumidas
  $scope.getTotal = function(cal){
    var values = [];
    cal.forEach(function(value){
      values.push(value.calories);
    });

    //Se calcula la suma de las calorías consumidas
    var sum = values.reduce(function(a, b) { return a + b; });

    //Se devuelve la suma
    return sum;
  }


}]);
