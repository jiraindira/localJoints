'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/flows', {
    templateUrl: '/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', [function() {

}]);