<?php

use Rootant\Api\Exception\ApiException;
use LucaDegasperi\OAuth2Server\Authorizer;
use Rootant\Api\Exception\DuplicateOperationException;
use Rootant\Api\Exception\ResourceNonExistentException;

class OnlinePlanningApiController extends ApiController
{

    public function __construct(Authorizer $authorizer)
    {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
        $this->beforeFilter('oauth', ['except' => ['search', 'lastModifed', 'commentList', 'info', 'comments']]);
        $this->afterFilter('vote_integral', ['only' => ['vote']]);
        $this->afterFilter('fab_integral', ['only' => ['favourAssignmentBook']]);
        $this->afterFilter('cfab_integral', ['only' => ['cancle']]);
        $this->afterFilter('foi_integral', ['only' => ['favour']]);
        // cancle favour op info integral
        $this->afterFilter('cfoi_integral', ['only' => ['cancleFavour']]);
    }

    private static $_validate = [
        'showById'              => [
            'id'                 => 'required',
        ],
        'favourAssignmentBook'  => [
            'assignment_book_id' => 'required',
        ],
        'starredAssignmentBook' => [
            'assignment_book_id' => 'required',
        ],
        'vote'                  => [
            'vote_item_id'       => 'required',
        ],
        'search'                => [
            'cid'        => 'required',
        ],
        'comment'               => [
            'assignment_book_id' => 'required',
            'content'            => 'required',
        ],
        'commentList'           => [
            'assignment_book_id' => 'required',
        ],
        'commentOpInfo'         => [
            'content'            => 'required',
        ],
    ];

    /**
     * 用户
     * 点赞-任务书
     *
     * @return mixed
     */
    public function favourAssignmentBook()
    {
        $uid = $this->authorizer->getResourceOwnerId();

        $abi = Input::get('assignment_book_id');

        $tmp = DB::table('assignment_book_favours')
            ->where('assignment_book_id', $abi)
            ->where('uid', $uid)
            ->first();

        if (!$tmp) {
            $id = DB::table('assignment_book_favours')->insertGetId(
                array(
                    'uid'                => $uid,
                    'assignment_book_id' => $abi,
                    'created_at'         => date('Y-m-d H:i:s', time()),
                    'updated_at'         => date('Y-m-d H:i:s', time()),
                )
            );
            return AssignmentBookFavour::find($id);
        }
    }

    /**
     * 取消点赞-任务书
     *
     */
    public function cancle($id)
    {
        $uid = $this->authorizer->getResourceOwnerId();

        $flag = DB::table('assignment_book_favours')
            ->where('assignment_book_id', $id)
            ->where('uid', $uid)
            ->first();

        if ($flag) {
            $data = AssignmentBookFavour::select('id', 'uid', 'assignment_book_id')->find($flag->id);
            $data->delete();
            return Response::make($data, 200);
        }
    }

    /**
     * 用户
     * 收藏-任务书
     *
     * @return mixed
     */
    public function starredAssignmentBook()
    {
        $abi = Input::get('assignment_book_id');
        // 判断用户是否登陆
        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        if (strlen($uid) > 0) {
            // 用户已经登陆
            $tmp = DB::table('assignment_book_stars')
                ->where('assignment_book_id', $abi)
                ->where('uid', $uid)
                ->first();
            // 判断用户是否已经收藏
            if ($tmp) {
                // 已经收藏，删除记录
                DB::table('assignment_book_stars')
                    ->where('assignment_book_id', $abi)
                    ->where('uid', $uid)
                    ->delete();
                return Response::make('', 204);
            } else {
                $id = DB::table('assignment_book_stars')->insertGetId(
                    array(
                        'uid'                => $uid,
                        'assignment_book_id' => $abi,
                        'created_at'         => date('Y-m-d H:i:s', time()),
                        'updated_at'         => date('Y-m-d H:i:s', time()),
                    )
                );
                return AssignmentBookStar::find($id);
            }
        }
    }

    /**
     * 在线规划-用户投票
     *
     * @throws DuplicateOperationException
     */
    public function vote()
    {
        $vi = Input::get('vote_item_id');
        // 判断用户是否登陆
        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        if (strlen($uid) > 0) {
            // 用户已经登陆
            $tmp = UserVoteItem::whereRaw('uid = ? and vote_item_id = ?', array($uid, $vi))->first();
            if (!$tmp) {
                // 手动开启一个事务
                DB::beginTransaction();
                try {
                    // 存储用户投票信息
                    $uvi = new UserVoteItem();
                    $uvi->uid          = $uid;
                    $uvi->vote_item_id = $vi;
                    $uvi->save();
                    // 更新投票项数据表的投票数+1
                    $voteItem = VoteItem::find($vi);
                    $voteItem->numbers += 1;
                    $voteItem->save();
                    // 提交事务
                    DB::commit();
                    return $uvi;
                    // all good
                } catch (\Exception $e) {
                    // 回滚事务
                    DB::rollback();
                    throw new ApiException;
                    // something went wrong
                }
            } else {
                throw new DuplicateOperationException('您已经投过票了');
            }
        }
    }

    /**
     * 在线规划-搜索
     *
     */
    public function search()
    {
        $title = Input::get('title');
        $cid   = intval(Input::get('cid'));
        // 规划发布 || 规划公示
        if ($cid === 1 || $cid === 4) {
            // todo
            $model = DB::table('op_info')
                ->select('id', 'thumbnail_url', 'title', 'description', 'comment');
        }
        // 规划编制
        if ($cid === 2) {
            $model = DB::table('assignment_book')
                ->select('id', 'thumbnail_url', 'title', 'description', 'comment');
        }
        // 规划评审
        if ($cid === 3) {
            $model = DB::table('vote')
                ->select('id', 'thumbnail_url', 'title', 'description');
        }

        if ($title) {
            $model->where('title', 'like', '%'.$title.'%');
        }

        $model->where('category_id', $cid)->orderBy('created_at', 'desc');
        return $model->paginate(20);
    }

    /**
     * 栏目最后更新时间
     *
     */
    public function lastModifed()
    {
        // 一级栏目
        $type_model        = DB::table('type')->select('id', 'name', 'updated_at')->get();
        // 规划资讯-二级栏目
        $category_model    = DB::table('category')->select('id', 'title as name', 'updated_at')->get();
        // 在线规划-二级栏目
        $op_category_model = DB::table('op_category')->select('id', 'name', 'updated_at')->get();
        // 互动交流-二级栏目
        $ic_groups_model   = DB::table('ic_groups')->select('id', 'name', 'updated_at')->get();
        // 互动交流-微大学-版块栏目
        $group_model       = DB::table('group')->select('id', 'name', 'updated_at')->get();
        // todo

        // 重组返回结果
        foreach ($type_model as $value) {
            switch ($value->id) {
                case 1:
                    // 规划资讯
                    $value->second_menu = $category_model;
                    break;
                case 2:
                    // 在线规划
                    $value->second_menu = $op_category_model;
                    break;
                case 3:
                    // 互动交流
                    foreach ($ic_groups_model as $v) {
                        switch ($v->id) {
                            case 1:
                                // 微大学版块
                                $v->third_menu      = $group_model;
                                $value->second_menu = $ic_groups_model;
                                break;
                            // other case todo
                            default:
                                // todo
                                break;
                        }
                    }
                    break;
                // other case todo
                default:
                    // todo
                    break;
            }
        }
        return $type_model;
    }

    /**
     * 任务书-评论
     *
     */
    public function comment()
    {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $abi     = Input::get('assignment_book_id');
        $content = Input::get('content');
        // 手动开启一个事务
        DB::beginTransaction();
        try {
            // 持久化任务书评论
            $abc_model = new AssignmentBookComment();
            $abc_model->uid = $uid;
            $abc_model->assignment_book_id = $abi;
            $abc_model->content = $content;
            $abc_model->save();
            // 评论成功，任务书对应的被评论数量 +1
            $assignmentBook = AssignmentBook::find($abi);
            $assignmentBook->comment += 1;
            $assignmentBook->save();
            // 提交事务
            DB::commit();
            // 重新拼装返回数据
            $assignmentBookComment = AssignmentBookComment::select('id', 'created_at', 'content')->find($abc_model->id);
            $assignmentBookComment->user_name   = User::find($uid)->username;
            $assignmentBookComment->user_avatar = User::find($uid)->avatar;
            // 返回数据
            return $assignmentBookComment;
            } catch (\Exception $e) {
                // 回滚事务
                DB::rollback();
                throw new ApiException;
            }
    }

    /**
     * 某一任务书的评论列表
     *
     */
    public function commentList()
    {
        $abi = Input::get('assignment_book_id');

        $someABC = AssignmentBookComment::select('id', 'uid', 'created_at', 'content')
            ->where('assignment_book_id', $abi)
            ->orderBy('created_at', 'desc')
            ->paginate(5);

        foreach ($someABC as $key) {
            $uid = $key->uid;
            $key->user_name   = User::find($uid)->username;
            $key->user_avatar = User::find($uid)->avatar;
        }

        return $someABC;
    }

    /**
     * 在线规划-资讯类-详情页
     *
     * @param  int $id 资讯类id
     * @return class OpInfo 咨询类信息
     */
    public function info($id)
    {
        $id = intval($id);

        $opInfo = OpInfo::select('id', 'comment', 'title', 'description', 'content', 'thumbnail_url', 'pic_url', 'created_at')
            ->find($id);
        if (!$opInfo) {
            throw new ResourceNonExistentException("您请求的资源不存在");
        }

        // 判断用户是否已经登陆
        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        if (strlen($uid) <= 0) {
            // 用户未登录
            $opInfo->is_favoured = false;
            $opInfo->is_starred  = false;
        }

        $favour = Favour::whereRaw('uid = ? and op_info_id = ?', array($uid, $id))->first();
        if ($favour) {
            // is_favoured = true; 用户已经点赞了
            $opInfo->is_favoured = true;
        } else {
            $opInfo->is_favoured = false;
        }

        $star = Star::whereRaw('uid = ? and op_info_id = ?', array($uid, $id))->first();
        if ($star) {
            $opInfo->is_starred = true;
        } else {
            $opInfo->is_starred = false;
        }

        return $opInfo;
    }

    /**
     * 收藏在线规划-资讯
     *
     * @param  int $id 资讯id
     * @return class  Star
     */
    public function collect($id)
    {
        $id = intval($id);
        $uid = $this->authorizer->getResourceOwnerId();

        $tmp = DB::table('starred')
            ->where('op_info_id', $id)
            ->where('uid', $uid)
            ->first();

        if ($tmp) {
            throw new DuplicateOperationException('您已收藏');
        }

        $star = new Star();
        $star->uid        = $uid;
        $star->op_info_id = $id;
        $star->save();
        return $star;
    }

    /**
     * 取消收藏在线规划-资讯
     *
     * @param  int $id 资讯id
     */
    public function cancleCollect($id)
    {
        $id  = intval($id);
        $uid = $this->authorizer->getResourceOwnerId();

        $tmp = DB::table('starred')
            ->where('op_info_id', $id)
            ->where('uid', $uid)
            ->first();

        if (!$tmp) {
            throw new ResourceNonExistentException("对不起，资源不存在");
        }

        DB::table('starred')->where('id', $tmp->id)->delete();
        return Response::make('', 204);
    }

    /**
     * 在线规划-资讯类文章-点赞
     *
     * @param  int $id 资讯类id
     */
    public function favour($id)
    {
        $uid = $this->authorizer->getResourceOwnerId();
        $id  = intval($id);

        $tmp = DB::table('favours')
            ->where('op_info_id', $id)
            ->where('uid', $uid)
            ->first();

        if ($tmp) {
            throw new DuplicateOperationException('您已点赞');
        }

        $favour = new Favour();
        $favour->uid        = $uid;
        $favour->op_info_id = $id;
        $favour->save();
        return $favour;
    }

    /**
     * 在线规划-资讯类文章-取消点赞
     *
     * @param  int $id 资讯类id
     */
    public function cancleFavour($id)
    {
        $uid = $this->authorizer->getResourceOwnerId();
        $id  = intval($id);

        $flag = DB::table('favours')
            ->where('op_info_id', $id)
            ->where('uid', $uid)
            ->first();
        if (!$flag) {
            throw new ResourceNonExistentException('对不起，资源不存在');
        }

        $data = Favour::select('id', 'uid', 'op_info_id')->find($flag->id);
        $data->delete();
        return Response::make($data, 200);
    }

    /**
     * 在线规划-评论资讯
     *
     * @param  int $id 资讯id
     */
    public function commentOpInfo($id)
    {
        $uid     = $this->authorizer->getResourceOwnerId();
        $id      = intval($id);
        $content = Input::get('content');

        // 手动开启一个事务
        DB::beginTransaction();
        try {
            // 持久化在线规划资讯评论
            $opInfoComment = new OpInfoComment();
            $opInfoComment->uid = $uid;
            $opInfoComment->op_info_id = $id;
            $opInfoComment->content = $content;
            $opInfoComment->save();
            // 评论成功，在线规划资讯对应的被评论数 +1
            $assignmentBook = OpInfo::find($id);
            $assignmentBook->comment += 1;
            $assignmentBook->save();
            // 提交事务
            DB::commit();
            // 重新拼装返回数据
            $opInfoComment = OpInfoComment::select('id', 'created_at', 'content')->find($opInfoComment->id);
            $user = User::find($uid);
            $opInfoComment->user_name   = $user->username;
            $opInfoComment->user_avatar = $user->avatar;
            // 返回数据
            return $opInfoComment;
            } catch (\Exception $e) {
                // 回滚事务
                DB::rollback();
                throw new ApiException;
            }
    }

    /**
     * 在线规划-某一资讯的评论列表
     *
     * @param  int $id 某一资讯id
     */
    public function comments($id)
    {
        $id = intval($id);

        $someOIC = OpInfoComment::select('id', 'uid', 'created_at', 'content')
            ->where('op_info_id', $id)
            ->orderBy('created_at', 'desc')
            ->paginate(5);

        foreach ($someOIC as $value) {
            $uid  = $value->uid;
            $user = User::find($uid);
            $value->user_name   = $user->username;
            $value->user_avatar = $user->avatar;
        }
        return $someOIC;
    }
}