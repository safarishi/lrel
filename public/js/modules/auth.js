define([
    'text!template/auth-dialog.html',
    'avalon',
    'jquery'
], function(authDialogTpl) {
    var authVM = avalon.define({
        $id: 'auth',
        $authDialogOpt: {
            title: '用户认证'
        },
        setAuthTpl: function() {
            if ($('.auth-dialog').length) {
                return;
            }
            $('.browser-dialog').before(authDialogTpl)
            avalon.scan(null, authVM)
        }
    })

    authVM.$watch('isUserSignIn', function(value) {
        this.setAuthTpl()
    })
})