<?php

use LucaDegasperi\OAuth2Server\Authorizer;

class UserAvatarApiController extends ApiController {

	public function __construct(Authorizer $authorizer) {
		$this->authorizer = $authorizer;
		$this->beforeFilter('oauth');
		$this->beforeFilter('validation');
	}

	private static $_validate = [
		'store' => [
			// avatar
		]
	];

	/**
	 * Update the specified resource in storage.
	 *
	 * @return Response
	 */
	public function store()
	{
		$id = $this->authorizer->getResourceOwnerId();
		$storagePath = self::uploadAvatar($id);
		$user = User::select('id', 'avatar')->find($id);
		$user->avatar = $storagePath;
		$user->save();
		return $user;
	}

	/**
	 * 上传头像
	 */
	public static function uploadAvatar($id) {
		$subDir = substr($id, -1);
		$ext = 'png';
		$storageDir = Config::get('imagecache::paths.avatar').'/'.$subDir.'/';
		$storageName = $id;
		$storagePath = $subDir.'/'.$storageName.'.'.$ext;
		if (!file_exists($storageDir)) {
			@mkdir($storageDir, 0777, true);
		}
		$img = Image::make(Input::file('avatar'))->encode($ext)->save($storageDir.$storageName.'.'.$ext);
		return $storagePath;
	}
}
