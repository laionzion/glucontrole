//Controlador de menú de registro de usuario
RFM.controller('RegisterController', ['$scope', '$http', '$location',
	function($scope, $http, $location){ 
	//Función para limpiar los checks de alergias
	$scope.limpiar=function(){
		$scope.glutenal=false;
		$scope.eggal=false;
		$scope.milkal=false;
		$scope.soyal=false;
		$scope.nutal=false;
		$scope.peanutsal=false;
		$scope.fishal=false;
		$scope.shellfishal=false;
		$scope.celeryal=false;
		$scope.sesameal=false;
		$scope.mustardal=false;
	}
	//Función de usuario
	$scope.register = function(){
		//Propiedades del usuario que se va a crear
		var registerData = {
			'username': $scope.username,
			'password': $scope.password,
			'rfm': $scope.rfm,
			'firstName': $scope.firstname,
			'secondName': $scope.secondname,
			'cGluten': $scope.glutenal,
			'cEgg': $scope.eggal,
			'cMilk': $scope.milkal,
			'cSoy': $scope.soyal,
			'cNut': $scope.nutal,
			'cPeanuts': $scope.peanutsal,
			'cFish': $scope.fishal,
			'cShellFish': $scope.shellfishal,
			'cCelery': $scope.celeryal,
			'cSesame': $scope.sesameal,
			'cMustard': $scope.mustardal
	    };
	    //Se crea el usuario
		$http.post('/users', registerData)
			.success(function(userData){
				//Se le lleva al menú de login
				$location.path('/login');
			})
			//Si se produce un error se avisa al usuario
			.error(function(){
				alert('No se ha podido registrar ese usuario');	
			});
	};
}]);