<?php

use Illuminate\Auth\UserTrait;
use Illuminate\Auth\UserInterface;
use Illuminate\Auth\Reminders\RemindableTrait;
use Illuminate\Auth\Reminders\RemindableInterface;

class User extends Eloquent implements UserInterface, RemindableInterface {

	use UserTrait, RemindableTrait;

	/**
	 * The database table used by the model.
	 *
	 * @var string
	 */
	protected $table = 'users';

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array('password', 'phone', 'remember_token', 'uuid');

	/**
	 * 头像获取器
	 * @param  string $value original attribute saved in database
	 * @return string        avatar url for request
	 */
	public function getAvatarAttribute($value) {
		if ($value == '/statics/images/avatar/default.jpg') {
			return $value;
		}
		return '/' . Config::get('imagecache::route').'/avatar/' . $value;
	}

}
