//Controlador de Dashboard
glucontrole.controller('DashboardController',['$scope', '$http', function($scope, $http){
  $scope.user = [];
  $scope.ranking = [];
  $scope.glucoseChartData = [];
  $scope.exerciseChartData = [];
  $scope.mealsChartData = [];
  $scope.entradas = [];
  $scope.wellness = 0;

  //Para exportar en CSV
  // $scope.exportMealsTotal = [];
  // $scope.exportMeals = [];

  $http.get('/users/me').success(function(data){
    $scope.user = data;

    $http.get('/ranking').success(function(data){
      $scope.ranking = data[0];
    });

    //Si no tiene la medalla "¡Bienvenido!", se añade.
    if(!$scope.user.medals[0]){
      var mensaje = "¡Has ganado una medalla por tu primer inicio de sesión! Puedes consultar tus medallas en la <a href='#ranking'>Clasificación</a>.";
      addMedal(0, 1, mensaje);
    }

    $scope.wellness = getWellness();
    console.log("Glucosa: "+$scope.entradas[0]+"; Ejercicio: "+$scope.entradas[1]+"; Comida: "+$scope.entradas[2]);
    console.log("Bienestar: "+$scope.wellness);

    $scope.updateCharts();
  });

  //Función para actualizar las gráficas lineales
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
        $scope.mealsChartData.push([new Date(sortedMeals[i].date), parseFloat($scope.getTotal(sortedMeals[i].food)/sortedMeals[i].food.length)]);
      }

      //Propiedades de la comida para exportar en CSV
      // var mealTotalData = {
      //   "date": sortedMeals[i].date,
      //   "type": sortedMeals[i].type,
      //   "totalGL": $scope.getTotal(sortedMeals[i].food)
      // };
      // $scope.exportMealsTotal.push(mealTotalData);

      // sortedMeals[i].food.forEach(function(value){
      //   var mealData = {
      //     "date": sortedMeals[i].date,
      //     "type": sortedMeals[i].type,
      //     "food": value.name,
      //     "gLoad": value.gLoad
      //   };
      //   $scope.exportMeals.push(mealData);
      // });
    }

    //Se imprimen los JSON para convertir a CSV
    // console.log($scope.exportMealsTotal);
    // console.log($scope.exportMeals);
    // console.log(sortedGlucose);
    // console.log(sortedExercise);

    google.charts.load('current', {'packages':['corechart', 'line', 'gauge']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
      //Datos de las gráficas
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

      var glucoseVSexercise = google.visualization.data.join(glucoseData, exerciseData, 'full', [[0, 0]], [1], [1]);
      var glucoseVSmeals = google.visualization.data.join(glucoseData, mealsData, 'full', [[0, 0]], [1], [1]);

      //Datos de los relojes de Dashboard
      var dataGlucosa = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Glucosa', $scope.entradas[0]]
      ]);

      var dataEjercicio = google.visualization.arrayToDataTable([
          ['Label', 'Value'],
          ['Ejercicio', $scope.entradas[1]]
      ]);

      var dataComida = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Dieta', $scope.entradas[2]]
      ]);

      var dataBienestar = google.visualization.arrayToDataTable([
          ['Label', 'Value'],
          ['Bienestar', $scope.wellness]
      ]);

      //Opciones de las gráficas
      var glucoseVSexerciseOptions = {
        title: 'Glucosa en sangre vs Calorías quemadas',
        curveType: 'function',
        legend: { position: 'bottom' },
        colors: ['red', 'orange'],
        chartArea: {width: '85%'},
        vAxes: {0: {title: 'Glucosa', viewWindow: {min:0}},
                1: {title: 'Calorías (cal)', viewWindow: {min:0}}
                },
          series: {0:{targetAxisIndex: 0},
                   1:{targetAxisIndex: 1},
                  },
        interpolateNulls: true
      };

      var glucoseVSmealsOptions = {
        title: 'Glucosa en sangre vs Comida ingerida',
        curveType: 'function',
        legend: { position: 'bottom' },
        colors: ['red', 'green'],
        chartArea: {width: '85%'},
        vAxes: {0: {title: 'Glucosa', viewWindow: {min:0}},
                1: {title: 'Carga glucémica', viewWindow: {min:0}}
                },
          series: {0:{targetAxisIndex: 0},
                   1:{targetAxisIndex: 1},
                  },
        interpolateNulls: true
      };

      //Opciones de los relojes del Dashboard
      var optionsGlucosa = {
        width: 150, height: 150,
        max:240,
        greenFrom: 70, greenTo: 165,
        redFrom: 165, redTo: 240,
        yellowFrom:0, yellowTo: 70,
        minorTicks: 5
      };

      var optionsComida = {
        width: 150, height: 150,
        max:30,
        greenFrom: 0, greenTo: 10,
        redFrom: 20, redTo: 30,
        yellowFrom:10, yellowTo: 20,
        minorTicks: 5
      };

       var optionsEjercicio = {
        width: 150, height: 150,
        max:600,
        greenFrom: 300, greenTo: 600,
        redFrom: 0, redTo: 150,
        yellowFrom:150, yellowTo: 300,
        minorTicks: 5
      };
      var optionsBienestar = {
        width: 150, height: 150,
        max:90,
        greenFrom: 60, greenTo: 90,
        redFrom: 0, redTo: 30,
        yellowFrom:30, yellowTo: 60,
        minorTicks: 5
      };

      var chart1 = new google.visualization.Gauge(document.getElementById('chart_div1'));
      chart1.draw(dataGlucosa, optionsGlucosa);

      var chart2 = new google.visualization.Gauge(document.getElementById('chart_div2'));
      chart2.draw(dataEjercicio, optionsEjercicio);

      var chart3 = new google.visualization.Gauge(document.getElementById('chart_div3'));
      chart3.draw(dataComida, optionsComida);

      var chart4 = new google.visualization.Gauge(document.getElementById('chart_div4'));
      chart4.draw(dataBienestar, optionsBienestar);

      var glucoseVSexerciseChart = new google.visualization.LineChart(document.getElementById('glucoseVSexerciseChart'));
      glucoseVSexerciseChart.draw(glucoseVSexercise, glucoseVSexerciseOptions);

      var glucoseVSmealsChart = new google.visualization.LineChart(document.getElementById('glucoseVSmealsChart'));
      glucoseVSmealsChart.draw(glucoseVSmeals, glucoseVSmealsOptions);
      
      //Función que reajusta el tamaño de las gráficas al tamaño de la ventana (responsive)
      function resizeHandler(){
        glucoseVSexerciseChart.draw(glucoseVSexercise, glucoseVSexerciseOptions);
        glucoseVSmealsChart.draw(glucoseVSmeals, glucoseVSmealsOptions);
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

  //Función que concede una nueva medalla al usuario
  function addMedal(index, valor, mensaje){
    //Se definen las opciones por defecto de las notificaciones
    $.notifyDefaults({
      newest_on_top: false,
      delay: 5000,
      mouse_over: "pause",
      animate: {
              enter: 'animated bounceIn',
              exit: 'animated fadeOut'
            }
    });

    //Se asigna el valor a la medalla
    $scope.user.medals[index] = valor;
      
    //Se crea la nueva medida
    $http.post('/users/'+$scope.user.id, {medals: $scope.user.medals})
      .success(function(correct){
        $.notify({
          icon: "images/icons/"+$scope.ranking.medals[index].badge+"On.png",
          title: "<strong>¡Enhorabuena!</strong><br/>",
          message: mensaje
        },{
          type: "success",
          icon_type: "image"
        });
      })

      //Mensaje de error
      .error(function(err){
        alert(err.message || 'No se ha podido añadir la medalla'); 
      });
  }

  //Funcion para calcular la mediana de un array
  function median(values) {
      values.sort(function(a,b) {
        return a - b;
      });
      var half = Math.floor(values.length/2);
      if(values.length % 2)
          return values[half];
      else
          return (values[half-1] + values[half]) / 2.0;
  }

  /*funcion para obtener los umbrales de la variables glucosa, ejercicio y alimentacion
  recibe como parámetro un usuario, devuelve los arrays que se emplean en el objeto variables_input
  para el calculo de fuzzy logic*/
  function getUmbrales(usuario, minimo){

    //Arrays para almacenar los umbrales de cada variable
    var glucLevels=[];
    var exerciseLevels=[];
    var mealLevels=[];

    //Si no se llega al mínimo de medidas, se definen los umbrales por defecto
    if(usuario.glucoseLevels.length < minimo){
      var trapezGlucosa = [
            [0,0,65,75],
            [65,75,155,165],
            [155,165,240,240]
          ];
    }
    else{
      //Se hace lo mismo con los niveles de glucosa
      usuario.glucoseLevels.forEach(function(level){
        glucLevels.push(level.gLevel);
      });

      //Calculo de umbrales de glucosa
      //Se obtiene la mediana de las medidas de glucosa
      var medianaGlucosa=Math.round(median(glucLevels));

      /*En las variables de incremento, dependiendo de la variable se calcula un valor proporcional 
      a la mediana que se emplea para fijar la distancia entre unos valores de los umbrales y otros*/

      //Variable incremento utilizada en la variable glucosa
      var incrementoGlucosa=Math.round((2*medianaGlucosa)/50);

      //Los umbrales de glucosa se almacenan en array del tipo [[0,0,A,B],[A,B,C,D],[C,D,2*MEDIANA,2*MEDIANA]]
      /*Calculamos los valores de A,B,C,D estos valores se calculan usando como patrón unos umbrales 
      estándar [[0,0,60,65],[60,65,130,135],[130,135,230,230]], tratando de mantener la proporción que 
      hay entre estos umbrales y los que se van a calcular empleando el historico del usuario*/
      var trapGlucosaA=Math.round((medianaGlucosa/2)+incrementoGlucosa);
      var trapGlucosaB=Math.round((medianaGlucosa/2)+(2*incrementoGlucosa));
      var trapGlucosaC=trapGlucosaB*2;
      var trapGlucosaD=trapGlucosaC+incrementoGlucosa;
      /*Una vez calculados los valores A,B,C,D podemos calcular el array con los umbrales en base al 
      historial del usuario*/
      var trapezGlucosa=[[0,0,trapGlucosaA,trapGlucosaB],
        [trapGlucosaA,trapGlucosaB,trapGlucosaC,trapGlucosaD],
        [trapGlucosaC,trapGlucosaD,2*medianaGlucosa,2*medianaGlucosa]];
    }

    //Si no se llega al mínimo de medidas, se definen los umbrales por defecto
    if(usuario.exercise.length < minimo){
      var trapezEjercicio = [
            [0,0,100,150],
            [100,150,250,300],
            [250,300,400,400]
          ];
    }
    else{
      //Se recorren las mediciones de ejercicio del usuario, se añaden las calorias consumidas al array
      usuario.exercise.forEach(function(ex){
        exerciseLevels.push(ex.calories);
      });

      //Calculo de umbrales de ejercicio
      var medianaEjercicio=Math.round(median(exerciseLevels));
      var incrementoEjercicio=Math.round((2*medianaEjercicio)/30);

      //El umbral de ejercicio es un array del tipo [[0,0,A,B],[A,B,C,D],[C,D,2*MEDIANA,2*MEDIANA]]
      /*En este caso el patrón de ejercicio es [[0,0,100,150],[100,150,250,300],[250,300,400,400]]
      este patron se vuelve a utilizar para calcular los valores A,B,C,D a partir del historial del usuario*/
      var trapEjercicioA=Math.round(((medianaEjercicio*2)/3)-incrementoEjercicio);
      var trapEjercicioB=trapEjercicioA+2*incrementoEjercicio;
      var trapEjercicioC=medianaEjercicio+4*incrementoEjercicio;
      var trapEjercicioD=trapEjercicioC+2*incrementoEjercicio;

      var trapezEjercicio=[[0,0,trapEjercicioA,trapEjercicioB],
        [trapEjercicioA,trapEjercicioB,trapEjercicioC,trapEjercicioD],
        [trapEjercicioC,trapEjercicioD,2*medianaEjercicio,2*medianaEjercicio]];
    }

    //Si no se llega al mínimo de medidas, se definen los umbrales por defecto
    if(usuario.meals.length < minimo){
      var trapezCglucemica = [
            [0,0,9,11],
            [9,11,19,21],
            [19,21,30,30]
          ];
    }
    else{
      //Se recorren las comidas del usuario
      usuario.meals.forEach(function(meal){
        var totalGload=0;
        //Para cada comida se suma la carga glucemica de cada alimento
        meal.food.forEach(function (f){
          totalGload+=f.gLoad;
        });
        //Se añade al array de comidas la media de la carga glucemica de la comida
        mealLevels.push(Math.round(totalGload/meal.food.length));
      });

      //Calculo de umbrales de carga glucemica
      var medianaCglucemica=Math.round(median(mealLevels));
      var incrementoCglucemica=Math.round((2*medianaCglucemica)/15);

      //El patron utilizado para calcular los valores A,B,C,D es [[0,0,9,11],[9,11,19,21],[19,21,30,30]]
      var trapCglucemicaA=Math.round(((medianaCglucemica*2)/3)-incrementoCglucemica/2);
      var trapCglucemicaB=trapCglucemicaA+incrementoCglucemica;
      var trapCglucemicaC=medianaCglucemica+2*incrementoCglucemica;
      var trapCglucemicaD=trapCglucemicaC+incrementoCglucemica;

      var trapezCglucemica=[[0,0,trapCglucemicaA,trapCglucemicaB],
        [trapCglucemicaA,trapCglucemicaB,trapCglucemicaC,trapCglucemicaD],
        [trapCglucemicaC,trapCglucemicaD,2*medianaCglucemica,2*medianaCglucemica]];
    }

    //Devolvemos un array con los 3 arrays de umbrales de las 3 variables
    return [trapezGlucosa,trapezEjercicio,trapezCglucemica];
  }

  //Función que calcula el bienestar de un usuario
  function getWellness(){
    //Se definen los crisp_input
    var sortedGlucose = $scope.user.glucoseLevels.sort(compareDate);
    var sortedExercise = $scope.user.exercise.sort(compareExercise);
    var sortedMeals = $scope.user.meals.sort(compareDate);
    var glucoseInput = 0;
    var exerciseInput = 0;
    var mealsInput = 0;

    if(sortedGlucose.length){
      glucoseInput = sortedGlucose[sortedGlucose.length-1].gLevel;
    }
    if(sortedExercise.length){
      exerciseInput = sortedExercise[sortedExercise.length-1].calories;
    }
    if(sortedMeals.length){
      mealsInput = parseFloat($scope.getTotal(sortedMeals[sortedMeals.length-1].food)/sortedMeals[sortedMeals.length-1].food.length);
    }

    $scope.entradas = [
          glucoseInput, 
          exerciseInput, 
          mealsInput
        ];

    //Se definen los umbrales
    var umbrales = getUmbrales($scope.user, 20);

    console.log(umbrales);


    //Objeto donde se definen los valores por defecto de las variables de entrada y salida, así como las inferencias
    var fuzzyParam = {
      crisp_input: $scope.entradas,
      variables_input: [
        {
          name: "Glucosa",
          setsName: ["Baja", "Óptima", "Alta"],
          sets: umbrales[0]
        },
        {
          name: "Ejercicio (cal)",
          setsName: ["Bajo", "Medio", "Alto"],
          sets: umbrales[1]
        },
        {
          name: "Comida (carga glucémica)",
          setsName: ["Baja", "Media", "Alta"],
          sets: umbrales[2]
        }
      ],
      variable_output: {
        name: "Bienestar",
        setsName: ["Bajo", "Medio", "Alto"],
        sets: [
          [0,15,15,30],
          [30,45,45,60],
          [60,75,75,90]
        ]
      },
      inferences: [
        [0,2,0],
        [0,1,2],
        [2,1,0]
      ]
    };

    var fl = new FuzzyLogic();
    return (Math.floor(fl.getResult(fuzzyParam)));
  }
}]);