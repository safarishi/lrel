<?php

use LucaDegasperi\OAuth2Server\Authorizer;
use Rootant\Api\Exception\ResourceNonExistentException;

class OnlinePlanningTheOtherApiController extends ApiController
{
    public function __construct(Authorizer $authorizer)
    {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
//        $this->beforeFilter('oauth');
    }

    private static $_validate = [
        'showById'      => [
            'id'          => 'required',
        ],
        'show'          => [
            'category_id' => 'required',
        ],
        'showVotes'     => [
            'category_id' => 'required',
        ],
        'showVoteItems' => [
            'vote_id'     => 'required',
        ],
    ];

    /**
     * 获取
     * 在线规划-投票列表
     *
     * @return mixed
     */
    public function showVotes()
    {
        $cid = Input::get('category_id');

        return Vote::where('category_id', $cid)
            ->select('id', 'thumbnail_url', 'title', 'description')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * 获取
     * 在线规划-任务书/资讯-列表
     *
     * @return mixed
     */
    public function show()
    {
        // 获取请求参数类别id
        $cid = intval(Input::get('category_id'));

        if ($cid === 2) {
            // 表示规划编制
            return DB::table('assignment_book')
                ->select('id', 'thumbnail_url', 'title', 'description', 'comment')
                ->where('category_id', $cid)
                ->orderBy('created_at', 'desc')
                ->paginate(15);
        }

        if ($cid === 1 || $cid === 4) {
            // 分别表示规划发布 || 规划公示
            return DB::table('op_info')
                ->select('id', 'thumbnail_url', 'title', 'description', 'comment')
                ->where('category_id', $cid)
                ->orderBy('created_at', 'desc')
                ->paginate(15);
        }
    }

    /**
     * 在线规划-类别列表
     *
     * @return mixed
     */
    public function showList()
    {
        return DB::table('op_category')
            ->select('id', 'name')
            ->get();
    }

    /**
     * 在线规划-任务书-详情页
     *
     * @return mixed
     * @throws ResourceNonExistentException
     */
    public function showById()
    {
        // 获取请求参数
        $id = intval(Input::get('id'));

        $tmp = AssignmentBook::find($id);
        if (!$tmp) {
            throw new ResourceNonExistentException("您请求的资源不存在");
        }

        $assignmentBook = AssignmentBook::select('id', 'comment', 'title', 'description', 'content', 'thumbnail_url', 'pic_url', 'a_url', 'created_at')
            ->find($id);

        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        // 判断是否被点赞、收藏
        $abFavour = AssignmentBookFavour::whereRaw('uid = ? and assignment_book_id = ?', array($uid, $id))->first();
        $abStar   =   AssignmentBookStar::whereRaw('uid = ? and assignment_book_id = ?', array($uid, $id))->first();
        if ($abFavour) {
            // 用户已点赞
            $assignmentBook->is_favoured = true;
        } else {
            $assignmentBook->is_favoured = false;
        }
        if ($abStar) {
            $assignmentBook->is_starred  = true;
        } else {
            // 用户未收藏
            $assignmentBook->is_starred  = false;
        }
        // 返回数据
        return $assignmentBook;
    }

    /**
     * 在线规划-投票项-列表
     *
     * @return mixed
     */
    public function showVoteItems()
    {
        $vote_id    = Input::get('vote_id');
        $vote       = Vote::find($vote_id);
        $vote2Arr   = $vote->toArray();
        $vote_title = $vote2Arr['title'];
        $vote_time  = $vote2Arr['created_at'];

        $someVoteItem = VoteItem::where('vote_id', $vote_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        $userVoteItem = UserVoteItem::where('uid', $uid)->get();
        // 声明一个数组变量存储用户投过票的投票项id
        $tmp_arr      = array();
        foreach ($userVoteItem as $_v) {
            $tmp_arr [] = $_v->vote_item_id;
        }
        foreach ($someVoteItem as $voteItem) {
            $vote_item_id = $voteItem->id;
            if (in_array($vote_item_id, $tmp_arr, true)) {
                $voteItem->vote_state =  true;
            } else {
                $voteItem->vote_state =  false;
            }
        }
        $tmp_arr2 = array('vote_title' => $vote_title, 'vote_time' => $vote_time);
        return array_merge($tmp_arr2, $someVoteItem->toArray());
    }
}