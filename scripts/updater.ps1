
$RepoOwner = "warmooff-ops"
$RepoName = "MacroX"
$CurrentVersion = "0.1.0" # À mettre à jour à chaque version

function Get-LatestRelease {
    $url = "https://api.github.com/repos/$RepoOwner/$RepoName/releases/latest"
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get
        return $response
    } catch {
        Write-Host "Impossible de vérifier les mises à jour sur GitHub." -ForegroundColor Red
        return $null
    }
}

$latestRelease = Get-LatestRelease

if ($null -ne $latestRelease) {
    $latestVersion = $latestRelease.tag_name.Replace("v", "")
    
    if ($latestVersion -gt $CurrentVersion) {
        Write-Host "Une nouvelle version ($latestVersion) est disponible !" -ForegroundColor Green
        
        $asset = $latestRelease.assets | Where-Object { $_.name -like "*.msi" -or $_.name -like "*.exe" } | Select-Object -First 1
        
        if ($null -ne $asset) {
            $downloadUrl = $asset.browser_download_url
            $tempPath = Join-Path $env:TEMP $asset.name
            
            Write-Host "Téléchargement de la mise à jour..."
            Invoke-WebRequest -Uri $downloadUrl -OutFile $tempPath
            
            Write-Host "Lancement de l'installateur..."
            Start-Process -FilePath $tempPath -Wait
            
            Write-Host "Mise à jour terminée. Veuillez redémarrer l'application." -ForegroundColor Cyan
        }
    } else {
        Write-Host "Votre application est à jour (v$CurrentVersion)." -ForegroundColor Gray
    }
}
