//Controlador de productos
glucontrole.controller('DashboardController',['$scope', '$http', function($scope, $http){

  $scope.productsList = [];
  $scope.usersList = [];

  //Obtenemos el listado de usuarios
  $http.get('/users').success(function(data){
    $scope.usersList=data;
  });

  //Obtenemos el listado de usuarios
  /*$http.get('/products').success(function(data){
    //Para cada producto
    data.forEach(function(currentprod){    
      //Obtenemos las ofertas del producto actual
      currentprod.offers=$scope.offersList.filter(function(el){
        return el.foodId==currentprod.foodId;
      });
      //Si hay ofertas para el producto actual
      if((currentprod.offers).length>0){
        //Nos quedamos con la primera oferta
        currentprod.offerUrl=currentprod.offers[0].url;
      }
      else{
        currentprod.offerUrl="";
      }
    })
    $scope.productsList=data;
  });*/
}]);
