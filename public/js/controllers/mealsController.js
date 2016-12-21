//Controlador de recetas
glucontrole.controller('MealsController',['$scope', '$http', '$location', function($scope, $http, $location){
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
        });

        //Se limpian los campos del formulario
        $scope.limpiar();
        $scope.mealFood = [];

        //Se vuelve a cargar la lista de comidas
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
      /*"amount": parseInt(multFactor),
      "gCarbs": parseInt(serving)*parseInt(multFactor),
      "gIndex": parseInt(food.gIndex),
      "gLoad": parseInt(serving)*parseInt(multFactor)*parseInt(food.gIndex)/100*/

      "amount": multFactor.toFixed(1),
      "gCarbs": serving.toFixed(2)*multFactor.toFixed(1),
      "gIndex": parseInt(food.gIndex),
      "gLoad": serving.toFixed(2)*multFactor.toFixed(1)*parseInt(food.gIndex)/100
    };

    $scope.mealFood.push(mealInfo);
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

    //Se actualiza el histórico de comidas
    $http.post('/users/'+$scope.user.id, {meals: $scope.user.meals})
      .success(function(correct){
        
        //Se vuelve a descargar la información del usuario
        $http.get('/users/me').success(function(data){
          $scope.user=data;
        });

        //Se vuelve a cargar la lista de comidas
        $location.path('/meals');
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
        });

        //Se vuelve a cargar la lista de comidas
        $location.path('/meals');
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