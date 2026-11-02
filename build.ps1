$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$jdkCandidates = @(@($env:JAVA_HOME, 'C:\Program Files\Java\jdk-17', 'C:\Program Files\Java\jdk-21') | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ 'bin\javac.exe')) } | Select-Object -Unique)
$jdkDirectory = $null
foreach ($candidate in $jdkCandidates) {
    $releasePath = Join-Path $candidate 'release'
    if ((Test-Path -LiteralPath $releasePath) -and ((Get-Content -LiteralPath $releasePath -Raw) -match 'JAVA_VERSION="(\d+)') -and [int]$Matches[1] -ge 17) { $jdkDirectory = $candidate; break }
}
if (-not $jdkDirectory) { throw 'Can cai JDK 17 tro len hoac dat JAVA_HOME.' }
# Clean generated output so old releases never remain inside the packaged website.
$projectDirectory = [IO.Path]::GetFullPath($PSScriptRoot)
foreach ($generatedRelative in @('dist', 'build\classes\site')) {
    $generatedTarget = [IO.Path]::GetFullPath((Join-Path $projectDirectory $generatedRelative))
    if (-not $generatedTarget.StartsWith($projectDirectory + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Generated output escaped the project folder.' }
    if (Test-Path -LiteralPath $generatedTarget) {
        $generatedItem = Get-Item -LiteralPath $generatedTarget -Force
        if ($generatedItem.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing to clean a linked output folder.' }
        Remove-Item -LiteralPath $generatedTarget -Recurse -Force
    }
}
New-Item -ItemType Directory -Force -Path 'build\classes' | Out-Null
& (Join-Path $jdkDirectory 'bin\javac.exe') -encoding UTF-8 -d build/classes src/Anniversary.java
if ($LASTEXITCODE -ne 0) { throw 'Java compilation failed. Use JDK 17 or newer.' }
& (Join-Path $jdkDirectory 'bin\java.exe') -cp build/classes Anniversary build .
if ($LASTEXITCODE -ne 0) { throw 'Site generation failed.' }
New-Item -ItemType Directory -Force -Path 'build\classes\site' | Out-Null
Copy-Item -Path 'dist\*' -Destination 'build\classes\site' -Recurse -Force
& (Join-Path $jdkDirectory 'bin\jar.exe') --create --file build/anniversary.jar --main-class Anniversary -C build/classes .
if ($LASTEXITCODE -ne 0) { throw 'Jar packaging failed.' }
Write-Host 'Ready: dist/ and build/anniversary.jar'
