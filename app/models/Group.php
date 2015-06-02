<?php

class Group extends Eloquent
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'group';

    protected $touches = array('icGroups');

    public function icGroups() {
		return $this->belongsTo('InterConmuGroup', 'ic_group_id');
    }


    public function notes() {
        return $this->hasMany('Note');
    }

}