# Optimize render PNGs -> web JPGs using System.Drawing (no external tools).
# Non-destructive: originals in assets\ are untouched; output goes to assets\renders\.
Add-Type -AssemblyName System.Drawing

$assets  = "C:\Users\Windows 11\Desktop\avila-project\assets"
$outDir  = Join-Path $assets "renders"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Source PNG -> output name, mapped to the narrative order.
$map = [ordered]@{
  "IMG_7633.PNG" = "render-01.jpg"  # 01 El Umbral - conjunto en el bosque al atardecer
  "IMG_7634.PNG" = "render-02.jpg"  # 02 Habitar la pendiente - aerea cenital / planta
  "IMG_7636.PNG" = "render-03.jpg"  # 02 - columnas/puente adaptandose a la cota
  "IMG_7637.PNG" = "render-04.jpg"  # 03 Refugio publico - terraza redonda
  "IMG_7638.PNG" = "render-05.jpg"  # 03 - bano de bambu
  "IMG_7639.PNG" = "render-06.jpg"  # 04 Intimidad elevada - la linterna / palio
  "IMG_7635.PNG" = "render-07.jpg"  # 04 - mirador con hamaca y vista al mar
  "IMG_7640.PNG" = "render-08.jpg"  # 05 Honestidad del bambu - detalle interior
}

$maxEdge = 2560
$quality = 80L

# JPEG encoder + quality param
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, $quality)

foreach ($src in $map.Keys) {
  $inPath  = Join-Path $assets $src
  $outPath = Join-Path $outDir $map[$src]
  if (-not (Test-Path $inPath)) { Write-Host "MISSING $src"; continue }

  $img = [System.Drawing.Image]::FromFile($inPath)
  try {
    $w = $img.Width; $h = $img.Height
    $scale = [Math]::Min(1.0, $maxEdge / [Math]::Max($w, $h))
    $nw = [int][Math]::Round($w * $scale)
    $nh = [int][Math]::Round($h * $scale)

    $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($img, 0, 0, $nw, $nh)
    $bmp.Save($outPath, $jpegCodec, $encParams)

    $outKB = [math]::Round((Get-Item $outPath).Length / 1KB)
    Write-Host ("{0} ({1}x{2}) -> {3} ({4}x{5}, {6} KB)" -f $src,$w,$h,$map[$src],$nw,$nh,$outKB)

    $g.Dispose(); $bmp.Dispose()
  } finally {
    $img.Dispose()
  }
}
Write-Host "DONE"
