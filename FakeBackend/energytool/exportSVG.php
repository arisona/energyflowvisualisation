<?php
header('Access-Control-Allow-Origin: *');

$filename = "log.txt";
file_put_contents ($filename , "test" );
$image = new Imagick();
$result = $image->readImageBlob(urldecode($_POST["data"]));
file_put_contents ($filename , $image->getSize());
file_put_contents ($filename , "test" );
$image->setImageFormat("png24");
$image->resizeImage(1024, 768, imagick::FILTER_LANCZOS, 1); 
$image->writeImage("sankey.png");

header("Content-Type: image/png");
echo $image;
?>
