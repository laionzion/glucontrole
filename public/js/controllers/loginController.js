//Controlador de login
RFM.controller('LoginController', ['$scope', '$http', '$location',
	function($scope, $http, $location){ 
	//Funcion de login
	$scope.login = function(){
		//Se almacenan el usuario y password
		var loginData = {
			'username': $scope.username,
			'password': $scope.password
	    };
	    //Se hace login
		$http.post('/users/login', loginData)
			//Si el login es correcto se muestran los productos del usuario
			.success(function(){
				$location.path('/products');
			})
			//En caso contrario se muestra un mensaje de error
			.error(function(){
				alert('error');	
			})
	};
}]);