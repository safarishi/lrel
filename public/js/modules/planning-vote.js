define([
    'text!template/vote.html',
    'avalon',
    'oniui/cookie/avalon.cookie',
    'modules/qxq',
    'jquery'
], function(voteTpl) {
    var voteVM = avalon.define({
        $id: 'votelist',
        voteData: [],
        // 设置投票模板
        setVoteTpl: function() {
            avalon.vmodels.article.toggleComment = false
            avalon.vmodels.article.articleContent = voteTpl
            avalon.vmodels.artScroller.update()
        },
        // 获取投票列表
        getVoteList: function(vid) {
            $.getJSON(APP.api('/vote/items'), {vote_id: vid,access_token: avalon.cookie.get('access_token')}, function(data) {
                voteVM.voteData = data.data
                voteVM.setVoteTpl()
            })
        },
        // 设置投票状态
        setVoteState: function(id, state) {
            $.each(voteVM.voteData, function(index, val) {
                if (val.id == id) {
                    voteVM.voteData[index].vote_state = state
                    voteVM.voteData[index].numbers++
                }
            })
        },
        // 投票动作
        voteItem: function() {
            if (!avalon.vmodels.user.checkSignIn()) {
                return false;
            }
            var id = $(this).data('id')
            $.post(APP.api('/vote/item'), {
                vote_item_id: id,
                access_token: avalon.cookie.get('access_token')
            }, function(data) {
                if (data && data.id) {
                    voteVM.setVoteState(id, true)
                    voteVM.$fire('all!creditOperation', 'vote')
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                qxq.ajax.failedCallback(jqXHR, textStatus, errorThrown)
                if (jqXHR.responseJSON.error_code == 14009) {
                    voteVM.setVoteState(id, true)
                }
            })
        }
    })
})
