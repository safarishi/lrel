<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class ArchiveApiController extends ApiController
{

    public function __construct(Authorizer $authorizer) {
        parent::__construct($authorizer);
        $this->beforeFilter('validation');
    }

    private static $_validate = [
        'showById' => [
            'id' => 'required',
        ],
    ];

    /**
     * 分页获取所有公文
     *
     * @return mixed
     */
    public function show() {
        return Archive::select('id', 'title', 'created_at', 'verify_status_flag')
            ->orderBy('created_at', 'desc')
            ->paginate(10);
    }

    /**
     * 获取某一篇公文的具体内容
     *
     * @return mixed
     */
    public function showById() {
        $id = intval(Input::get('id'));
        return Archive::select('id', 'title', 'content', 'created_at', 'verify_status_flag')
            ->find($id);
    }



}