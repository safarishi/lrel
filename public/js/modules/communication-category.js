define([
    'text!template/apply-box.html',
    'avalon',
    'jquery',
    'modules/qxq',
    'oniui/cookie/avalon.cookie',
], function(applyTpl) {
    var applyVM = avalon.define({
        $id: 'apply',
        $applyDialogOpt: {
            title: '申请加入',
            zIndex: 200,
            onConfirm: function(ev, vm, r) {
                var text = $.trim($('#apply-text').val())
                var id = avalon.vmodels.college.cateId
                if (!text) {
                    avalon.vmodels.prompt.error('申请内容不能为空！')
                    return false
                }
                $.post(APP.api('/join'), {
                    ic_group_id: id,
                    reason: text,
                    access_token: avalon.cookie.get('access_token')
                }, function(data) {
                    commCategoryVM.getCategoryInfo(id).status = 1
                }).fail(qxq.ajax.failedCallback)
            }
        }
    })

    var commCategoryVM = avalon.define({
        $id: 'commcate',
        categories : [],
        getCategories: function() {
            $.getJSON(APP.api('/ic/groups'), {
                access_token: avalon.cookie.get('access_token')
            }, function(data) {
                // 分组状态
                // 0 不是群组成员
                // 1 待审核状态
                // 2 是群组成员
                commCategoryVM.categories = data
            })
        },
        clickCommMenu: function() {
            var id = $(this).data('id')

            // 仅开通微大学
            if (id != 1) {
                alert('敬请期待！')
                return false
            }

            // 检查是否登录
            if (!avalon.vmodels.user.checkSignIn()) {
                return false
            }

            avalon.vmodels.college.cateId = id

            var info = commCategoryVM.getCategoryInfo(id)

            // 检查是否管理员
            if (!info.is_group_admin) {
                // 检查是否加入该群组
                if (info.status == 0) {
                    $('.browser-dialog').after(applyTpl)
                    avalon.scan(null, avalon.vmodels.root)
                    avalon.vmodels.applyDialog.toggle = true
                    avalon.vmodels.applyDialog.setTitle('立即申请加入' + info.name + '?')
                    return false
                }
                if (info.status == 1) {
                    avalon.vmodels.prompt.info('您已经申请加入该群组，请等待管理员审核！')
                    return false
                }
            }

            avalon.vmodels.college.handleCollege(true)
        },
        getCategoryInfo: function(id) {
            return commCategoryVM.categories.filter(function(element, index) {
                return element.id === id
            })[0]
        }
    })

    commCategoryVM.getCategories()
    commCategoryVM.$watch('isUserSignIn', function(value) {
        commCategoryVM.getCategories()
    })
})
