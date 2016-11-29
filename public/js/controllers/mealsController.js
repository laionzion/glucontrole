//Controlador de recetas
glucontrole.controller('MealsController',['$scope', '$http', function($scope, $http){
  $scope.foodList = [];

  //Obtenemos el listado de alimentos
  $http
    .get('/food')
    .success(function(data){
      $scope.foodList = data;
    });

  //Funcion para filtrar las recetas en base a los productos disponibles
  $scope.myProdsFilter = function(element) {
    if($scope.myProdsChecked) return element.recommended;
    else return element;
  };

  //Funcion para filtrar las recetas a las que el usuario es alergico
  $scope.myAllergiesFilter = function(element) {
    if($scope.myAllergiesChecked) return !element.userIsAllergic;
    else return element;
  };
  
}]);