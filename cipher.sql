-- phpMyAdmin SQL Dump
-- version 4.0.4
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 12, 2014 at 05:37 PM
-- Server version: 5.1.70
-- PHP Version: 5.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `cipher`
--
CREATE DATABASE IF NOT EXISTS `cipher` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `cipher`;

-- --------------------------------------------------------

--
-- Table structure for table `group`
--

CREATE TABLE IF NOT EXISTS `group` (
  `id` varchar(36) NOT NULL,
  `idUser` int(10) unsigned NOT NULL,
  `name` varchar(512) NOT NULL,
  `topic` varchar(512) NOT NULL DEFAULT '' COMMENT 'Current topic of the group.',
  `created` int(10) unsigned NOT NULL,
  `admin` varchar(36) NOT NULL COMMENT 'privilege for setting topic, banning users, etc',
  `invite` varchar(36) NOT NULL COMMENT 'privilege for ability to invite users',
  `post` varchar(36) NOT NULL COMMENT 'privilege for write access',
  `deleted` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `groupUser`
--

CREATE TABLE IF NOT EXISTS `groupUser` (
  `idGroup` int(10) unsigned NOT NULL,
  `idUser` int(10) unsigned NOT NULL,
  `idUserInvitedBy` int(10) unsigned NOT NULL,
  `inviteTime` int(10) unsigned NOT NULL,
  `entered` int(10) unsigned NOT NULL,
  `banned` tinyint(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`idGroup`,`idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `post`
--

CREATE TABLE IF NOT EXISTS `post` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idGroup` varchar(36) NOT NULL,
  `idUser` int(10) unsigned NOT NULL,
  `content` text NOT NULL,
  `type` varchar(32) NOT NULL COMMENT 'Type of content ie: text/image/video/etc',
  `entered` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idGroup` (`idGroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `deviceId` varchar(255) NOT NULL COMMENT 'Some kind of uuid for the device (changes depending on platform).',
  `devicePlatform` varchar(255) NOT NULL,
  `deviceVersion` varchar(255) NOT NULL,
  `deviceModel` varchar(255) NOT NULL,
  `nickname` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `ip` varchar(40) NOT NULL,
  `entered` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deviceId` (`deviceId`,`nickname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
