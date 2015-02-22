var app = angular.module('TwitterTracker', ['highcharts-ng', 'angularMoment']);

app.config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
}]);

app.controller('MainCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.chartConfig = {};

    $scope.findFollowers = function(screenName) {
        $http.get('/user?screen_name=' + screenName)
            .success(function(data) {
                $scope.data = data;
                $scope.chartConfig = {
                    options: {
                        chart: {
                            type: 'spline'
                        }
                    },
                    series: [{
                        data: data.followers.map(function(el) {
                            return [Date.parse(el.date), el.amount];
                        }).sort(function(a, b) {
                            return a[0] < b[0] ? -1 : 1;
                        })
                    }],
                    title: {
                        text: 'Hello'
                    },
                    loading: false,
                    xAxis: {
                        type: 'datetime',
                        title: {
                            text: 'Date'
                        }
                    }
                };
            });
    };
}]);
