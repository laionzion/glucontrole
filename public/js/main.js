//Creación del módulo
var glucontrole=angular.module('glucontrole', ['ngRoute'])

//Configuración de las rutas
.config(function($routeProvider){
  $routeProvider
  .when('/dashboard',{
    templateUrl: 'partials/dashboard.html',
    controller: 'DashboardController'
  })
  .when('/login',{
    templateUrl: 'partials/login.html',
    controller: 'LoginController'
  })
  .when('/register',{
    templateUrl: 'partials/register.html',
    controller: 'RegisterController'
  })
  .when('/help',{
    templateUrl: 'partials/help.html'
  })
  .otherwise({
    redirectTo: '/login'
  });
});
