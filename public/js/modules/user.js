define([
    'avalon',
    'modules/qxq',
    'oniui/cookie/avalon.cookie',
    'modules/auth',
    'modules/account',
    'modules/credit'
], function() {
    var userVM = avalon.define({
        $id: 'user',
        uid: null,
        username: null,
        nickname: null,
        avatar: null,
        gender: null,
        org: null,
        position: null,
        userSignOut: function() {
            avalon.vmodels.root.isUserSignIn = false
            avalon.vmodels.root.toggleUserNav = false
            var skipProps = userVM.$skipArray || []
            var props = Object.keys(avalon.vmodels.user)
            props.forEach(function(element, index){
                if (
                    typeof(userVM[element]) !== 'function' &&
                    skipProps.indexOf(element) == -1 &&
                    element.charAt(0) !== '$'
                ) {
                    userVM[element] = null
                }
            })
            avalon.cookie.remove('access_token')
            avalon.cookie.remove('refresh_token')

            avalon.vmodels.accountDialog && (avalon.vmodels.accountDialog.toggle = false)
        },
        getUserInfo: function() {
            $.ajax({
                url: APP.api('/user'),
                type: 'GET',
                dataType: 'json',
                data: {access_token: avalon.cookie.get('access_token')}
            })
            .done(function(data) {
                avalon.vmodels.root.isUserSignIn = true
                userVM.uid = data.uid
                userVM.updateUserInfo(data)
            })
            .fail(qxq.ajax.failedCallback)
        },
        updateUserInfo: function(data) {
            var props = Object.keys(avalon.vmodels.user)
            props.forEach(function(element, index){
                if (element == 'avatar') {
                    data[element] += '?timestamp=' + $.now()
                }
                if (data[element]) {
                    userVM[element] = data[element]
                }
            })
            var creditVM = avalon.vmodels.credit
            if (creditVM) {
                creditVM.value = data && +data.integral
            }
        },
        showUserInfo: function() {
            var accountVM = avalon.vmodels.account
            accountVM.activeTab = 1
            avalon.vmodels.accountDialog.toggle = true
        },
        checkSignIn: function() {
            if (!avalon.vmodels.root.isUserSignIn) {
                avalon.vmodels.prompt.info('请先登录！')
                avalon.vmodels.root.showSignInDialog()
                avalon.vmodels.signDialog.toggle = true
            }
            return avalon.vmodels.root.isUserSignIn
        }
    })

    userVM.$watch('isUserSignIn', function(value) {
        if (!!value) {
            userVM.getUserInfo()
        } else {
            userVM.userSignOut()
        }
    })
})
