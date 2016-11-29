//Controlador de paneles de receta
glucontrole.controller('PanelController',['$scope',function($scope){ 
  //Se inicializa el tab
  $scope.tab = 1;
  //Se cambia el tab
  $scope.selectTab = function(setTab){
    $scope.tab = setTab;
  };
  //Se comprueba si el tab actual es igual al seleccionado
  $scope.isSelected = function(checkTab){
    return $scope.tab === checkTab;
  };
  
  //Funcion para cambiar la cantidad de ingredientes
  $scope.formatQuantity = function(quantity, unit){
    if (Math.floor(quantity)!==quantity) quantity=quantity.toFixed(2);
    if (!quantity) return "";
    switch(unit){
      case "g":
        return ": "+((quantity < 1000) ?
          quantity+" "+unit : (quantity/1000).toFixed(2)+" kg");

      case "ml":
        return ": "+((quantity<1000) ?
          quantity+" "+unit : (quantity/1000).toFixed(2)+" l");

      default :
        if(quantity!==1 && unit.charAt(unit.length-1)!=="s" && unit){
          return ": "+quantity+" "+unit+"s";
        }
        else if(quantity===1 && unit.charAt(unit.length-1)==="s" && unit){
          return ": "+quantity+" "+unit.substring(0,unit.length-1);
        }
        else{
          return ": "+quantity+" "+unit;
        }
    }
  }
}]);