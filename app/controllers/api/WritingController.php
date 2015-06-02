<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class WritingApiController extends ApiController
{

    public function __construct(Authorizer $authorizer) {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'show' => [
            'id' => 'required',
        ],
        'getWritingsForMobile' => [
//            'point_id' => 'required',
        ],
    ];

    /**
     * 通过作品id获取在线规划作品信息
     *
     * @return string
     */
    public function show() {
        $id = intval(Input::get('id'));
        $writing = Writing::find($id);
        // 判断当前id能否查询到作品信息
        if($writing) {
            if($tmp = Writing::whereRaw('id < ? order by writing_height desc', array($id))->first()) {
                // 上一条数据存在
                $writing->previous_id = $tmp->id;
            }else {
                // todo
            }
            if($tmp = Writing::where('id', '>', $id)->first()) {
                // 下一条数据存在
                $writing->next_id = $tmp->id;
            }else {
                // todo
            }

        }else {
            // 当前id查询不到数据
            return '{"error":"invalid_request","error_description":"The id you request is non exist.","error_code":14001}';
        }
        // 判断用户是否登陆
        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        if(strlen($uid)>0) {
            // 判断用户是否赞了这个作品
            $favours = Favour::select('writing_id')
                ->where('uid', $uid)
                ->get();
            // 存储用户点赞的在线规划作品id的数组
            $tmp_arr = array();
            foreach($favours as $_v) {
                $tmp_arr [] = $_v->writing_id;
            }
            if(in_array($id, $tmp_arr)) {
                // 用户已经赞过这篇作品
                $writing->is_favoured = true;
            }else {
                // 用户没有赞过这篇作品
                $writing->is_favoured = false;
            }

            $star = Star::select('writing_id', 'uid')
                ->where('uid', $uid)
                ->get();

            $tmp_arr_2 = array();
            foreach($star as $_v) {
                $tmp_arr_2 [] = $_v->writing_id;
            }

            if(in_array($id, $tmp_arr_2)) {
                // 用户已经收藏了这篇作品
                $writing->is_starred = true;
            }else {
                // 用户没有收藏过这篇作品
                $writing->is_starred = false;
            }

        }
        return $writing;
    }

    /**
     * 获取某一坐标点的在线作品列表
     *
     * @return mixed
     */
    public function getWritings() {
        return Writing::select('id', 'title', 'author', 'writing_height')
            ->where('location_id', intval(Input::get('point_id')))
            ->orderBy('writing_height', 'desc')
            ->paginate(10);
    }

    /**
     * 手机端在线规划，根据坐标点id或作品所属活动资讯id获得在线作品列表
     *
     * @return mixed
     */
    public function getWritingsForMobile() {
        $point_id         = intval(Input::get('point_id'));
        $activity_info_id = intval(Input::get('activity_info_id'));

        $someWritings = Writing::select('writing.id', 'point_name', 'thumbnail_url', 'title', 'author', 'writing_height', 'number', 'comment')
            ->leftJoin('point', 'writing.location_id', '=', 'point.id');

        if($point_id) {
            $someWritings->where('location_id', $point_id);
        }
        if($activity_info_id) {
            $someWritings->where('ai_id', $activity_info_id);
        }

        return $someWritings
            ->orderBy('writing_height', 'desc')
            ->paginate(6);

    }

}