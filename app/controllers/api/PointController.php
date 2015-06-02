<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class PointApiController extends ApiController
{

    public function __construct(Authorizer $authorizer) {
        $this->authorizer = $authorizer;
//        $this->beforeFilter('oauth');
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'show' => [
            'id' => 'required',
        ],
        'areaInfo' => [
            'height' => 'required',
            'east' => 'required',
            'south' => 'required',
            'west' => 'required',
            'north' => 'required',
            'type_id' => 'required',
            'status_id' => 'required',
        ],
    ];

    /**
     * 获得某一类型该坐标点的内容信息集合
     *
     */
    public function show() {
        $location_id = intval(Input::get('id'));
        $type_id = intval(Input::get('type_id'));

        if ($type_id === 1) { // 资讯规划
            // 获取年代id
            $status_id = intval(Input::get('status_id', 2));
            $articles = Article::whereRaw('location_id = ? and status_id = ?',
                array(
                    $location_id,
                    $status_id,
                )
            )->get();
            foreach ($articles as $article) {
                $article->category_name = Category::find($article->category_id)->title;
            }
            return $articles;
        } elseif ($type_id === 3 ) { // 互动交流
            $someNotes = Note::where('location_id', $location_id)
                ->orderBy('top', 'desc')
                ->orderBy('updated_at', 'desc')
                ->paginate(10);
            foreach($someNotes as $_v) {
                $_v->group_name = Group::find($_v->gid)->name;
            }
            return $someNotes;
        } elseif ($type_id === 2 ) { // 在线规划
            return Writing::where('location_id', $location_id)->paginate(10);
        }

    }

    /**
     * 获得区域内的所有坐标点信息
     *
     * @return mixed
     */
    public function areaInfo() {
        $height = Height::whereRaw('? >= min and ? <= max',
            array(
                Input::get('height'),
                Input::get('height'),
            )
        )->first();
        $height_id = $height->id;
        return Count::select('location_id', 'location_id AS id', 'type_id', 'lng', 'lat', 'num as nums', 'point_name', 'work_num as work_nums')
            ->leftJoin('point', 'count.location_id', '=', 'point.id')
            ->whereRaw('lng >= ? and lng <= ? and lat >= ? and lat <=? and height_id = ? and type_id = ? and status_id = ?',
                array(
                    min(Input::get('west'), Input::get('east')),
                    max(Input::get('west'), Input::get('east')),
                    min(Input::get('south'), Input::get('north')),
                    max(Input::get('south'), Input::get('north')),
                    $height_id,
                    intval(Input::get('type_id')),
                    intval(Input::get('status_id'))
                )
            )->get();

    }
}