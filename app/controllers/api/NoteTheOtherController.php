<?php

use LucaDegasperi\OAuth2Server\Authorizer;
use Rootant\Api\Exception\DuplicateOperationException;
use Rootant\Api\Exception\ResourceNonExistentException;
use Rootant\Api\Exception\ValidationException;

class NoteTheOtherApiController extends ApiController
{
	public function __construct(Authorizer $authorizer) {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
        $this->beforeFilter('oauth');
    }

    private static $_validate = [
        'join' => [
            'ic_group_id' => 'required',
            'reason'      => 'required',
        ],
        'showByGid' => [
            'gid' => 'required',
        ],
        'updateTop' => [
            'top_flag' => 'required',
        ],
        'show' => [
            'id' => 'required',
        ],
        'getGroups' => [
            'ic_group_id' => 'required',
        ],
    ];

    /**
     * 查看帖子的内容
     *
     * @throws ResourceNonExistentException
     */
    public function show() {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $id = Input::get('id');

        $note = Note::select('id', 'title', 'content', 'description', 'top', 'gid', 'comment', 'thumbnail_url', 'pic_url', 'created_at')->find($id);

        if (!$note) {
            throw new ResourceNonExistentException('对不起，您请求的资源不存在');
        }

        $note->group_name = Group::find($note->gid)->name;

        // 判断是否为微大学群组成员
        $member_flag = NoteApiController::isGroupMember($uid, 1);
        if ($member_flag === 2) {
            // 是微大学成员
            $admin_flag = NoteApiController::isGroupAdmin($uid, 1);
            if ($admin_flag) {
                // 且为管理员
                $note->is_admin =  true;
            } else {
                $note->is_admin = false;
            }
            return $note;
        } else {
            throw new ResourceNonExistentException('对不起，您还没有权限访问');
        }
    }

    /**
     * 互动交流-用户加入群组
     *
     * @return UserInterConmuGroup 用户加入群组数据模型
     * @throws DuplicateOperationException
     */
    public function join() {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        // 用户即将加入的群组id
        $ic_group_id = Input::get('ic_group_id');
        $reason      = Input::get('reason');

        // 用户为待审核状态
        $tmp = UserInterConmuGroup::whereRaw('uid = ? and ic_group_id = ? and status_flag = 0',
        	array($uid, $ic_group_id))
        	->first();
        if ($tmp) {
        	throw new DuplicateOperationException('您的请求已经提交，请耐心等待审核');
        }
        // 用户为已加入状态
        $tmp_2 = UserInterConmuGroup::whereRaw('uid = ? and ic_group_id = ? and status_flag = 1',
            array($uid, $ic_group_id))
            ->first();
        if ($tmp_2) {
            throw new DuplicateOperationException('您已经加入了该群组');
        }

        $uicg = new UserInterConmuGroup();
        $uicg->uid 		   = $uid;
        $uicg->ic_group_id = $ic_group_id;
        $uicg->reason      = $reason;

        $uicg->save();

        return $uicg;
    }

    /**
     * 用户进入微大学
     *
     * @throws ResourceNonExistentException
     */
    public function getGroups() {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $ic_group_id = intval(Input::get('ic_group_id'));
        if ($ic_group_id === 1) {
            // 判断互动交流-群组为微大学
            $tmp_arr = array(
                'numbers' => Note::where('ic_group_id', 1)->count(),
                'members' => UserInterConmuGroup::whereRaw('ic_group_id = 1 and status_flag = 1')->count(),
            );

            $data = Group::select('id as gid', 'name as group_name')->orderBy('order')->get();

            $returnData = array(
                'data' => $data,
            );
            // 检测当前用户是否为微大学群组成员
            $tmp = NoteApiController::isGroupMember($uid, 1);
            if ($tmp === 2) {
                // 当前用户是微大学群组的成员
                $admin_flag = NoteApiController::isGroupAdmin($uid, 1);
                if ($admin_flag) {
                    // 当前用户同时也是微大学的管理员
                    $tmp_arr ['apply_quantity'] = UserInterConmuGroup::whereRaw('ic_group_id = 1 and status_flag = 0')->count();
                }

                return array_merge($returnData, $tmp_arr);
            } else {
                throw new ResourceNonExistentException('对不起，您还没有权限访问');
            }
        }
    }

    /**
     * 根据微大学组内id
     * 获得一组帖子列表
     *
     * @return mixed
     * @throws ResourceNonExistentException
     */
    public function showByGid() {
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }

        $gid = intval(Input::get('gid'));

        $someNotes = Note::select('id', 'thumbnail_url' , 'top', 'title', 'description', 'comment')
            ->where('gid', $gid)
            ->orderBy('top', 'desc')
            ->orderBy('updated_at', 'desc')
            ->paginate(10);

        $member_flag = NoteApiController::isGroupMember($uid, 1);
        // 判断用户是否为微大学群组成员
        if ($member_flag === 2) {
            // 此用户是微大学群组成员
            if (NoteApiController::isGroupAdmin($uid, 1)) {
                // 且此用户也是管理员
                $admin_arr = array(
                    'is_admin' => true,
                );
            } else {
                $admin_arr = array(
                    'is_admin' => false,
                );
            }
            return array_merge($admin_arr, $someNotes->toArray());
        } else {
            throw new ResourceNonExistentException('对不起，您还没有权限访问');
        }
    }

    /**
     * 微大学-帖子-置顶/取消置顶
     *
     * @param  $note_id 帖子id
     * @throws ResourceNonExistentException
     * @throws ValidationException
     * @return class Note
     */
    public function updateTop($note_id) {
        $uid = $this->authorizer->getResourceOwnerId();
        // 判断是否为管理员
        $admin_flag = NoteApiController::isGroupAdmin($uid, 1);
        if (!$admin_flag) {
            $exception = new ResourceNonExistentException('对不起，您没有权限');
            $exception->httpStatusCode = 401;
            throw $exception;
        }
        // 是管理员
        $top_flag = Input::get('top_flag');
        $note = Note::find(intval($note_id));
        if (!$note) {
            throw new ResourceNonExistentException('对不起，您请求的资源不存在');
        }

        if ($top_flag != '1' && $top_flag != '0') {
            throw new ValidationException('参数传递错误');
        }

        $note->top = $top_flag;
        $note->save();
        // 使用 orm eloquent Note 里面定义的 public $hidden
        $note->hidden = array(
            'gid', 'uid', 'location_id', 'ic_group_id',
            'title', 'subject', 'description', 'type',
            'content', 'comment', 'thumbnail_url',
            'pic_url', 'created_at', 'group');
        return $note;
    }

}
