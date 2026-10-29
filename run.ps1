param([int]$Port = 8080)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
& "$PSScriptRoot\build.ps1"
if (Test-Path -LiteralPath 'C:\Program Files\Java\jdk-17\bin\java.exe') { $javaExecutable = 'C:\Program Files\Java\jdk-17\bin\java.exe' }
elseif ($env:JAVA_HOME) { $javaExecutable = Join-Path $env:JAVA_HOME 'bin\java.exe' }
else { $javaExecutable = 'java' }
& $javaExecutable -jar build/anniversary.jar serve $Port
