angular.module('gsApp.workspaces.layers', [
  'gsApp.workspaces.layers.settings',
  'gsApp.workspaces.layers.type',
  'gsApp.alertpanel',
  'gsApp.core.utilities',
  'ngSanitize'
])
.config(['$stateProvider',
    function($stateProvider) {
      $stateProvider.state('workspace.layers', {
        url: '/layers',
        templateUrl: '/workspaces/detail/layers.tpl.html',
        controller: 'WorkspaceLayersCtrl',
        abstract: true
      });
      $stateProvider.state('workspace.layers.main', {
        url: '/',
        templateUrl: '/workspaces/detail/layers/layers.main.tpl.html',
        controller: 'LayersMainCtrl'
      });
    }])
.controller('WorkspaceLayersCtrl', ['$scope', '$state', '$stateParams',
  '$sce', '$window', '$log', 'GeoServer', 'AppEvent', 'layersListModel',
    function($scope, $state, $stateParams, $sce, $window, $log,
      GeoServer, AppEvent, layersListModel) {

      $scope.workspace = $stateParams.workspace;
      $scope.thumbnails = {};

      $scope.layerThumbsWidth = 175;
      $scope.layerThumbsHeight = 175;

      GeoServer.layers.get($scope.workspace).then(
        function(result) {
          if (result.success) {
            var layers = result.data.layers;
            layersListModel.setLayers(layers);
            $scope.layers = layers;
          } else {
            $scope.alerts = [{
              type: 'danger',
              message: 'Unable to load workspace layers.',
              fadeout: true
            }];
          }
        });

      $scope.mapsHome = function() {
        if (!$state.is('workspace.maps.main')) {
          $state.go('workspace.maps.main', {workspace:$scope.workspace});
        }
      };

      $scope.createMap = function() {
        $state.go('workspace.maps.new', {workspace:$scope.workspace});
      };
      $scope.$on(AppEvent.CreateNewMap, function() {
        $scope.createMap();
      });

    }])
.controller('LayersMainCtrl', ['$scope', '$state', '$stateParams',
  '$sce', '$window', '$log', 'GeoServer', '$modal', '$rootScope',
  'AppEvent', '_',
    function($scope, $state, $stateParams, $sce, $window, $log,
      GeoServer, $modal, $rootScope, AppEvent, _) {

      $scope.workspace = $stateParams.workspace;

      $scope.showAttrs = function(layerOrResource, attributes) {
        var modalInstance = $modal.open({
          templateUrl: '/workspaces/detail/modals/data.attributes.tpl.html',
          controller: 'WorkspaceAttributesCtrl',
          size: 'md',
          resolve: {
            layerOrResource: function() {
              return layerOrResource;
            },
            attributes: function() {
              return attributes;
            }
          }
        });
      };

      $scope.editLayerSettings = function(layer) {
        var modalInstance = $modal.open({
          templateUrl: '/workspaces/detail/modals/layer.settings.tpl.html',
          controller: 'EditLayerSettingsCtrl',
          backdrop: 'static',
          size: 'md',
          resolve: {
            workspace: function() {
              return $scope.workspace;
            },
            layer: function() {
              return layer;
            }
          }
        });
      };

      $scope.createLayer = function() {
        $state.go('workspace.data.import.file', {workspace: $scope.workspace});
      };

      // Get Formats Info
      $scope.formats = {
        'vector': [],
        'raster': [],
        'service': []
      };
      GeoServer.formats.get().then(
        function(result) {
          if (result.success) {
            var formats = result.data;
            for (var i=0; i < formats.length; i++) {
              $scope.formats[formats[i].kind.toLowerCase()].push(formats[i]);
            }
          }
        });

      $scope.layerType = function(layer) {
        var modalInstance = $modal.open({
          templateUrl: '/workspaces/detail/modals/layer.type.tpl.html',
          controller: 'LayerTypeInfoCtrl',
          backdrop: 'static',
          size: 'md',
          resolve: {
            formats: function() {
              return $scope.formats;
            },
            layer: function() {
              return layer;
            },

          }
        });
      };

      $rootScope.$on(AppEvent.LayersAllUpdated, function(scope, layers) {
        if (layers) {
          $scope.layers = layers;
        }
      });

    }])
.service('layersListModel', function(GeoServer, _) {
  var _this = this;
  this.layers = null;

  this.getLayers = function() {
    return this.layers;
  };

  this.setLayers = function(layers) {
    this.layers = layers;
  };

  this.addLayer = function(layer) {
    this.layers.push(layer);
  };

  this.removeLayer = function(layer) {
    _.remove(_this.layers, function(_layer) {
      return _layer.name === layer.name;
    });
  };

  this.fetchLayers = function(workspace) {
    GeoServer.layers.get(workspace).then(
      function(result) {
        if (result.success) {
          _this.setLayers(result.data);
        }
      });
  };
});
