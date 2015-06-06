<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class CommentApiController extends ApiController
{
    public function __construct(Authorizer $authorizer) {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
        $this->beforeFilter('oauth', ['only' => ['store', 'favour', 'cancleFavour']]);
        $this->afterFilter('article_comment_integral', ['only' => 'store']);
        // favour article comment integral
        $this->afterFilter('fac_integral', ['only' => 'favour']);
        // cancle favour article comment integral
        $this->afterFilter('cfac_integral', ['only' => 'cancleFavour']);
    }

    private static $_validate = [
        'store' => [
            'aid'     => 'required',
            'content' => 'required',
        ],
        'del' => [
            //
        ]
    ];

    /**
     * 规划资讯-文章评论
     *
     * @throws ApiException
     */
    public function store() {
        $content = Input::get('content');
        $aid     = intval(Input::get('aid'));

        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        // 手动开启一个事务
        DB::beginTransaction();
        try {
        // DB::insert(...);
            $id = DB::table('comment')->insertGetId(
                array(
                    'uid'               => $uid,
                    'aid'               => $aid,
                    'content'           => $content,
                    // 存储创建时间
                    'created_at'        => date('Y-m-d H:i:s'),
                    'updated_at'        => date('Y-m-d H:i:s'),
                )
            );
        // DB::update(...);
            if($id) {
                // 更新规划资讯数据表的对应的评论数目加一
                DB::table('article')->where('id', $aid)
                    ->update(
                        array('comment' => ++Article::find($aid)->comment)
                    );
            }
            // 提交事务
            DB::commit();
            // all good
            $comment = Comment::find($id);
            $comment->user_name       = User::find($comment->uid)->name;
            $comment->user_avatar     = User::find($comment->uid)->avatar;
            // 返回该评论被赞的次数
            $comment->comment_favours = Favour::where('comment_id', $id)->count();

            return $comment;
        } catch (\Exception $e) {
            // 回滚事务
            DB::rollback();
            throw new ApiException;
            // something went wrong
        }
    }

    /**
     * 获得某一篇文章对应的所有评论
     *
     * @return mixed
     */
    public function show() {
        $aid = intval(Input::get('aid'));

        $someComments = DB::table('comment')
            ->select('id', 'uid', 'content', 'created_at')
            ->where('aid', $aid)
            ->orderBy('created_at', 'desc')
            ->paginate(4);

        }

        //     $user = User::find($_v->uid);
        //     $_v->user_name       = $user->username;
        //     $_v->user_avatar     = $user->avatar;
        //     $_v->comment_favours = Favour::where('comment_id', $_v->id)->count();
        return $someComments;
    }

    /**
     * 评论某一在线作品
     *
     * @return mixed
     */
    public function commentWriting() {
        $wc         = Input::get('writing_comment');
        $writing_id = intval(Input::get('writing_id'));
        // 判断用户是否已经登陆
        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        if(strlen($uid) > 0) {
            // 用户已经登陆
            $id = DB::table('comment')->insertGetId(
                array(
                    'uid'               => intval($uid),
                    'writing_id'        => $writing_id,
                    'writing_comment'   => $wc,
                    // 存储创建时间
                    'created_at'        => date('Y-m-d H:i:s', time()),
                )
            );
            if($id) {
                // 更新作品表的对应作品的评论数目加一
                DB::table('writing')->where('id', $writing_id)
                    ->update(
                        array('comment' => ++Writing::find($writing_id)->comment)
                    );
            }
            return Comment::find($id);
        }else {
            // 用户没有登陆
            return Response::json(array('Information' => 'You Are not Login!'));
        }

    }

    /**
     * 规划资讯-文章评论-点赞
     *
     * @return mixed
     */
    public function favour() {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $cid  = intval(Input::get('comment_id'));

        $nums = Favour::whereRaw('comment_id = ? and comment_is_favoured = 1', array($cid))->count();

        $favour = DB::table('favours')
            ->whereRaw('uid = ? and comment_id = ?', array($uid, $cid))
            ->first();
        // 判断用户是否点赞过这篇评论
        if (!$favour) {
            // 赞评论
            $id = DB::table('favours')->insertGetId(
                array(
                    'uid'        => $uid,
                    'comment_id' => $cid,
                    'created_at' => date('Y-m-d H:i:s', time()),
                )
            );
            $data = Favour::select('id', 'uid', 'comment_id')->find($id);
            $data->comment_favours = ++$nums;
            return $data;
        }
    }

    /**
     * 规划资讯-文章评论-取消点赞
     *
     * @return mixed
     */
    public function cancleFavour() {
        $uid = $this->authorizer->getResourceOwnerId();

        $cid  = intval(Input::get('comment_id'));

        $nums = Favour::whereRaw('comment_id = ? and comment_is_favoured = 1', array($cid))->count();

        $favourComment = DB::table('favours')
            ->where('comment_id', $cid)
            ->where('uid', $uid)
            ->first();

        if ($favourComment) {
            $favour = Favour::select('id', 'uid', 'comment_id')->find($favourComment->id);
            $favour->comment_favours = --$nums;
            $favour->delete();
            return $favour;
        }
    }

}