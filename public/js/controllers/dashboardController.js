//Controlador de Dashboard
glucontrole.controller('DashboardController',['$scope', '$http', function($scope, $http){
  $scope.user = [];
  $scope.glucoseChartData = [];
  $scope.exerciseChartData = [];
  $scope.mealsChartData = [];
  /*$scope.exportMealsTotal = [];
  $scope.exportMeals = [];*/

  $http.get('/users/me').success(function(data){
    $scope.user = data;

    $scope.updateCharts();
  });
  
  //Función para actualizar la gráfica de glucosa
  $scope.updateCharts = function(){
    var sortedGlucose = $scope.user.glucoseLevels.sort(compareDate);
    var sortedExercise = $scope.user.exercise.sort(compareExercise);
    var sortedMeals = $scope.user.meals.sort(compareDate);
    var history = new Date();
    history = history.setDate(history.getDate() - 14);

    for(var i = 0; i < sortedGlucose.length; i++) {
      if(sortedGlucose[i].date >= history){
        $scope.glucoseChartData.push([new Date(sortedGlucose[i].date), sortedGlucose[i].gLevel]);
      }
    }
    for(var i = 0; i < sortedExercise.length; i++) {
      if(sortedExercise[i].startTime >= history){
        $scope.exerciseChartData.push([new Date(sortedExercise[i].startTime), sortedExercise[i].calories]);
      }
    }
    for(var i = 0; i < sortedMeals.length; i++) {
      if(sortedMeals[i].date >= history){
        $scope.mealsChartData.push([new Date(sortedMeals[i].date), parseFloat($scope.getTotal(sortedMeals[i].food))]);
      }

      //Propiedades de la comida para exportar en CSV
      /*var mealTotalData = {
        "date": sortedMeals[i].date,
        "type": sortedMeals[i].type,
        "totalGL": $scope.getTotal(sortedMeals[i].food)
      };
      $scope.exportMealsTotal.push(mealTotalData);

      sortedMeals[i].food.forEach(function(value){
        var mealData = {
          "date": sortedMeals[i].date,
          "type": sortedMeals[i].type,
          "food": value.name,
          "gLoad": value.gLoad
        };
        $scope.exportMeals.push(mealData);
      });*/
    }

    /*console.log($scope.exportMealsTotal);
    console.log($scope.exportMeals);*/

    google.charts.load('current', {'packages':['corechart', 'line']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
      var glucoseData = new google.visualization.DataTable();
      glucoseData.addColumn('date', 'Fecha');
      glucoseData.addColumn('number', 'Glucosa');
      glucoseData.addRows($scope.glucoseChartData);

      var exerciseData = new google.visualization.DataTable();
      exerciseData.addColumn('date', 'Fecha');
      exerciseData.addColumn('number', 'Calorías quemadas');
      exerciseData.addRows($scope.exerciseChartData);

      var mealsData = new google.visualization.DataTable();
      mealsData.addColumn('date', 'Fecha');
      mealsData.addColumn('number', 'Carga glucémica');
      mealsData.addRows($scope.mealsChartData);

      var glucoseOptions = {
        title: 'Histórico de glucosa en sangre',
        curveType: 'function',
        legend: { position: 'bottom' },
        colors: ['red'],
        chartArea: {width: '85%'},
        vAxis: {viewWindow: {min:0}}
      };

      var exerciseOptions = {
        title: 'Histórico de ejercicio',
        curveType: 'function',
        legend: { position: 'bottom' },
        colors: ['orange'],
        chartArea: {width: '85%'},
        vAxis: {viewWindow: {min:0}}
      };

      var mealsOptions = {
        title: 'Histórico de alimentación',
        curveType: 'function',
        legend: { position: 'bottom' },
        colors: ['green'],
        chartArea: {width: '85%'},
        vAxis: {viewWindow: {min:0}}
      };

      var glucoseChart = new google.visualization.LineChart(document.getElementById('glucoseChart'));
      glucoseChart.draw(glucoseData, glucoseOptions);

      var exerciseChart = new google.visualization.LineChart(document.getElementById('exerciseChart'));
      exerciseChart.draw(exerciseData, exerciseOptions);

      var mealsChart = new google.visualization.LineChart(document.getElementById('mealsChart'));
      mealsChart.draw(mealsData, mealsOptions);
      
      //Función que reajusta el tamaño de las gráficas al tamaño de la ventana (responsive)
      function resizeHandler(){
        glucoseChart.draw(glucoseData, glucoseOptions);
        exerciseChart.draw(exerciseData, exerciseOptions);
        mealsChart.draw(mealsData, mealsOptions);
      }
      if(window.addEventListener){
          window.addEventListener('resize', resizeHandler, false);
      }
      else if(window.attachEvent){
          window.attachEvent('onresize', resizeHandler);
      }
    }
  };

  function compareDate(a,b){
    if(a.date < b.date)
      return -1;
    if(a.date > b.date)
      return 1;
    return 0;
  }

  function compareExercise(a,b){
    if(a.startTime < b.startTime)
      return -1;
    if(a.startTime > b.startTime)
      return 1;
    return 0;
  }

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