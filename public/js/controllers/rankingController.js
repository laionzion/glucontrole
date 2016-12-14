//Controlador de entrenamientos
glucontrole.controller('RankingController',['$scope', '$http', '$location', function($scope, $http, $location){
  $scope.user = [];
  $scope.ranking = [];

  $http.get('/users/me').success(function(data){
    $scope.user = data;
  });

  $http.get('/ranking').success(function(data){
    $scope.ranking = data[0].rankings;
  });
}]);
