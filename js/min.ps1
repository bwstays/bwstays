#    npm install -g terser

#c:\Set-ExecutionPolicy -ExecutionPolicy Unrestricted

# Define the folder containing your JS files
    $jsFolder = "C:\personal\mybusi\land_homestay\kalpatta\bwstays\bwstays\js"
    $jsoutFolder = "C:\personal\mybusi\land_homestay\kalpatta\bwstays\bwstays\jsm"

    # Get all .js files in the specified folder
    Get-ChildItem -Path $jsFolder -Filter "*.js" | ForEach-Object {
        $filePath = $_.FullName
        $fileNameWithoutExtension = $_.BaseName
        $minifiedFileName = "$fileNameWithoutExtension.js"
        $outputPath = Join-Path -Path $jsoutFolder -ChildPath $minifiedFileName

        # Minify the file using terser
        terser $filePath --output $outputPath
    }