//Controlador de menú de registro de usuario
glucontrole.controller('RegisterController', ['$scope', '$http', '$location', function($scope, $http, $location){

	$http.get('/ranking').success(function(data){
		$scope.ranking = data;
	});

	//Función que registra al nuevo usuario
	$scope.register = function(){
		//Propiedades del usuario que se va a crear
		var registerData = {
			'username': $scope.username,
			'password': $scope.password,
			'firstName': $scope.firstname,
			'secondName': $scope.secondname,
			'birthDate': $scope.birthdate,
			'weight': $scope.weight,
			'height': $scope.height,
	    };

	    registerData.glucoseLevels = [];
	    registerData.meals = [];
	    registerData.exercise = [];
	    registerData.ranking = [];
	    registerData.medals = new Array(8).fill(0);

	    //Se crea el usuario
		$http.post('/users', registerData)
			.success(function(userData){
				//Propiedades del usuario que se va a crear
				var rankingData = {
					'userid': userData.id,
					'username': userData.username,
					'name': userData.firstName+" "+userData.secondName,
					'points': 0,
			    };

			    $scope.ranking[0].rankings.push(rankingData);

				$http.post('/ranking/'+$scope.ranking[0].id, $scope.ranking[0])
					//Si se produce un error se avisa al usuario
					.error(function(){
						alert('No se ha podido actualizar la tabla de ranking con el nuevo usuario');	
					});

				//Se le lleva al menú de login
				$location.path('/login');
			})
			//Si se produce un error se avisa al usuario
			.error(function(){
				alert('No se ha podido registrar el nuevo usuario');	
			});
	};
}]);