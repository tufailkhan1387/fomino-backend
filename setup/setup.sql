-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 12, 2022 at 08:20 AM
-- Server version: 5.7.39
-- PHP Version: 7.4.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `myareeba_foodapp`
--

--
-- Dumping data for table `charges`
--

INSERT INTO `charges` (`id`, `title`, `value`, `amount`, `createdAt`, `updatedAt`) VALUES
(1, 'driverPerMile', '1', '0.75', '2022-07-04 17:29:52', '2022-07-04 17:29:52'),
(2, 'driverBaseCharge', '5', '3.00', '2022-07-04 17:29:52', '2022-07-04 17:29:52'),
(3, 'baseFareTaxi', '1', '3.00', '2022-07-04 17:31:09', '2022-07-04 17:31:09'),
(4, 'perMinChargeTaxi', '1', '0.25', '2022-07-04 17:31:09', '2022-07-04 17:31:09'),
(5, 'baseDistTaxi', '0', '3.00', '2022-07-04 17:32:55', '2022-07-04 17:32:55'),
(6, 'adminPercentTaxi', '%', '12.50', '2022-07-26 11:21:29', '2022-07-26 11:21:29');

--
-- Dumping data for table `deliveryFeeTypes`
--

INSERT INTO `deliveryfeetypes` (`id`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Static', 1, '2022-07-04 17:37:45', '2022-07-04 17:37:45'),
(2, 'Dynamic', 1, '2022-07-04 17:37:45', '2022-07-04 17:37:45');

--
-- Dumping data for table `deliveryTypes`
--

INSERT INTO `deliverytypes` (`id`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Delivery', 1, '2022-07-04 17:38:28', '2022-07-04 17:38:28'),
(2, 'Self-Pickup', 1, '2022-07-04 17:38:28', '2022-07-04 17:38:28'),
(3, 'Both -  Delivery & Self-Pickup', 1, '2022-07-04 17:39:22', '2022-07-04 17:39:22');

--
-- Dumping data for table `orderApplications`
--

INSERT INTO `orderapplications` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'restaurant', '2022-07-04 17:43:00', '2022-07-04 17:43:00'),
(2, 'taxi', '2022-07-04 17:43:00', '2022-07-04 17:43:00');

--
-- Dumping data for table `orderModes`
--

INSERT INTO `ordermodes` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'Standard', '2022-07-04 17:43:53', '2022-07-04 17:43:53'),
(2, 'Scheduled', '2022-07-04 17:43:53', '2022-07-04 17:43:53');

--
-- Dumping data for table `orderStatuses`
--

INSERT INTO `orderstatuses` (`id`, `name`, `displayText`, `createdAt`, `updatedAt`) VALUES
(1, 'Placed', 'Placed', '2022-07-04 17:45:05', '2022-07-04 17:45:05'),
(2, 'Accepted', 'Accepted', '2022-07-04 17:45:05', '2022-07-04 17:45:05'),
(3, 'Preparing', 'Preparing', '2022-07-04 17:45:38', '2022-07-04 17:45:38'),
(4, 'Ready for delivery', 'Ready for delivery', '2022-07-04 17:45:38', '2022-07-04 17:45:38'),
(5, 'On the way', 'On the way', '2022-07-04 17:46:25', '2022-07-04 17:46:25'),
(6, 'Food Pickedup', 'Food Pickedup', '2022-07-04 17:46:25', '2022-07-04 17:46:25'),
(7, 'Delivered', 'Delivered', '2022-07-04 17:47:03', '2022-07-04 17:47:03'),
(8, 'Reached', 'Reached', '2022-07-04 17:47:03', '2022-07-04 17:47:03'),
(9, 'Ride Started', 'Ride Started', '2022-07-04 17:47:43', '2022-07-05 17:47:43'),
(10, 'Ride end', 'Ride end', '2022-07-04 17:47:43', '2022-07-04 17:47:43'),
(11, 'Paid', 'Paid', '2022-07-04 17:47:43', '2022-07-04 17:47:43'),
(12, 'Cancelled', 'Cancelled', '2022-07-04 17:47:43', '2022-07-04 17:47:43'),
(13, 'Food Arrived', 'Food Arrived', '2022-07-04 17:47:43', '2022-07-04 17:47:43');

--
-- Dumping data for table `paymentMethods`
--

INSERT INTO `paymentmethods` (`id`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Card', 1, '2022-07-04 17:48:58', '2022-07-04 17:48:58'),
(2, 'COD', 1, '2022-07-04 17:48:58', '2022-07-04 17:48:58'),
(3, 'Both (Card & COD)', 1, '2022-07-04 17:49:25', '2022-07-04 17:49:25');

--
-- Dumping data for table `serviceTypes`
--

INSERT INTO `servicetypes` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'Food delivery', '2022-07-04 15:28:58', '2022-07-04 15:28:58'),
(2, 'Taxi driver', '2022-07-04 15:28:58', '2022-07-04 15:28:58'),
(3, 'Both - Food delivery and Rides', '2022-07-04 15:29:33', '2022-07-04 15:29:33');

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `content`, `value`, `createdAt`, `updatedAt`) VALUES
(1, 'phone', '2342342342', '2022-08-12 10:03:54', '2022-08-12 10:03:54'),
(2, 'email', 'email@emai', '2022-08-12 10:03:54', '2022-08-12 10:03:54');

--
-- Dumping data for table `userTypes`
--

INSERT INTO `usertypes` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'Customer', '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(2, 'Driver', '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(3, 'Admin', '2022-07-04 17:21:48', '2022-07-04 17:21:48'),
(4, 'Employee', '2022-07-04 17:21:48', '2022-07-04 17:21:48');
COMMIT;

INSERT INTO `users` (`id`, `userName`,`firstName`,`lastName`,`email`,`countryCode`,`phoneNum`, `password`,`status`,`userTypeId`,`createdAt`, `updatedAt`) VALUES
(1, 'adminUser','Admin','admin','admin@gmail.com','+92','32564424243','$2b$10$xVnpsCqWoAdvDbKHE8OdxO40cnlsdDfsEXO/8Zb0ZonEwXdEy88Jy',1,3,'2022-07-04 17:21:11', '2022-07-04 17:21:11')

COMMIT;