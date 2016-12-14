//Controlador de recetas
glucontrole.controller('MealsController',['$scope', '$http', function($scope, $http){
  $scope.foodList = [];
  $scope.mealFood = [];
  var sendMeal = [];

  $http.get('/users/me').success(function(data){
    $scope.user = data;

    //Se inician los campos del formulario
    $scope.limpiar();
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

    //Propiedades de la comida
    var mealData = {
      //Se mete la fecha en formato Unix
      "date": mealDate.getTime(),
      "type": $scope.mealType,
      "food": $scope.mealFood
    };

    //Se añade la última medida
    if($scope.user.meals == ""){
      sendMeal.push(mealData);
    }
    else{
      sendMeal = $scope.user.meals;
      sendMeal.push(mealData);
    }

    console.log(sendMeal);

    //Se crea la nueva medida
    $http.post('/users/'+$scope.user.id, {meals: sendMeal})
      .success(function(correct){
        
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
        });

        //Se limpian los campos del formulario
        $scope.limpiar();
        $scope.mealFood = [];

        //Se vuelve a cargar la lista de medidas de glucosa
        $location.path('/meals');
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
      "amount": parseInt(multFactor),
      "gCarbs": parseInt(serving)*parseInt(multFactor),
      "gIndex": parseInt(food.gIndex),
      "gLoad": parseInt(serving)*parseInt(multFactor)*parseInt(food.gIndex)/100
    };

    $scope.mealFood.push(mealInfo);

    console.log($scope.mealFood);
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

  //Función para añadir una nueva comida
  $scope.deleteMealFood = function(alimento){
    //Se busca el índice de la medida a eliminar y se elimina
    var index = $scope.mealFood.indexOf(alimento);
    if (index > -1) {
      $scope.mealFood.splice(index, 1);
    }
  };

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
}]);