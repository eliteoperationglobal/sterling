$source = "D:\Sterling Portal\sterlingportal\src\lib\services\pdf\ApartmentPacketPDF.ts"
$target = "D:\Sterling Portal\sterlingportal\src\lib\services\pdf\ContractorsEquipmentPacketPDF.ts"

$imports = Get-Content $target -TotalCount 1
$logos = Get-Content $source | Select-Object -Index (71..4645)
$logic = Get-Content $target | Select-Object -Skip 190

$newContent = @()
$newContent += $imports
$newContent += ""
$newContent += $logos
$newContent += ""
$newContent += $logic

$newContent | Out-File -FilePath $target -Encoding utf8 -Force
