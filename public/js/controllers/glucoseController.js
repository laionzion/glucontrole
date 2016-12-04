//Controlador de glucosa
glucontrole.controller('GlucoseController',['$scope', '$http', '$location', function($scope, $http, $location){

  $scope.user = [];
  var sendGlucose = [];

  $http.get('/users/me').success(function(data){
    $scope.user = data;
  });

  //Función para añadir una medida de glucosa nueva
  $scope.addGlucoseData = function(){
    //Fecha y hora de la medida
    var startTime = new Date();

    //Propiedades de la medida realizada
    var glucoseData = {
      //Se mete la fecha en formato Unix
      "date": startTime.getTime(),
      "mType": $scope.glucoseType,
      "gLevel": parseInt($scope.glucoseValue)
    };

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
        
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
        });

        //Se limpian los campos del formulario
        $scope.limpiar();

        //Se vuelve a cargar la lista de medidas de glucosa
        $location.path('/glucose');
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido añadir la medida'); 
    });
  };

  //Función para limpiar los campos del formulario
  $scope.limpiar=function(){
    $scope.glucoseValue="";
    $scope.glucoseType="";
  }

  //Función para eliminar una medida de glucosa
  $scope.deleteGlucoseData = function(medida){
    //Se busca el índice de la medida a eliminar y se elimina
    var index = $scope.user.glucoseLevels.indexOf(medida);
    if (index > -1) {
      $scope.user.glucoseLevels.splice(index, 1);
    }

    //Se crea la nueva medida
    $http.post('/users/'+$scope.user.id, {glucoseLevels: $scope.user.glucoseLevels})
      .success(function(correct){
        
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
        });

        //Se vuelve a cargar la lista de medidas de glucosa
        $location.path('/glucose');
      })
      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido eliminar la medida'); 
    });
  };
}]);
