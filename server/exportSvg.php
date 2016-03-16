<?php
if(empty($_POST['data'])) {
  echo "Empty data";
}
else{
  header("Content-type: image/svg+xml");
  header('Content-Disposition: attachment; filename="export.svg"');
  echo $_POST['data'];
}
?>
