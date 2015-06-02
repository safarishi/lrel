<?php

class Note extends Eloquent
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table   = 'note';
    // 定义隐藏域
    public $hidden = array('');

    protected $touches = array('group');

    public function group() {
        return $this->belongsTo('Group', 'gid', 'id');
    }

}