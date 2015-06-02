/*
Navicat MariaDB Data Transfer

Source Server         : supdri
Source Server Version : 50540
Source Host           : 192.168.0.35:3306
Source Database       : supdri_qxqy

Target Server Type    : MariaDB
Target Server Version : 50540
File Encoding         : 65001

Date: 2015-01-28 14:39:57
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for qxq_migrations
-- ----------------------------
DROP TABLE IF EXISTS `qxq_migrations`;
CREATE TABLE `qxq_migrations` (
  `migration` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_access_token_scopes
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_access_token_scopes`;
CREATE TABLE `qxq_oauth_access_token_scopes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `access_token_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `scope_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `oauth_access_token_scopes_access_token_id_index` (`access_token_id`) USING BTREE,
  KEY `oauth_access_token_scopes_scope_id_index` (`scope_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_access_token_scopes_ibfk_1` FOREIGN KEY (`access_token_id`) REFERENCES `qxq_oauth_access_tokens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `qxq_oauth_access_token_scopes_ibfk_2` FOREIGN KEY (`scope_id`) REFERENCES `qxq_oauth_scopes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_access_tokens
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_access_tokens`;
CREATE TABLE `qxq_oauth_access_tokens` (
  `id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `session_id` int(10) unsigned NOT NULL,
  `expire_time` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `oauth_access_tokens_id_session_id_unique` (`id`,`session_id`) USING BTREE,
  KEY `oauth_access_tokens_session_id_index` (`session_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_access_tokens_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `qxq_oauth_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_auth_code_scopes
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_auth_code_scopes`;
CREATE TABLE `qxq_oauth_auth_code_scopes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `auth_code_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `scope_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `oauth_auth_code_scopes_auth_code_id_index` (`auth_code_id`) USING BTREE,
  KEY `oauth_auth_code_scopes_scope_id_index` (`scope_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_auth_code_scopes_ibfk_1` FOREIGN KEY (`auth_code_id`) REFERENCES `qxq_oauth_auth_codes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `qxq_oauth_auth_code_scopes_ibfk_2` FOREIGN KEY (`scope_id`) REFERENCES `qxq_oauth_scopes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_auth_codes
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_auth_codes`;
CREATE TABLE `qxq_oauth_auth_codes` (
  `id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `session_id` int(10) unsigned NOT NULL,
  `redirect_uri` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `expire_time` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `oauth_auth_codes_session_id_index` (`session_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_auth_codes_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `qxq_oauth_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_client_endpoints
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_client_endpoints`;
CREATE TABLE `qxq_oauth_client_endpoints` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `redirect_uri` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `oauth_client_endpoints_client_id_redirect_uri_unique` (`client_id`,`redirect_uri`) USING BTREE,
  CONSTRAINT `qxq_oauth_client_endpoints_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `qxq_oauth_clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_client_grants
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_client_grants`;
CREATE TABLE `qxq_oauth_client_grants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `grant_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `oauth_client_grants_client_id_index` (`client_id`) USING BTREE,
  KEY `oauth_client_grants_grant_id_index` (`grant_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_client_grants_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `qxq_oauth_clients` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `qxq_oauth_client_grants_ibfk_2` FOREIGN KEY (`grant_id`) REFERENCES `qxq_oauth_grants` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_client_scopes
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_client_scopes`;
CREATE TABLE `qxq_oauth_client_scopes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `scope_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `oauth_client_scopes_client_id_index` (`client_id`) USING BTREE,
  KEY `oauth_client_scopes_scope_id_index` (`scope_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_client_scopes_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `qxq_oauth_clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `qxq_oauth_client_scopes_ibfk_2` FOREIGN KEY (`scope_id`) REFERENCES `qxq_oauth_scopes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_clients
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_clients`;
CREATE TABLE `qxq_oauth_clients` (
  `id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `secret` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `oauth_clients_id_secret_unique` (`id`,`secret`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_grant_scopes
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_grant_scopes`;
CREATE TABLE `qxq_oauth_grant_scopes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `grant_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `scope_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `oauth_grant_scopes_grant_id_index` (`grant_id`) USING BTREE,
  KEY `oauth_grant_scopes_scope_id_index` (`scope_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_grant_scopes_ibfk_1` FOREIGN KEY (`grant_id`) REFERENCES `qxq_oauth_grants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `qxq_oauth_grant_scopes_ibfk_2` FOREIGN KEY (`scope_id`) REFERENCES `qxq_oauth_scopes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_grants
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_grants`;
CREATE TABLE `qxq_oauth_grants` (
  `id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_refresh_tokens
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_refresh_tokens`;
CREATE TABLE `qxq_oauth_refresh_tokens` (
  `id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `access_token_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `expire_time` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`access_token_id`),
  UNIQUE KEY `oauth_refresh_tokens_id_unique` (`id`) USING BTREE,
  CONSTRAINT `qxq_oauth_refresh_tokens_ibfk_1` FOREIGN KEY (`access_token_id`) REFERENCES `qxq_oauth_access_tokens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_scopes
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_scopes`;
CREATE TABLE `qxq_oauth_scopes` (
  `id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_session_scopes
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_session_scopes`;
CREATE TABLE `qxq_oauth_session_scopes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` int(10) unsigned NOT NULL,
  `scope_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `oauth_session_scopes_session_id_index` (`session_id`) USING BTREE,
  KEY `oauth_session_scopes_scope_id_index` (`scope_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_session_scopes_ibfk_1` FOREIGN KEY (`scope_id`) REFERENCES `qxq_oauth_scopes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `qxq_oauth_session_scopes_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `qxq_oauth_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_oauth_sessions
-- ----------------------------
DROP TABLE IF EXISTS `qxq_oauth_sessions`;
CREATE TABLE `qxq_oauth_sessions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `owner_type` enum('client','user') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'user',
  `owner_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `client_redirect_uri` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `oauth_sessions_client_id_owner_type_owner_id_index` (`client_id`,`owner_type`,`owner_id`) USING BTREE,
  CONSTRAINT `qxq_oauth_sessions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `qxq_oauth_clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for qxq_users
-- ----------------------------
DROP TABLE IF EXISTS `qxq_users`;
CREATE TABLE `qxq_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` char(32) NOT NULL,
  `password` char(60) NOT NULL,
  `email` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `gender` tinyint(1) DEFAULT NULL COMMENT '性别',
  `org` varchar(255) DEFAULT NULL COMMENT '工作单位',
  `position` varchar(255) DEFAULT NULL COMMENT '职位',
  `remember_token` varchar(255) DEFAULT NULL COMMENT '忘记密码令牌',
  `active` tinyint(1) DEFAULT NULL COMMENT '激活状态',
  `created_at` datetime DEFAULT NULL COMMENT '注册时间',
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_email` (`email`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
