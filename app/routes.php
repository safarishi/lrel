<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the Closure to execute when that URI is requested.
|
*/

Route::get('/', function()
{
    // safari.demo-laravel.com
    return 'hello safari';
});

Route::group(array('prefix'=>'api'), function()
{
    // 用户登陆
    Route::post('oauth/access-token', 'OAuthApiController@postAccessToken');
    // Route::post('oauth/access-token', array('after' => 'login_integral', 'uses' => 'OAuthApiController@postAccessToken'));

    Route::put('/user', 'UserApiController@update');
    Route::post('/user/info', 'UserApiController@update');
    Route::post('/user/avatar', 'UserAvatarApiController@store');
    Route::resource('user', 'UserApiController', ['only'=>['index', 'store', 'show', 'update']]);
});