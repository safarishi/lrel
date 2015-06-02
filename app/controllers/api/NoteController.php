<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class NoteApiController extends ApiController {
    // 不是群组成员
    const NON_GROUP_MEMBER = 0;
    //  待审核状态
    const PENDING          = 1;
    //  是群组成员
    const IS_GROUP_MEMBER  = 2;

    public function __construct(Authorizer $authorizer) {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'joinGroup' => [
            'gid' => 'required',
        ],
    ];

    /**
     * 用户加入:微大学-群组
     *
     * @return UserGroup
     */
    public function joinGroup() {
        // 判断用户加入的微大学群组人数是否已满
        $group_user_nums = UserGroup::all()->count();
        if($group_user_nums > 200) {
            // 群组人数已满
            return Response::json(array('Information' => 'This group\'s numbers of users is full'));
        }
        $gid = intval(Input::get('gid'));
        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        if(strlen($uid)>0) {
            // 用户已经登录
            $user_group_info = UserGroup::where('uid', $uid)->get();
            // $user_join_gids 数组存储此用户所加入的所有:微大学-群组的id信息
            $user_join_gids  = array();
            foreach($user_group_info as $_v) {
                $user_join_gids [] = $_v->gid;
            }
            if(in_array($gid, $user_join_gids)) {
                // 表示用户已经加入了此群组
                return Response::json(array('Information' => 'Your Are Already Joined This Group!'));
            }else {
                $user_group = new UserGroup;
                $user_group->uid = $uid;
                $user_group->gid = $gid;
                $user_group->save();
                // 用户加入群组成功对应的群组的人数加一
                $nums = Group::find($gid)->member;
                DB::table('group')
                    ->where('id', $gid)
                    ->update(array('member' => ++$nums));

                $user_group->group_name = Group::find($gid)->name;
                return $user_group;
            }
        }else {
            return Response::json(array('Information' => 'Your Are Not Login!'));
        }
    }

    /**
     * 获得某一用户所加入的所有:微大学-群组
     *
     * @return mixed
     */
    public function getUserJoinedGroups() {
        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        if(strlen($uid) === 0) {
            return Response::json(array('Information' => 'Your Are Not Login!'));
        }
        // 用户已经登录
        $user_group = UserGroup::where('uid', $uid)->get();
        foreach($user_group as $_v) {
            $_v->group_name = Group::find($_v->gid)->name;
        }
        return $user_group;
    }

    /**
     * 判断用户是否加入微大学群组
     *
     * @return mixed
     */
    public function isJoin() {
        // 图标logo
        $icon_url  = DB::table('group')->first()->icon;
        // 帖子数量
        $note_nums = DB::table('note')->count();
        $members   = intval(DB::table('group')->sum('member'));

        if ($this->accessToken) {
            $uid = intval($this->authorizer->getResourceOwnerId());
            $user_group = UserGroup::whereRaw('uid = ? and gid = 1', array($uid))->first();
            if($user_group) {
                return Response::json(array(
                    'icon'      => $icon_url,
                    'note_nums' => $note_nums,
                    'members'   => $members,
                    'is_join'   => true
                ));
            }else {
                return Response::json(array(
                    'icon'      => $icon_url,
                    'note_nums' => $note_nums,
                    'members'   => $members,
                    'is_join'   => false
                ));
            }
        }

    }

    //
    public function showGroups() {
        $height = Height::whereRaw('? >= min and ? <= max',
            array(
                Input::get('height'),
                Input::get('height'),
            )
        )->first();

        $height_id = $height->id;

        $points = Group::whereRaw('lng >= ? and lng <= ? and lat >= ? and lat <=? and location_id = ?',
            array(
                min(Input::get('west'), Input::get('east')),
                max(Input::get('west'), Input::get('east')),
                min(Input::get('south'), Input::get('north')),
                max(Input::get('south'), Input::get('north')),
                $height_id,
            )
        )->get();

        foreach ($points as $key => $value) {
            $value->latest = Note::find($value->id);

            $value->isJoin = 0;
            $value->type_id = 3;
            if ($this->accessToken) {
                $uid = $this->authorizer->getResourceOwnerId();
                if(strlen($uid) !== 0) {
                    if(UserGroup::whereRaw('uid = ? and gid = ?', array( $uid, $value->id))->first()){
                        $value->isJoin = 1;
                    }
                }
            }
        }
        return $points;
    }

    /**
     * 互动交流-群组-列表
     *
     * @return mixed
     */
    public function icGroups() {
        // 互动交流-群组-数据模型
        $icg = InterConmuGroup::all();

        foreach ($icg as $key => $value) {
            $ic_group_id = $value->id;
            // 存储群组里内容的数量，类似帖子或者文章，但是是统一的东西
            $value->numbers = DB::table('note')->where('ic_group_id', $ic_group_id)->count();
            // 判断用户是否登陆
            $uid = '';
            if ($this->accessToken) {
                $uid = $this->authorizer->getResourceOwnerId();
            }
            if (strlen($uid) > 0) {
                $admin_flag = NoteApiController::isGroupAdmin($uid, $ic_group_id);
                if (!$admin_flag) {
                    $value->is_group_admin = false;
                    // 不是群组管理员
                    $value->status = NoteApiController::isGroupMember($uid, $ic_group_id);
                } else {
                    $value->is_group_admin = true;
                    $value->apply_quantity = DB::table('user_ic_group')->whereRaw('ic_group_id = ? and status_flag = 0', array($ic_group_id))->count();
                }
            } else {
                // 用户未登录，所有群组均显示为可加入的状态，待后续判断
                $value->status = 0;
            }
        }
        return $icg;
    }

    /**
     * 判断某一用户是否为某一群组里的成员
     *
     * @param $uid         用户id
     * @param $ic_group_id 群组id
     * @return int
     */
    public static function isGroupMember($uid, $ic_group_id) {
        $uic = new UserInterConmuGroup();

        if (!$uic->whereRaw('uid = ? and ic_group_id = ?', array($uid, $ic_group_id))->first()) {
            return NoteApiController::NON_GROUP_MEMBER;
        }

        $tmp = $uic->whereRaw('uid = ? and ic_group_id = ? and status_flag = 0', array($uid, $ic_group_id))->first();
        if ($tmp) {
            return NoteApiController::PENDING;
        }

        $tmp_2 = $uic->whereRaw('uid = ? and ic_group_id = ? and status_flag = 1', array($uid, $ic_group_id))->first();
        if ($tmp_2) {
            return NoteApiController::IS_GROUP_MEMBER;
        }
    }

    /**
     * 判断某一用户是否为某一群组管理员
     *
     * @param $uid         用户id
     * @param $ic_group_id 群组id
     * @return bool
     */
    public static function isGroupAdmin($uid, $ic_group_id) {
        $aic = new AdminInterConmuGroup();

        if (!$aic->where('uid', $uid)->first()) {
            return false;
        }

        if (!$aic->whereRaw('uid = ? and ic_group_id = ?', array($uid, $ic_group_id))->first()) {
            return false;
        }

        return true;
    }

}
