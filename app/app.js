var app = angular.module('StarterApp', ['ngMaterial', 'ngMdIcons', 'myService', 'firebase']);

app.run(function ($rootScope) {
  $rootScope.$on('scope.stored', function (event, data) {
    console.log("scope.stored", data);
  });
});

app.controller('AppCtrl', ['$scope', 'placesExplorerService','$firebase', '$mdBottomSheet','$mdSidenav', '$mdDialog', function($scope, placesExplorerService, $firebase, $mdBottomSheet, $mdSidenav, $mdDialog, Scopes){

  $scope.accessLevel = 2;
  $scope.menu2 = [{name:'#1',minAccess:1},{name:'#2',minAccess:2},{name:'#3',minAccess:1},{name:'#4',minAccess:1}];

  $scope.toggleSidenav = function(menuId) {
    $mdSidenav(menuId).toggle();
  };

  $scope.menu = [
    {
      link : '',
      title: 'Dashboard',
      icon: 'dashboard'
    },
    {
      link : '',
      title: 'Friends',
      icon: 'group'
    }
  ];

  $scope.admin = [
    {
      link : 'showListBottomSheet($event)',
      title: 'Settings',
      icon: 'settings'
    }
  ];

  $scope.alert = '';
  $scope.showListBottomSheet = function($event) {
    $scope.alert = '';
    $mdBottomSheet.show({
      template: '<md-bottom-sheet class="md-list md-has-header"> <md-subheader>Settings</md-subheader> <md-list> <md-item ng-repeat="item in items"><md-item-content md-ink-ripple flex class="inset"> <a flex aria-label="{{item.name}}" ng-click="listItemClick($index)"> <span class="md-inline-list-icon-label">{{ item.name }}</span> </a></md-item-content> </md-item> </md-list></md-bottom-sheet>',
      controller: 'ListBottomSheetCtrl',
      targetEvent: $event
    }).then(function(clickedItem) {
      $scope.alert = clickedItem.name + ' clicked!';
    });
  };

  $scope.showAdd = function(ev) {
    $mdDialog.show({
      controller: AddDialogController,
      controllerAs: "vm",
      templateUrl: 'flows/Add/addDialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true
    })
  };

  $scope.showFilter = function(ev) {
    $mdDialog.show({
      controller: FilterDialogController,
      controllerAs: "vm1",
      templateUrl: 'flows/Filter/filterDialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true
    })
  };

  function getArrayFromObject(object) {
    var array = [];
    for (var key in object) {
      var item = object[key];
      item.id = key;
      array.push(item);
    }
    return array;
  }

  var firebaseObj = new Firebase('https://dazzling-heat-4525.firebaseio.com//restaurant');
  //ref.orderByKey().startAt("b").endAt("b~").on("child_added", function(snapshot) {
  //    console.log(snapshot.key());
  //});
  firebaseObj.once('value', function(dataSnapshot) {

    //GET DATA
    var data = dataSnapshot.val();
    var restaurants = getArrayFromObject(data);

    if (!restaurants.length) return;

    // Attach list of selected observations to each review)
    restaurants.forEach(function (restaurant) {
      restaurant.reviews = getArrayFromObject(restaurant.reviews);

      // pandai pandai la
      restaurant.observations = Object.keys(restaurant.observations)
          .filter(function (key) {
            return restaurant.observations[key];
          });
    });

    $scope.$apply(function () {
      $scope.restaurants = restaurants;
    });
  });

}]);

function AddDialogController($scope, $mdDialog, $q,placesExplorerService, Firebase ) {
  var self = this;

  self.hide = hide;
    self.cancel = cancel;
  self.answer = answer;
  self.querySearch = querySearch;

  self.selectedItem = null;
  self.searchText = null;
  //</editor-fold>


  function hide() {
    $mdDialog.hide();
  };
  function cancel() {
    $mdDialog.cancel();
  };
  function answer(answer) {
    $mdDialog.hide(answer);
  };

  function querySearch(query) {
    var defered = $q.defer();

    placesExplorerService.get({ near: $scope.restaurantData.location, query: query , limit: 4 },function(result){
      defered.resolve(result.response.minivenues);
      console.log(result.response)
    });
    return defered.promise;
  }

  // we will store all of the restaurant specific data here
  $scope.restaurantData = {};
  // we will store all of the reviewer's specific data here
  $scope.reviewerData = {};

  $scope.restaurantData = {
    observations: {
      'Big Group': false,
      'Casual':false,
      'Conversation': false,
      'Crowded':false,
      'Date Spot': false,
      'Fine Dining':false,
      'Great Service': false,
      'Great View': false,
      'Long Wait':false,
      'Meeting': false,
      'Mixology': false,
      'Romantic':false,
      'Outdoor Space':false
    },
    'location' : 'New York, NY'
  };

  $scope.reviewerData = {
    'cost': '$'
  };

  $scope.AddPost = function(){
    console.log(self.selectedItem)
    //store info from fsquare and move to next view
    $scope.restaurantData.name = self.selectedItem.name;
    $scope.restaurantData.address = self.selectedItem.location.address;
    $scope.restaurantData.location = self.selectedItem.location.city;
    $scope.restaurantData.fsquareID = self.selectedItem.id;
    if ("crossStreet" in self.selectedItem.location){
      $scope.restaurantData.crossStreet = self.selectedItem.location.crossStreet;
    }
    else
    {
      $scope.restaurantData.crossStreet = "N/A"
    }
    $scope.restaurantData.longitude = self.selectedItem.location.lng;
    $scope.restaurantData.latitude = self.selectedItem.location.lat;

    var id = $scope.restaurantData.fsquareID;
    var manualId = $scope.restaurantData.name;
    var reviewer = $scope.reviewerData.reviewer;

    if (id == undefined){
      var firebaseID = manualId;
      var firebaseChild = "name";
    }
    else{
      var firebaseID = id;
      var firebaseChild = "fsquareID"
    }
    //add date to the reviewer list
    d = new Date();
    $scope.reviewerData.date = d.toDateString();

    // Making a copy so that you don't mess with original user input
    var payloadRestaurant = angular.copy($scope.restaurantData);
    var payloadReviewer = angular.copy($scope.reviewerData);

    // create restaurant object from firebase
    var restoRef = new Firebase('https://dazzling-heat-4525.firebaseio.com/restaurant');
    var reviewsUrl = "";
    var fbReviews = {};

    restoRef.orderByChild(firebaseChild).startAt(firebaseID).endAt(firebaseID).once('value', function(dataSnapshot) {
      //GET DATA

      if (dataSnapshot.exists()){
        var data = dataSnapshot.val();
        var key = Object.keys(data)[0];
        var masterList = consolidateObservation(data[key],$scope.selected);
        restoRef.child(key).set(masterList);
        reviewsUrl = 'https://dazzling-heat-4525.firebaseio.com/restaurant/' + key + "/reviews";
        fbReviews = new Firebase(reviewsUrl);
        fbReviews.push(payloadReviewer);
      }
      else{
        var masterList1 = consolidateObservation(payloadRestaurant,$scope.selected);
        var pushedResto = restoRef.push(masterList1);
        reviewsUrl = 'https://dazzling-heat-4525.firebaseio.com/restaurant/' + pushedResto.key() + "/reviews";
        fbReviews = new Firebase(reviewsUrl);
        fbReviews.push(payloadReviewer);

      };

      /////////////
    });
      //close dialog box when done
      $mdDialog.cancel();
  };

  //consolidate observations into a master list
  function consolidateObservation(masterObservation,userObservation){
    for (var i in userObservation){
      masterObservation.observations[userObservation[i]] = true;
      console.log(masterObservation.observations[userObservation[i]])
    }
    return masterObservation;
  }

  $scope.items = [1,2,3,4,5];
  $scope.selected = [];
  $scope.toggle = function (item, list) {
    var idx = list.indexOf(item);
    if (idx > -1) list.splice(idx, 1);
    else list.push(item);
  };
  $scope.exists = function (item, list) {
    return list.indexOf(item) > -1;
  };

};

function FilterDialogController($scope, $mdDialog, Firebase, Scopes, filterService ) {

    Scopes.store('FilterDialogController', $scope);

    var vm1 = this;

    $scope.filterService = filterService;
    $scope.selectedPrice = [];
    $scope.selectedCity = [];
    $scope.selectedReviewer = [];
    $scope.prices = [
        {
            price: '$'
        },
        {
          price: '$$'
        },
        {
          price: '$$$'
        },
        {
          price: '$$$$'
        }
    ];

    //methods
    vm1.cancel = cancel;

    if (!filterService.allReviewers.length) {
        var firebaseObj = new Firebase('https://dazzling-heat-4525.firebaseio.com//restaurant');
        firebaseObj.once('value', function (dataSnapshot) {
          //GET DATA
          var data = dataSnapshot.val();
          var restaurants = getArrayFromObject(data);

          // store data in a $scope
          $scope.RestaurantData = restaurants;

          if (!restaurants.length) return;

          //// Retrieve list of locations
          //var locations = [];
          //restaurants.forEach(function (restaurant) {
          //  var temp = restaurant.location;
          //  if (notInArray(temp, locations)) {
          //    locations.push(temp);
          //  }
          //});
          //$scope.cities = locations;

            // Retrieve all cities
            var allCities = [];
            restaurants.forEach(function(restaurant){
                allCities.push(restaurant.location);
            });

            allCities = _.unique(allCities).map(function (city) {
                return {
                    name: city
                }
            });
            filterService.allCities = allCities;

            //Retrieve all reviewers
            var allReviewers = [];
            restaurants.forEach(function (restaurant) {
                var reviews = getArrayFromObject(restaurant.reviews);
                reviews.forEach(function (review) {
                    allReviewers.push(review.reviewer);
                });
            });

            allReviewers = _.unique(allReviewers).map(function (reviewer) {
                return {
                    name: reviewer
                }
            });

            filterService.allReviewers = allReviewers;
            //$scope.reviewers = users;

        });
    }

    function cancel(){
        $mdDialog.cancel();
    }

      function notInArray(value, array) {
        return array.indexOf(value) == -1;
      }

      function getArrayFromObject(object) {
        var array = [];
        for (var key in object) {
          var item = object[key];
          item.id = key;
          array.push(item);
        }
        return array;
      }

      $scope.toggle = function (item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        else list.push(item);
      };

      $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
      };
}

app.directive('userAvatar', function() {
  return {
    replace: true,
    template: '<svg class="user-avatar" viewBox="0 0 128 128" height="64" width="64" pointer-events="none" display="block" > <path fill="#FF8A80" d="M0 0h128v128H0z"/> <path fill="#FFE0B2" d="M36.3 94.8c6.4 7.3 16.2 12.1 27.3 12.4 10.7-.3 20.3-4.7 26.7-11.6l.2.1c-17-13.3-12.9-23.4-8.5-28.6 1.3-1.2 2.8-2.5 4.4-3.9l13.1-11c1.5-1.2 2.6-3 2.9-5.1.6-4.4-2.5-8.4-6.9-9.1-1.5-.2-3 0-4.3.6-.3-1.3-.4-2.7-1.6-3.5-1.4-.9-2.8-1.7-4.2-2.5-7.1-3.9-14.9-6.6-23-7.9-5.4-.9-11-1.2-16.1.7-3.3 1.2-6.1 3.2-8.7 5.6-1.3 1.2-2.5 2.4-3.7 3.7l-1.8 1.9c-.3.3-.5.6-.8.8-.1.1-.2 0-.4.2.1.2.1.5.1.6-1-.3-2.1-.4-3.2-.2-4.4.6-7.5 4.7-6.9 9.1.3 2.1 1.3 3.8 2.8 5.1l11 9.3c1.8 1.5 3.3 3.8 4.6 5.7 1.5 2.3 2.8 4.9 3.5 7.6 1.7 6.8-.8 13.4-5.4 18.4-.5.6-1.1 1-1.4 1.7-.2.6-.4 1.3-.6 2-.4 1.5-.5 3.1-.3 4.6.4 3.1 1.8 6.1 4.1 8.2 3.3 3 8 4 12.4 4.5 5.2.6 10.5.7 15.7.2 4.5-.4 9.1-1.2 13-3.4 5.6-3.1 9.6-8.9 10.5-15.2M76.4 46c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6-.1-.9.7-1.6 1.6-1.6zm-25.7 0c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6-.1-.9.7-1.6 1.6-1.6z"/> <path fill="#E0F7FA" d="M105.3 106.1c-.9-1.3-1.3-1.9-1.3-1.9l-.2-.3c-.6-.9-1.2-1.7-1.9-2.4-3.2-3.5-7.3-5.4-11.4-5.7 0 0 .1 0 .1.1l-.2-.1c-6.4 6.9-16 11.3-26.7 11.6-11.2-.3-21.1-5.1-27.5-12.6-.1.2-.2.4-.2.5-3.1.9-6 2.7-8.4 5.4l-.2.2s-.5.6-1.5 1.7c-.9 1.1-2.2 2.6-3.7 4.5-3.1 3.9-7.2 9.5-11.7 16.6-.9 1.4-1.7 2.8-2.6 4.3h109.6c-3.4-7.1-6.5-12.8-8.9-16.9-1.5-2.2-2.6-3.8-3.3-5z"/> <circle fill="#444" cx="76.3" cy="47.5" r="2"/> <circle fill="#444" cx="50.7" cy="47.6" r="2"/> <path fill="#444" d="M48.1 27.4c4.5 5.9 15.5 12.1 42.4 8.4-2.2-6.9-6.8-12.6-12.6-16.4C95.1 20.9 92 10 92 10c-1.4 5.5-11.1 4.4-11.1 4.4H62.1c-1.7-.1-3.4 0-5.2.3-12.8 1.8-22.6 11.1-25.7 22.9 10.6-1.9 15.3-7.6 16.9-10.2z"/> </svg>'
  };
});

app.config(function($mdThemingProvider) {
  var customBlueMap = 		$mdThemingProvider.extendPalette('light-blue', {
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50'],
    '50': 'ffffff'
  });
  $mdThemingProvider.definePalette('customBlue', customBlueMap);
  $mdThemingProvider.theme('default')
      .primaryPalette('customBlue', {
        'default': '500',
        'hue-1': '50'
      })
      .accentPalette('pink');
  $mdThemingProvider.theme('input', 'default')
      .primaryPalette('grey')
});

app.filter('myFilter',function(Scopes,filterService){
  return function(input){
    //if (angular.isUndefined(input)) return;
    if (!angular.isArray(input)) return;
    var reviewers = filterService.getSelectedReviewers();
    var cities = filterService.getSelectedCities();


   // var reviewers = ["Jirain","Dahlia Bock"];
   // var selectedCities = ["New York"];

    //save the input in a temp output
    var tempOutput = getArrayFromObject(input);

    if(reviewers.length>0){
      //apply reviewer filter on data

      tempOutput = filterReviewer(tempOutput,reviewers);
    }

    if(cities.length>0){
      //apply reviewer filter on data
      tempOutput = filterCity(tempOutput,cities);
    }

    function getArrayFromObject(object) {
      var array = [];
      for (var key in object) {
        var item = object[key];
        item.id = key;
        array.push(item);
      }
      return array;
    }

    function filterReviewer(allRestaurants, selectedReviewers) {
      // Get restaurants that are reviewed by the selected reviewers
      return allRestaurants.filter(function (restaurant) {
        //return true
        var reviews = getArrayFromObject(restaurant.reviews);
        return reviews.some(function(review) {
          return _.find(selectedReviewers, {name: review.reviewer});
        })
      });
    }

      function filterCity(allRestaurants, selectedCities){
          // get restaurants that matches a selected cities
          return allRestaurants.filter(function (restaurant){
              //return true
              return _.find(selectedCities, {name: restaurant.location});
          })
      }

    return tempOutput;
  }
})

.filter('list', function () {
  return function (array) {
    if (!Array.isArray(array)) return;

    return array.join(', ');
  };
});

app.factory('Scopes', function ($rootScope) {
  var mem = {};

  return {
    store: function (key, value) {
      $rootScope.$emit('scope.stored', key);
      mem[key] = value;
    },
    get: function (key) {
      return mem[key];
    }
  };
});

app.service('filterService',function(){
    var self = this;

    this.allReviewers = [];
    this.allCities = [];

    function getSelectedOnly(array){
        return array.filter(function(item){
            return item.selected;
        })
    }

    this.getSelectedReviewers = function(){
        return getSelectedOnly(self.allReviewers)
    }

    this.getSelectedCities = function(){
        return getSelectedOnly(self.allCities)
    }


})