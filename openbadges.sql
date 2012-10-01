-- MySQL dump 10.13  Distrib 5.1.63, for debian-linux-gnu (i486)
--
-- Host: localhost    Database: openbadges
-- ------------------------------------------------------
-- Server version	5.1.63-0ubuntu0.10.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `openbadges`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `openbadges` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `openbadges`;

--
-- Table structure for table `badge`
--

DROP TABLE IF EXISTS `badge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `badge` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `type` enum('hosted','signed') NOT NULL,
  `endpoint` tinytext,
  `public_key` text,
  `jwt` text,
  `image_path` varchar(255) NOT NULL,
  `rejected` tinyint(1) DEFAULT '0',
  `body` mediumblob NOT NULL,
  `body_hash` varchar(255) NOT NULL,
  `validated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `body_hash` (`body_hash`),
  KEY `user_fkey` (`user_id`),
  CONSTRAINT `badge_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `badge`
--

LOCK TABLES `badge` WRITE;
/*!40000 ALTER TABLE `badge` DISABLE KEYS */;
INSERT INTO `badge` VALUES (1,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fby.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/ff79737f28b53adfd9c960ec21adf143.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/by.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','ac5c92e1a05c39e2e7124224fb173ac4cdd63e4cabd495d5a34d9a3b69866a89','2012-10-01 18:13:34'),(2,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fcc.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/d79cfb9bb6ed8b29f403394400d2e21b.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/cc.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','ab5a5655e75a30c4a2fa65209ac12e89e6f5954f26c9deaf1aae488b4fbaaf28','2012-10-01 18:13:34'),(3,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fnc-eu.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/4e935689cb38527cda3db429195dd7ec.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/nc-eu.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','a6d8cfe5c4ed661a486b5a844172dcb116f4d15c680aa31eb4427fc248152b48','2012-10-01 18:13:34'),(4,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fnc-jp.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/3ea70af29afc8971b3e9d655ddb87254.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/nc-jp.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','bae738f8077a352bc7df0daaff5af21f20f0e77660310d5fd9f3bdccaed0c99c','2012-10-01 18:13:34'),(5,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fnc.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/6a74e3819f92ad84a3d8b2c45780546f.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/nc.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','d35fedefb5b931fe189f131d272da6e6c32b367e543049e4afb7570e9a9234bf','2012-10-01 18:13:34'),(6,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fnd.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/76399190ab5ec1b77247e6df4cec0a54.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/nd.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','3e54a418c168acd4d2cf3c0211751b7e85a2147cc57ee65d457f50a0b57bbe84','2012-10-01 18:13:34'),(7,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fpd.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/c98c93b6c158831666017e62ec5ca6ac.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/pd.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','dd8b0514ee5423affd860a33e654f10600c9c60c59e7062acb7773c699f337a5','2012-10-01 18:13:34'),(8,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fremix.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/8c69a8b5f9639779147a908e9c572c51.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/remix.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','15b762bd228432a453cfaeb292fc7d2f194399421f33f9cad82fc042ac3ed7f0','2012-10-01 18:13:34'),(9,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fsa.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/9622e70e507fe7df13226c73e383440c.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/sa.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','f69903235ad43e0971dead9901fec1b6a7b8e7429d7361afca52f86dbcd00884','2012-10-01 18:13:34'),(10,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fsampling.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/b53fb47fd31072ba2de9f22e203ca0a0.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/sampling.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','313bf3dbcf87d04e69ff620bd8da63209b85bf0c15821b668cfefeda30860207','2012-10-01 18:13:34'),(11,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fsampling.plus.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/4c013229b89400021120bbb5d6881a33.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/sampling.plus.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','648ea8b437ffd70ae36cadac85594e22de78b1858fe6bb3679cf7e1802d4edc6','2012-10-01 18:13:34'),(12,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fshare.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/b04abee77a882060b9a7170213a26312.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/share.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','a1d7bcea9482adc4bca7e2a6bd6d9402ca14d4e407c2a6b31329ea7577f0b5ee','2012-10-01 18:13:34'),(13,1,'hosted','http://localhost:8888/demo/badge.json?title=raaad&image=http%3A%2F%2Flocalhost%3A8888%2Fstatic%2F_demo%2Fzero.large.png&recipient=sha256%24838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42',NULL,NULL,'/_badges/cd5ac7cb124bdd57f32d58136925febd.png',0,'{\"recipient\":\"sha256$838b9e482c0e28e4c5287486036c8ff1068e57d77738e0c75dc58e903bc67f42\",\"salt\":\"ballertime\",\"evidence\":\"/demo/evidence\",\"expires\":\"2040-08-13\",\"issued_on\":\"2011-08-23\",\"badge\":{\"version\":\"v0.5.0\",\"name\":\"DEMO: Open Badges Demo Badge\",\"description\":\"For rocking in the free world\",\"image\":\"http://localhost:8888/static/_demo/zero.large.png\",\"criteria\":\"/demo/criteria\",\"issuer\":{\"name\":\"Open Badges Demo\",\"origin\":\"http://localhost:8888\"}}}','6de20ebd1507afe560406a7022d2c25d0c672b22367526e038a402547084aeda','2012-10-01 18:13:34');
/*!40000 ALTER TABLE `badge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `public` tinyint(1) DEFAULT '0',
  `badges` mediumblob NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url` (`url`),
  KEY `user_fkey` (`user_id`),
  CONSTRAINT `group_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group`
--

LOCK TABLES `group` WRITE;
/*!40000 ALTER TABLE `group` DISABLE KEYS */;
INSERT INTO `group` VALUES (1,1,'Text badges','0fac198827d6156ea9af5f431a953e1c',0,'[2,7]'),(2,1,'Wavy badges','018d7cff68858661b6113da36f785dba',0,'[10,11]'),(3,1,'No, no, no','f901c279281955e8f3866215e77766a9',0,'[3,4,5]');
/*!40000 ALTER TABLE `group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `portfolio`
--

DROP TABLE IF EXISTS `portfolio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `portfolio` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `group_id` bigint(20) NOT NULL,
  `url` varchar(255) DEFAULT NULL,
  `title` varchar(128) DEFAULT NULL,
  `subtitle` varchar(128) DEFAULT NULL,
  `preamble` text,
  `stories` mediumblob,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url` (`url`),
  KEY `group_fkey` (`group_id`),
  CONSTRAINT `portfolio_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `portfolio`
--

LOCK TABLES `portfolio` WRITE;
/*!40000 ALTER TABLE `portfolio` DISABLE KEYS */;
/*!40000 ALTER TABLE `portfolio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `last_login` int(13) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `passwd` varchar(255) DEFAULT NULL,
  `salt` tinyblob,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'pomax@mozillafoundation.org',NULL,1,NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2012-10-01 20:22:34
