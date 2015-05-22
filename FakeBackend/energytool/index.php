<?php
$folder = 'data/';
header('Access-Control-Allow-Origin: *');
$query = $_GET['q'];
switch($query) {
	case "energyData":
		echo file_get_contents($folder.'data_'.$_GET['y'].'.json');
		break;

	case "yearsAvailable":
		echo file_get_contents($folder.'yearsAvailable.json');
		break;

	case "maxSinkValue":
		echo file_get_contents($folder.'maxSinkValue.json');
		break;

	default:
		echo "fail";
}
?>
