/*
    Controller written by - Pankaj tanwar
*/

angular.module('mainController', ['authServices'])

.controller('mainCtrl', function ($window,$http, auth, $timeout, $location, authToken, $rootScope, user) {

    var app = this;

    app.loadme = false;
    app.home = true;

    $rootScope.$on('$routeChangeStart', function (event, next, current) {

        //console.log($window.location.pathname);
        if(next.$$route) {
            //console.log('we are not at home page');
            app.home = false;
        } else {
            app.home = true;
        }

        if(auth.isLoggedIn()) {

            app.isLoggedIn = true;
            auth.getUser().then(function (data){
                //console.log(data);
                app.name = data.data.name;
                app.email = data.data.email;
                app.username = data.data.username;
                app.branch = data.data.branch;
                app.position = data.data.position;
                app.department = data.data.department;
                app.dob = new Date(data.data.dob);
                app.contact_no = data.data.contact_no;
                app.alternate_contact_no = data.data.alternate_contact_no;
                app.userID = data.data._id;
                app.address = data.data.address;
                app.profile_url = data.data.profile_url;
                user.getPermission().then(function (data) {
                    if(data.data.permission === 'admin') {
                        app.authorized = true;
                        app.loadme = true
                    } else {
                        app.authorized = false;
                        app.loadme = true;
                    }
                });
            });

        } else {

            app.isLoggedIn = false;
            app.name = '';

            app.loadme = true;
        }
    });


    this.doLogin = function (logData) {
        //console.log(this.logData);
        app.successMsg = '';
        app.errorMsg = '';
        app.loading = true;
        app.expired = false;
        app.disabled = false;

        auth.login(app.logData).then(function (data) {
            //console.log(data);
            //app.loading = true;

            if(data.data.success) {
                app.loading = false;
                app.successMsg = data.data.message + ' Redirecting to home page...';
                $timeout(function () {
                    $location.path('/settings');
                    app.logData = '';
                    app.successMsg = false;
                }, 2000);

            } else {
                app.disabled = false;
                if(data.data.expired) {
                    app.disabled = true;
                    app.loading = false;
                    app.errorMsg = data.data.message;
                    app.expired = data.data.expired;
                } else {
                    app.loading = false;
                    app.errorMsg = data.data.message;
                }
            }
        });
    };

    this.logout = function () {
        auth.logout();
        $location.path('/logout');
        $timeout(function () {
            $location.path('/');
        }, 1000);
    };

});
