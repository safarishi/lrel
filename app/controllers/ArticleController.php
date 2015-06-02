<?php

class ArticleController extends Controller {

	/**
	 * Display a listing of the resource.
	 *
	 * @return Response
	 */
	public function index()
	{
        $cid   = intval(Input::get('cid'));
        $pid   = intval(Input::get('pid'));
        $sid   = intval(Input::get('sid'));
        $title = Input::get('title');

        $someArticles = Article::select('id', 'thumbnail_url', 'title', 'description', 'comment');

        if($cid) {
            $someArticles->where('category_id', $cid);
        }
        $ppid = 0;
        if($pid) {
            // 返回坐标点ID所属的父级，即为所在的高度
            if(Point::find($pid)) {
                $ppid = Point::find($pid)->height_id;
            }
            $someArticles->where('location_id', $pid);
        }
        if($sid) {
            $someArticles->where('status_id', $sid);
        }
        if($title) {
            $someArticles->where('title', 'like', '%'.$title.'%');
        }

        $data = $someArticles->orderBy('created_at', 'desc') // 创建时间降序排列
        ->paginate(5);
        $categories = Category::all()->toArray();
        $status = Status::all()->toArray();

        $info = Height::select('id', 'name')->get()->toArray();
        $point_info = Point::select('id', 'height_id', 'point_name')->get()->toArray();

        return View::make('info', array(
            'categories' => $categories,
            'status'     => $status,
            'data'       => $data,
            'sid'        => $sid,
            'cid'        => $cid,
            'pid'        => $pid,
            'info'       => $info,
            'point_info' => $point_info,
            'ppid'       => $ppid,
        ));
	}

    /**
     * 规划资讯-文章详情页
     *
     * @return mixed
     */
    public function show2() {
        $article_id = intval(Input::get('id'));

        $article = Article::findOrFail($article_id)->toArray();

        return View::make('article', array('article' => $article));
    }


	/**
	 * Show the form for creating a new resource.
	 *
	 * @return Response
	 */
	public function create()
	{
		//
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @return Response
	 */
	public function store()
	{
		//
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
		//
	}


	/**
	 * Show the form for editing the specified resource.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function edit($id)
	{
		//
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function update($id)
	{
		//
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		//
	}

}