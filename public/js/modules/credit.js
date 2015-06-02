define([
    'avalon',
    'jquery'
], function() {
    // 积分规则
    var CREDIT_RULE = {
        'favour'  : 1,
        'comment' : 5,
        'login'   : 5,
        'vote'    : 10,
    }

    var creditVM = avalon.define({
        $id: 'credit',
        toggleCredit: false,
        title: '积分',
        value: '-'
    })

    creditVM.$watch('value', function(value) {
        var maxValue = 9999
        // 格式化积分
        if (typeof value == 'number' && value > maxValue) {
            this.value = maxValue + '+'
        }
        if (isNaN(value)) {
            this.value = '-'
        }
    })

    creditVM.$watch('isUserSignIn', function(value) {
        if (!value) {
            return false
        }
        creditVM.toggleCredit = true
    })

    /**
     * 积分操作
     * @param type 积分规则类型
     * @param opType 操作类型：是增还是减
     */
    creditVM.$watch('creditOperation', function(type, opType) {
        var incValue = CREDIT_RULE[type] || 0
        this.value += (opType ? -incValue : incValue)
    })

    creditVM.$watch('isTodayFirstLogin', function(value) {
        if (!value) {
            return false
        }
        var tpl = [
            '<div class="prompt-credit">',
            '    <img src="images/prompt_credit_signin.png" alt="">',
            '</div>'
        ].join('')
        $('body').append(tpl)
        setTimeout(function() {
            $('.prompt-credit').remove()
        }, 2000)
    })
})
