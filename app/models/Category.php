<?php

class Category extends Eloquent
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'category';

    protected $touches = array('type');

    public function type() {
        return $this->belongsTo('Type');
    }

    // 表示一个分类中有多篇文章
    public function articles() {
        return $this->hasMany('Article');
    }
}