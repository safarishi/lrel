<?php

class InfoApiController extends ApiController
{

    /**
     * 在线规划，根据坐标点坐标获取资讯列表信息
     *
     * @return mixed
     */
    public function show() {
        $point_id = intval(Input::get('point_id'));

        $ai = ActivityInfo::select('id', 'point_id', 'thumbnail_url', 'category_id', 'title', 'description');

        if($point_id) {
            $ai->where('point_id', $point_id);
        }

        $ai->orderBy('created_at', 'desc');

        $article_info = $ai->paginate(7);

        foreach($article_info as $_v) {
            if($point_id)
                $_v->location_name = Point::find($point_id)->point_name;
            $_v->category_name = ActivityInfoCategory::find($_v->category_id)->name;
        }

        return $article_info;
    }

    /**
     * 在线规划-活动资讯-详情页-手机端接口
     *
     * @return mixed
     */
    public function showById() {
        $id = Input::get('id');

        $activity_info = ActivityInfo::select('id', 'category_id', 'comment', 'title', 'created_at', 'thumbnail_url', 'pic_url', 'description')
            ->find(intval($id));

        $uid = '';
        if ($this->accessToken) {
            $uid = $this->authorizer->getResourceOwnerId();
        }
        // 判断用户是否已经登陆
        if(strlen($uid) > 0) {
            $star = Star::where('uid', $uid)->get();
            // 存储用户收藏的活动资讯id数组变量
            $tmp_arr = array();
            foreach($star as $_v) {
                $tmp_arr [] = $_v->activity_info_id;
            }
            if(in_array(intval($id), $tmp_arr, true)) {
                // 用户收藏了这篇活动资讯
                $activity_info->is_starred = true;
            }else {
                $activity_info->is_starred = false;
            }
            return $activity_info;
        }else {
            // 用户没有登陆
            $activity_info->is_starred = false;
            return $activity_info;
        }

    }

    /**
     * 根据活动资讯id查询
     * 在线规划-活动资讯-参与作品-手机端接口
     *
     * @return mixed
     */
    public function showByAiId() {
        $ai_id = intval(Input::get('ai_id'));

        $someWritings = DB::table('writing')
            ->select('id', 'thumbnail_url', 'title', 'comment', 'author', 'writing_height', 'number')
            ->where('ai_id', $ai_id)
            ->paginate(5);

        return $someWritings;
    }
    // 获取在线规划，活动资讯详情页
    public function showById_bak() {
        $id = Input::get('id');

        return ActivityInfo::select('category_id', 'title', 'created_at', 'thumbnail_url', 'pic_url', 'description');
    }


}