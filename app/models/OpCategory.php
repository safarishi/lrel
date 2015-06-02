<?php

class OpCategory extends Eloquent
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'op_category';

    protected $touches = array('type');

    public function type() {
    	return $this->belongsTo('Type'); 
    }

}