<?php

class Article extends Eloquent
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'article';

    public function category() {
        return $this->belongsTo('Category');
    }
}