define([
    'avalon'
], function(){

    var exports = {
        ajax: {
            failedCallback: ajaxFailedCallback
        }
    }

    /**
     * ajax 请求失败时回调
     */
    function ajaxFailedCallback(jqXHR, textStatus, errorThrown) {
        if (errorThrown == 'Unauthorized') {
            avalon.vmodels.root.isUserSignIn = false
            avalon.vmodels.user.userSignOut()
        }
        jqXHR.responseJSON
        && jqXHR.responseJSON.error_description
        && avalon.vmodels.prompt.error(jqXHR.responseJSON.error_description)
    }

    var _qxqbak = window.qxq
    window.qxq = exports
    exports._qxq = _qxqbak

    return exports;
})