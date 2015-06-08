<?php

use Rootant\Api\Exception\ApiException;
use LucaDegasperi\OAuth2Server\Authorizer;
use Rootant\Api\Exception\ResourceNonExistentException;

class FollowNoteApiController extends ApiController
{
    public function __construct(Authorizer $authorizer)
    {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
        $this->beforeFilter('oauth', ['except'=>['']]);
        $this->afterFilter('mu_reply_filter', ['only' => ['store']]);
    }

    private static $_validate = [
        'store' => [
            'content' => 'required',
            'pid'     => 'required',
        ],
        'show' => [
            'pid' => 'required',
        ],
        'verify' => [
            'flag' => 'required',
        ],
    ];

    /**
     * 回帖
     *
     * @throws ApiException
     * @throws ResourceNonExistentException
     */
    public function store()
    {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $note_id = Input::get('pid');
        $content = Input::get('content');
        // 判断是否为微大学群组成员
        $member_flag = NoteApiController::isGroupMember($uid, 1);
        if ($member_flag === 2) {
            // 此用户是群组成员
            // 手动开启一个事务
            DB::beginTransaction();
            try {
                $fn = new FollowNote();
                $fn->uid     = $uid;
                $fn->pid     = $note_id;
                $fn->content = $content;
                $fn->save();

                $note = Note::find($note_id);
                $note->comment += 1;
                $note->save();
                // 提交事务
                DB::commit();

                $followNote = FollowNote::select('id','uid', 'created_at', 'content', 'pid')->find($fn->id);
                $followNote->username    = User::find($uid)->username;
                $followNote->user_avatar = User::find($uid)->avatar;

                return $followNote;
            } catch (\Exception $e) {
                // 回滚事务
                DB::rollback();
                throw new ApiException;
            }
        } else {
            throw new ResourceNonExistentException('对不起，您还不能进行评论操作');
        }
    }

    /**
     * 查看评论（跟帖内容，查看某一篇帖子对应的所有跟帖）
     *
     * @throws ResourceNonExistentException
     */
    public function show()
    {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $note_id = Input::get('pid');

        // 判断是否为微大学群组成员
        $member_flag = NoteApiController::isGroupMember($uid, 1);
        if ($member_flag === 2) {
            // 是群组成员
            $someFollowNote = FollowNote::select('id', 'uid', 'created_at', 'content')
                ->where('pid', $note_id)
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            foreach($someFollowNote as $fn) {
                $fn->username    = User::find($fn->uid)->username;
                $fn->user_avatar = User::find($fn->uid)->avatar;
            }

            $admin_flag = NoteApiController::isGroupAdmin($uid, 1);
            $admin_arr = array();
            if ($admin_flag) {
                // 是此群组管理员
                $admin_arr ['is_admin'] =  true;
            } else {
                $admin_arr ['is_admin'] = false;
            }
            return array_merge($admin_arr, $someFollowNote->toArray());
        } else {
            throw new ResourceNonExistentException('对不起，您还没有权限');
        }
    }

    /**
     * 删除微大学某一篇帖子的某一条评论
     *
     * @param $follow_note_id 评论id
     * @return mixed
     * @throws ResourceNonExistentException
     */
    public function del($follow_note_id)
    {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $admin_flag = NoteApiController::isGroupAdmin($uid, 1);
        if (!$admin_flag) {
            $exception = new ResourceNonExistentException('对不起，您没有权限');
            $exception->httpStatusCode = 401;
            throw $exception;
        }

        $followNote = FollowNote::find($follow_note_id);
        if (!$followNote) {
            throw new ResourceNonExistentException('操作失败');
        }

        $followNote->delete();
        $note = Note::find($followNote->pid);
        $note->comment -= 1;
        $note->save();
        // 删除成功
        return Response::make('', 204);
     }

    /**
     * 新申请-列表
     *
     * @return mixed
     * @throws ResourceNonExistentException
     */
     public function applyList()
     {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $ic_group_id = intval(Input::get('ic_group_id'));

        $admin_flag = NoteApiController::isGroupAdmin($uid, $ic_group_id);
        if (!$admin_flag) {
            $exception = new ResourceNonExistentException('对不起，您没有权限');
            $exception->httpStatusCode = 401;
            throw $exception;
        }
        // 返回数据
        $some = DB::table('user_ic_group')
            ->select('id', 'uid', 'reason', 'status_flag', 'created_at')
            ->where('ic_group_id', $ic_group_id)
            ->orderBy('created_at', 'desc')
            ->paginate(6);
        // 组装返回数据
        foreach ($some as $key => $value) {
            $user = User::find($value->uid);
            if ($user) {
                $value->user_avatar = $user->avatar;
                $value->user_name   = $user->username;
                $value->user_email  = $user->email;
            }
        }

        return $some;
     }

    /**
     * 微大学-新申请-同意/拒绝
     *
     * @param $id 用户加入群组数据模型主键id
     * @return mixed
     * @throws ResourceNonExistentException
     */
    public function verify($id)
    {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $admin_flag = NoteApiController::isGroupAdmin($uid, 1);
        if (!$admin_flag) {
            $exception = new ResourceNonExistentException('对不起，您没有权限');
            $exception->httpStatusCode = 401;
            throw $exception;
            // throw new ResourceNonExistentException('对不起，您没有权限');
        }

        $flag = intval(Input::get('flag'));
        if ($flag === 1 || $flag === -1) {
            // flag =  1 同意;flag = -1 拒绝
            $uic_model = UserInterConmuGroup::find($id);
            $uic_model->status_flag = $flag;
            $uic_model->save();
            return $uic_model;
        }
    }

}