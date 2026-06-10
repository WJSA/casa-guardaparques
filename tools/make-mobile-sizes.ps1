# Generate 1440px mobile variants (render-0X-sm.jpg) for srcset.
Add-Type -AssemblyName System.Drawing

$renders = "C:\Users\Windows 11\Desktop\avila-project\assets\renders"
$maxEdge = 1440
$quality = 78L

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, $quality)

Get-ChildItem $renders -Filter "render-0?.jpg" | Where-Object { $_.Name -notlike "*-sm*" } | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  try {
    $scale = [Math]::Min(1.0, $maxEdge / [Math]::Max($img.Width, $img.Height))
    $nw = [int][Math]::Round($img.Width * $scale)
    $nh = [int][Math]::Round($img.Height * $scale)
    $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($img, 0, 0, $nw, $nh)
    $out = Join-Path $renders ($_.BaseName + "-sm.jpg")
    $bmp.Save($out, $jpegCodec, $encParams)
    $kb = [math]::Round((Get-Item $out).Length / 1KB)
    Write-Host ("{0} -> {1} ({2}x{3}, {4} KB)" -f $_.Name, ($_.BaseName + "-sm.jpg"), $nw, $nh, $kb)
    $g.Dispose(); $bmp.Dispose()
  } finally { $img.Dispose() }
}
Write-Host "DONE"
