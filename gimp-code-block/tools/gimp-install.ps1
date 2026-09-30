# GIMP Code Block : range dans GIMP 2.10 les plug-ins envoyés par « 🧩 Installer dans GIMP ».
# L'atelier (une page web) n'a pas le droit d'écrire dans AppData : il dépose <nom>.gimp-install.py
# dans Téléchargements, et ce script le déplace dans %APPDATA%\GIMP\2.10\plug-ins\<nom>.py.
# Lancé par « Lancer GIMP Code Block.bat ». -Watch : continue à surveiller jusqu'à la fermeture de la fenêtre.
param([switch]$Watch)
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
$E = [char]27
function Say([int]$c, [string]$t) { Write-Host ("$E[38;5;{0}m{1}$E[0m" -f $c, $t) }

$plug = Join-Path $env:APPDATA 'GIMP\2.10\plug-ins'
$backup = Join-Path $env:APPDATA 'GIMP\2.10\gimp-code-block-sauvegardes'
$dl = $null
try { $dl = (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path } catch { }
if (-not $dl -or -not (Test-Path -LiteralPath $dl)) { $dl = Join-Path $env:USERPROFILE 'Downloads' }
# mon_script.gimp-install.py, et les doublons du navigateur : mon_script.gimp-install (1).py
$rx = '^(?<n>.+?)\.gimp-install(?:\s*\(\d+\))?\.py$'

function Install-One($f) {
  $m = [regex]::Match($f.Name, $rx)
  if (-not $m.Success) { return }
  $name = $m.Groups['n'].Value + '.py'
  $dest = Join-Path $plug $name
  for ($i = 0; $i -lt 30; $i++) {
    try {
      if (-not (Test-Path -LiteralPath $plug)) { New-Item -ItemType Directory -Path $plug -Force | Out-Null }
      if (Test-Path -LiteralPath $dest) {
        # l'ancienne version est gardée, au cas où
        New-Item -ItemType Directory -Path $backup -Force | Out-Null
        Copy-Item -LiteralPath $dest -Destination (Join-Path $backup ((Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + '_' + $name)) -Force -ErrorAction Stop
      }
      Move-Item -LiteralPath $f.FullName -Destination $dest -Force -ErrorAction Stop
      Say 114 ('  ✔ {0}  {1} est installé dans GIMP' -f (Get-Date -Format 'HH:mm:ss'), $name)
      if (Get-Process -Name 'gimp*' -ErrorAction SilentlyContinue) { Say 220 '     GIMP est ouvert : ferme-le et relance-le pour voir le plug-in.' }
      else { Say 245 '     Lance GIMP : le plug-in est dans son menu.' }
      return
    } catch { Start-Sleep -Milliseconds 300 }   # le navigateur finit peut-être d'écrire le fichier
  }
  Say 203 ('  ✖ Impossible de ranger {0} (fichier bloqué ?)' -f $f.Name)
}
function Sweep {
  Get-ChildItem -LiteralPath $dl -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match $rx } | ForEach-Object { Install-One $_ }
}

Say 81 ('  Téléchargements : {0}' -f $dl)
Say 81 ('  Plug-ins GIMP   : {0}' -f $plug)
Write-Host ''
Sweep
if (-not $Watch) { return }
Say 245 '  En attente des plug-ins envoyés par « 🧩 Installer dans GIMP »…'
Say 245 '  (laisse cette fenêtre ouverte pendant que tu travailles ; ferme-la pour arrêter)'
Write-Host ''
while ($true) { Start-Sleep -Milliseconds 700; Sweep }
