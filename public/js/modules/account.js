define([
    'text!template/account-dialog.html',
    'avalon',
    'jquery',
    'modules/qxq'
], function(accountTpl) {
    var accountVM = avalon.define({
        $id: 'account',
        $accountDialogOpt: {
            title: '帐号设置'
        },
        activeTab: 0,
        setAccTpl: function() {
            if ($('.account-dialog').length) {
                return;
            }
            $('.browser-dialog').before(accountTpl)
            avalon.scan(null, accountVM)
            accountVM.bindUploader()
        },
        toggleActive: function(idx) {
            var dialog = avalon.vmodels.accountDialog
            accountVM.activeTab = idx || 0
            avalon.ui.dialog.utils.resetCenter(dialog, dialog.widgetElement)
        },
        bindUploader: function() {
            var fReader = new FileReader(), fFilter = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;
            fReader.onload = function (FREvent) {
              document.getElementById("upload-preview").src = FREvent.target.result;
            }
            $('#upload-avatar').on('change', function(e) {
                var input = document.getElementById("upload-avatar")
                if (input.files.length === 0) {
                    return;
                }
                var file = input.files[0]
                if (!fFilter.test(file.type)) {
                    avalon.vmodels.prompt.error("请选择正确的图像格式！")
                    return;
                }
                if (file.size > 500 * 1024) {
                    avalon.vmodels.prompt.error("图像太大了！请选择小于500K的图片！")
                    return;
                }
                fReader.readAsDataURL(file);
            })
        },
        updateInfo: function(e) {
            e.preventDefault()
            var form = $('#form-info')
            var btn = form.find('[type="submit"]')
            var input = document.getElementById("upload-avatar")
            var param = form.serializeArray()
            var fd = new FormData(document.forms.namedItem("form-info"))
            $.ajax({
                url: APP.api('/user/info'),
                type: 'POST',
                contentType: false,
                processData: false,
                dataType: 'json',
                data: fd,
                beforeSend: function (xhr)
                {
                    btn.attr('disabled', true)
                    xhr.setRequestHeader("Authorization", avalon.cookie.get('access_token'));
                }
            })
            .done(function(data) {
                if (data && data.id) {
                    avalon.vmodels.user.updateUserInfo(data)
                    avalon.vmodels.prompt.success('修改成功！')
                }
            })
            .fail(qxq.ajax.failedCallback)
            .always(function() {
                btn.attr('disabled', false)
            })
            return false
        },
        // 修改密码
        updatePassword: function(e) {
            e.preventDefault()
            var param = $('#form-password').serializeArray()
            param.push({
                name: 'access_token',
                value: avalon.cookie.get('access_token')
            })
            $.ajax({
                url: APP.api('/password'),
                type: 'PUT',
                dataType: 'json',
                data: $.param(param),
            })
            .done(function(data) {
                $('#form-password input').val('')
                avalon.vmodels.prompt.success('修改成功！')
            })
            .fail(qxq.ajax.failedCallback)
            return false
        }
    })

    accountVM.$watch('isUserSignIn', function(value) {
        this.setAccTpl()
    })
})