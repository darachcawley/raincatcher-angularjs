var CONSTANTS = require('./constants');
var WebAuthService = require('./webAuthService');
var Promise = require('bluebird');

/**
 * Auth service for the mobile app which extends the Passport Auth module
 */
function MobileAuthService($http, $window, $mdDialog, $state) {
  this.state = $state;
  this.http = $http;
  this.loginListener = null;
  this.logoutListener = null;
  WebAuthService.call(this, $http, $window, $mdDialog, $state);
}

MobileAuthService.prototype = Object.create(WebAuthService.prototype);
MobileAuthService.prototype.constructor = MobileAuthService;
MobileAuthService.prototype.getProfile = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var userProfile = localStorage.getItem(CONSTANTS.USER_CACHE_KEY);
    if (userProfile) {
      try {
        userProfile = JSON.parse(userProfile);
        if (self.loginListener) {
          self.loginListener(userProfile);
        }
        return resolve(userProfile);
      } catch (err) {
        return reject(new Error(err));
      }
    }
    return reject(new Error('User profile not found'));
  });
};

MobileAuthService.prototype.authenticate = function(username, password) {
  var self = this;
  var url = WebAuthService.prototype.getCloudUrl.call(this) + CONSTANTS.TOKEN_LOGIN_URL;
  return new Promise(function(resolve, reject) {
    self.http.post(url, {
      username: username,
      password: password
    }).then(function(res) {
      localStorage.setItem(CONSTANTS.TOKEN_CACHE_KEY, res.data.token);
      localStorage.setItem(CONSTANTS.USER_CACHE_KEY, JSON.stringify(res.data.profile));
      if (self.loginListener) {
        self.loginListener(res.data.profile);
      }
      resolve();
    }).catch(function(err) {
      if (err.status === 401) {
        reject(new Error('Invalid Credentials'));
      } else if (err.status === -1) {
        reject(new Error('You are offline'));
      }
      reject(err);
    });
  });
};

MobileAuthService.prototype.setLoginListener = function(listener) {
  this.loginListener = listener;
};

MobileAuthService.prototype.setLogoutListener = function(listener) {
  this.logoutListener = listener;
};

MobileAuthService.prototype.login = function() {
  var self = this;
  if (self.logoutListener) {
    self.logoutListener();
  }
  localStorage.clear();
  self.state.go(CONSTANTS.LOGIN_STATE_ROUTE);
};

MobileAuthService.prototype.logout = function() {
  this.login();
};

module.exports = MobileAuthService;
