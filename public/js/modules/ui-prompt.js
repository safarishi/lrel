define([
    'text!template/prompt.dialog.html',
    'avalon',
    'jquery'
], function(promptTpl) {
    var promptVM = avalon.define({
        $id: 'prompt',
        $promptDialogOpt: {
            container: 'prompt',
            title: '提示',
            type: 'alert',
            zIndex: __DQ__.zIndex.dialog,
            onClose: function() {
                promptVM.togglePrompt = false
            }
        },
        togglePrompt: false,
        title: '提示',
        message: '',
        promptType: 'info',
        showBtns: false,
        reset: function() {
            promptVM.title = '提示'
            promptVM.promptType = 'info'
            var promptDialog = avalon.vmodels.promptDialog
            promptDialog.onConfirm = promptDialog.onOpen = promptDialog.onCancel = avalon.noop
        },
        op: function(type, message, autoClose) {
            if (autoClose !== false) {
                autoClose = autoClose || 3
            }

            promptVM.togglePrompt = true
            promptVM.message = message
            promptVM.promptType = type

            var promptDialog = avalon.vmodels.promptDialog
            avalon.ui.dialog.utils.resetCenter(promptDialog, promptDialog.widgetElement)
            $('.prompt-dialog').css('zIndex', Number(avalon.ui.dialog.utils.getMaxZIndex()) + 1)

            if (promptVM.showBtns === true) {
                promptDialog.type = 'confirm'
            }
            if (promptDialog.type === 'confirm' || promptVM.showBtns === true) {
                autoClose = false
            } else {
                promptDialog.showClose = true
            }
            if (autoClose !== false) {
                setTimeout(function() {
                    promptVM.togglePrompt = false
                }, +autoClose * 1000)
            }
        },
        success: function(message, autoClose) {
            promptVM.op('success', message, autoClose)
        },
        error: function(message, autoClose) {
            promptVM.op('error', message, autoClose)
        },
        warnning: function(message, autoClose) {
            promptVM.op('warnning', message, autoClose)
        },
        info: function(message, autoClose) {
            promptVM.op('info', message, autoClose)
        }
    })

    promptVM.$watch('togglePrompt', function(value) {
        var promptDialog = avalon.vmodels.promptDialog
        promptDialog.toggle = !!value
        if (!!value) {
            var vm = promptDialog.setContent(promptTpl)
            $(vm.widgetElement).find('img').one('load', function() {
                avalon.ui.dialog.utils.resetCenter(vm, vm.widgetElement)
            })
        } else {
            promptVM.reset()
        }
    })

    promptVM.$watch('title', function(title) {
        avalon.vmodels.promptDialog.setTitle(title)
    })
})