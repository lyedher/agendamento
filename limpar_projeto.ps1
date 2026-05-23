# Script de Limpeza do Projeto Agendamento
# Este script remove arquivos de debug e pastas corrompidas

Write-Host "Iniciando limpeza do projeto..." -ForegroundColor Cyan

$filesToDelete = @(
    "check_braces.ts",
    "check_chars.js",
    "check_tags.ts",
    "count_tags.js",
    "rename_alfa.ts",
    "unscramble.js",
    "test_isolation.ts",
    "trace_levels.ts",
    "trace_levels_mid.ts",
    "trace_levels_end.ts"
)

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Arquivo removido: $file" -ForegroundColor Green
    }
}

if (Test-Path "_old_corrupted") {
    Remove-Item "_old_corrupted" -Recurse -Force
    Write-Host "Pasta '_old_corrupted' removida com sucesso!" -ForegroundColor Green
}

Write-Host "Limpeza concluída!" -ForegroundColor Cyan
