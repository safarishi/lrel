define([
    'avalon',
    'jquery',
    'modules/qxq',
    'modules/planning-category',
    'domReady!'
], function() {
    var planVM = avalon.define({
        $id: 'planning',
        $skipArray: ['getPlanList'],
        pointId: '',
        toggleList: false,
        toggleDetail: false,
        togglePlanClose: false,
        planList: [],
        planId: '',
        title: '',
        author: '',
        thumbnail_url: '',
        description: '',
        writing_height: '',
        number: '',
        getPlanList: function() {
            $.ajax({
                url: APP.api('/writings'),
                type: 'GET',
                dataType: 'json',
                data: {point_id: planVM.pointId}
            })
            .done(function(data) {
                planVM.planList = data.data
            })
        },
        getPlanItem: function(id) {
            $.ajax({
                url: APP.api('/writing'),
                type: 'GET',
                dataType: 'json',
                data: {id: id},
            })
            .done(function(data) {
                if (data && data.id) {
                    ['title', 'author', 'number', 'writing_height', 'description', 'thumbnail_url'].forEach(function(item, idx) {
                        planVM[item] = data[item]
                    })
                    planVM.planId = data.id
                }
                planVM.toggleDetail = true
            })
            .fail(qxq.ajax.failedCallback)
        },
        handlePlanDetail: function(toggle) {
            planVM.toggleDetail = toggle && !!toggle || !planVM.toggleDetail
        },
        handlePlanBox: function(toggle) {
            planVM.toggleList = true
        },
        handlePlan: function(pn) {
            function animate(direction) {
                $('.planning-detail-box').addClass('flipIn' + direction + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
                    $(this).removeClass('flipIn' + direction + ' animated')
                })
            }
            var planId;
            var idx = $('.planning-box').find('[data-id="'+planVM.planId+'"]').index()
            if (pn === 'prev') {
                idx++
                dir = 'Up'
            } else if (pn === 'next') {
                idx--
                dir = 'Down'
            }
            planId = $('.planning-box').find('.mod').eq(idx).data('id')
            if (!planId) {
                return;
            }
            planVM.planId = planId
            planVM.getPlanItem(planId)
            animate(dir)
        },
        closePlanning: function() {
            planVM.toggleList = false
            planVM.toggleDetail = false
        }
    })

    planVM.$watch('pointId', function(point) {
        if (this.toggleList || this.toggleDetail) {
            planVM.getPlanList()
        }
    })
})