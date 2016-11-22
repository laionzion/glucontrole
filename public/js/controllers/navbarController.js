//Controlador de logout
RFM.controller('NavBarController', ['$scope', '$http', '$location',
	function($scope, $http, $location){ 
	//Funcion de logout
	$scope.logout = function(){
		//Logout
		$http.post('/users/logout')
			.success(function(data){
				//Se devuelve al usuario al menú de login
				$location.path('/login');
			})
			.error(function(){
				alert('error');	
			});
	};
}]);