var app = angular.module('homemadePolls', ['ui.router']);

//polls service manages all polls, user polls, and poll being edited.
//it uses arrays only which makes awkward data manipulation in express router
//and mongoose models
//TODO change data structure because arrays are confusing here, but I can't get
//simple objects to work easily yet...
app.factory('polls', ['$http', 'auth', function($http, auth){
    var o = {
      polls: [],
      myPolls: [],
      poll: []
    };
    o.getAll = function() {
      return $http.get('/polls').success(function(data){
        angular.copy(data, o.polls);
      });
    };
    o.getMyPolls = function(user) {
      return $http.get('/editPoll/' + user).success(function(data){
        angular.copy(data, o.myPolls);
      });
    }
    o.getPoll = function(poll) {
      return $http.get('/poll/' + poll).success(function(data){
        angular.copy(data, o.poll);
      });
    }
    o.create = function(poll) {
      return $http.post('/polls/', poll, {
        headers: {Authorization: 'Bearer '+auth.getToken()}
      }).success(function(data){
        o.polls.push(data);
      });
    };
    o.upvote = function(contestant){
      return $http.put('/contestant/' + contestant + '/upvote').success(function(data){

      })
    }
    return o;
  }]);

//auth service manages registration and logins, using passport and JWT stored
// in client. Still learning wxaclty how this works, especially details of using
//JWTs
  app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};
    auth.saveToken = function (token){
      $window.localStorage['homemade-poll-token'] = token;
    };
    auth.getToken = function (){
      return $window.localStorage['homemade-poll-token'];
    }
    auth.isLoggedIn = function(){
      var token = auth.getToken();
      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };
    auth.currentUser = function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.username;
      }
    };
    auth.register = function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);
      });
    };
    auth.logIn = function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    };
    auth.logOut = function(){
      $window.localStorage.removeItem('homemade-poll-token');
      };
    return auth;
  }]);


app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/homeTemplate.html',
      controller: 'MainCtrl',
      resolve: {
        postPromise: ['polls', function(polls){
         return polls.getAll();
       }]
      }
    })
    .state('test', {
      url:'/test',
      templateUrl:'/testTemp.html'
    })
    .state('editPoll', {
      url:'/editPoll/{user}',
      templateUrl: '/editPollTemplate.html',
      controller: 'EditCtrl',
      resolve: {
        //use polls service to populate only user polls on loading
        poll: ['polls', 'auth', function(polls, auth){
         return polls.getMyPolls(auth.currentUser());
       }]
      }
    })
    .state('takePoll', {
      url:'/poll/:poll',
      templateUrl:'/takePollTemplate.html',
      controller: 'PollCtrl',
      resolve: {
        poll: ['polls', '$stateParams', function(polls, $stateParams){
          //how do I get {poll} from the clicked URL?? USE STATE PARAMS!!
         return polls.getPoll($stateParams.poll);
       }]
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: '/loginTemplate.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: '/registerTemplate.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });

  $urlRouterProvider.otherwise('home');
}]);

app.controller('MainCtrl', [
  '$scope',
  '$stateParams',
  'polls',
  'auth',
  function($scope, $stateParams, polls, auth){
      $scope.isLoggedIn = auth.isLoggedIn;
      $scope.polls = polls.polls;
      $scope.user = auth.currentUser();
  }
])
.controller('PollCtrl', [
  '$scope',
  '$stateParams',
  'polls',
  'auth',
  function($scope, $stateParams, polls, auth){
    $scope.poll = polls.poll;

    $scope.upvote = function(contestant){
      $scope.contestant = $scope.poll[0].contestants.filter(function(x){
        return x._id === contestant
      })
      polls.upvote(contestant);
      $scope.contestant[0].votes += '[]'
    }

  }
])
.controller('EditCtrl', [
  '$scope',
  'polls',
  'auth',
  '$stateParams',
  function($scope, polls, auth, $stateParams){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.user = auth.currentUser();
    //return only the user's polls for the editing page
    $scope.polls = polls.myPolls;
    //this seems like a ridiculous work-around in order to get numbers instead
    //of strings from the angular select element, could be done easier with a
    //text input but I wanted to figure this way out
    //have to use ngoption instead of a regular select I think in order to use
    //objects with a number key to send number instead of string to controller
    //to be able to create the correct number of contestant name fields,
    //couldn't directly cast the ng-model information to number from string
    $scope.numberChoices = [
      {value: 1, number: "1"},
      {value: 2, number: "2"},
      {value: 3, number: "3"},
      {value: 4, number: "4"},
      {value: 5, number: "5"},
      {value: 6, number: "6"},
      {value: 7, number: "7"},
      {value: 8, number: "8"},
      {value: 9, number: "9"},
      {value: 10, number: "10"}
    ];
    //to make the correct number of contestant name fields in the form
    $scope.makeArray = function(num){
      //prevent trying to get num value if not yet set with if(num)
      if (num){
        var x = new Array();
        for (i = 0; i < num.value; i++){
          x.push(i);
        }
      return x;
      }
    }

    //uses polls service to add all the form information to the $scope.newPoll
    //set newpoll object information send to /polls via polls service
    $scope.addPoll = function(){
      //if no title entered, do not let submit
      if ($scope.newPoll.title === '' || $scope.newPoll.numberContestants === ''){
        $scope.newPoll.title = '';
        $scope.newPoll.numberContestants = '';
        return;
      }
      //encode the title for uri for express route to look up with mongoose...
      $scope.newPoll.link = encodeURIComponent($scope.newPoll.title);
      polls.link = $scope.newPoll.link;

      $scope.newPoll.user = $scope.user;
      $scope.newPoll.numberContestants = $scope.newPoll.numberContestants.value

      //this seemed necessary to pull all the contestants before pushing them
      //to newpoll, there's probably a more direct way to do this, but I
      //couldn't figure out how to match the ng-model directly to the newpoll
      //in the right format for the polls Schema
      //this is the only way I could figure out to add all the contestant list
      //items to the newPoll object
      $scope.contestants = [];
      //add contestant for each field in form
      for (let j = 0; j < $scope.newPoll.numberContestants; j++){
        $scope.contestants.push({
          index:j,
          name: $scope.newPoll.contestants[j],
          votes: '[]'
        });
      }
      $scope.newPoll.contestants = $scope.contestants;
      //send to polls service, reset form fields
      polls.create($scope.newPoll)
        .success(function(newPoll){
          $scope.polls.push(newPoll);
          $scope.newPoll.title = '';
          $scope.newPoll.numberContestants = '';
          $scope.contestants = '';
          $scope.newPoll.contestants = '';
        });
    };
    //only show form if +Poll clicked
    $scope.isVisible = false;
    $scope.showHide = function(){
      $scope.isVisible = $scope.isVisible ? false : true;
    }
  }
])
.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
  $scope.logOut = function(){
    alert('logout');
    auth.logOut().error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  }
}])
.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);
