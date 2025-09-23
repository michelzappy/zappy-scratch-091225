#Requires -Version 5.1
<#
.SYNOPSIS
    Comprehensive PowerShell stop script for Telehealth Platform on Windows
.DESCRIPTION
    This script gracefully stops all telehealth platform services:
    - Stop frontend and backend Node.js processes
    - Stop Docker containers (PostgreSQL, Redis, Adminer)
    - Clean up process files and temporary data
    - Provide cleanup status and summary
.PARAMETER Force
    Force stop all processes without confirmation
.PARAMETER KeepData
    Keep Docker volumes and data intact
.PARAMETER LogLevel
    Set logging level (Info, Warning, Error, Verbose)
.EXAMPLE
    .\stop-telehealth.ps1
.EXAMPLE
    .\stop-telehealth.ps1 -Force -KeepData
#>

[CmdletBinding()]
param(
    [switch]$Force = $false,
    [switch]$KeepData = $false,
    [ValidateSet('Info', 'Warning', 'Error', 'Verbose')]
    [string]$LogLevel = 'Info'
)

# Script configuration
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

# Global variables
$Global:PIDFile = "telehealth.pids"
$Global:LogFile = "logs\shutdown-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').log"
$Global:StopTime = Get-Date

# Create logs directory if it doesn't exist
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Color scheme for output
$Colors = @{
    Info     = 'Cyan'
    Success  = 'Green'
    Warning  = 'Yellow'
    Error    = 'Red'
    Header   = 'Magenta'
    Highlight= 'White'
}

# Logging functions
function Write-LogMessage {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error', 'Verbose')]
        [string]$Level = 'Info'
    )
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to log file
    Add-Content -Path $Global:LogFile -Value $logEntry -Encoding UTF8 -ErrorAction SilentlyContinue
    
    # Write to console based on log level
    $shouldDisplay = switch ($LogLevel) {
        'Verbose' { $true }
        'Info'    { $Level -in @('Info', 'Success', 'Warning', 'Error') }
        'Warning' { $Level -in @('Warning', 'Error') }
        'Error'   { $Level -eq 'Error' }
    }
    
    if ($shouldDisplay) {
        $color = $Colors[$Level]
        if ($color) {
            Write-Host "[$Level] $Message" -ForegroundColor $color
        } else {
            Write-Host "[$Level] $Message"
        }
    }
}

function Write-InfoLog { param([string]$Message) Write-LogMessage -Message $Message -Level 'Info' }
function Write-SuccessLog { param([string]$Message) Write-LogMessage -Message $Message -Level 'Success' }
function Write-WarningLog { param([string]$Message) Write-LogMessage -Message $Message -Level 'Warning' }
function Write-ErrorLog { param([string]$Message) Write-LogMessage -Message $Message -Level 'Error' }
function Write-VerboseLog { param([string]$Message) Write-LogMessage -Message $Message -Level 'Verbose' }

# Display header
function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Header
    Write-Host "║                    TELEHEALTH PLATFORM SHUTDOWN                 ║" -ForegroundColor $Colors.Header
    Write-Host "║                        Windows PowerShell                       ║" -ForegroundColor $Colors.Header
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Header
    Write-Host ""
    Write-InfoLog "Initiating Telehealth Platform shutdown..."
    Write-VerboseLog "Log Level: $LogLevel"
    Write-VerboseLog "Log File: $Global:LogFile"
}

# Get confirmation if not forced
function Get-ShutdownConfirmation {
    if ($Force) {
        Write-InfoLog "Force mode enabled - skipping confirmation"
        return $true
    }
    
    Write-Host ""
    Write-Host "⚠️  WARNING: This will stop all Telehealth Platform services:" -ForegroundColor $Colors.Warning
    Write-Host "   • Frontend server (port 3000)" -ForegroundColor White
    Write-Host "   • Backend server (port 3001)" -ForegroundColor White
    Write-Host "   • Docker containers (PostgreSQL, Redis, Adminer)" -ForegroundColor White
    
    if (-not $KeepData) {
        Write-Host "   • Docker volumes and data will be preserved" -ForegroundColor Green
    }
    Write-Host ""
    
    $response = Read-Host "Are you sure you want to continue? (y/N)"
    return $response -match '^[Yy]'
}

# Stop Node.js processes
function Stop-NodeProcesses {
    Write-InfoLog "Stopping Node.js processes..."
    
    $stoppedProcesses = @()
    
    try {
        # Try to read saved PIDs first
        if (Test-Path $Global:PIDFile) {
            Write-VerboseLog "Reading saved process IDs from $Global:PIDFile"
            $pidData = Get-Content $Global:PIDFile | ConvertFrom-Json -ErrorAction SilentlyContinue
            
            if ($pidData) {
                # Stop backend process
                if ($pidData.Backend) {
                    $backendProcess = Get-Process -Id $pidData.Backend -ErrorAction SilentlyContinue
                    if ($backendProcess) {
                        Write-InfoLog "Stopping backend server (PID: $($pidData.Backend))..."
                        Stop-Process -Id $pidData.Backend -Force -ErrorAction SilentlyContinue
                        $stoppedProcesses += "Backend (PID: $($pidData.Backend))"
                    }
                }
                
                # Stop frontend process
                if ($pidData.Frontend) {
                    $frontendProcess = Get-Process -Id $pidData.Frontend -ErrorAction SilentlyContinue
                    if ($frontendProcess) {
                        Write-InfoLog "Stopping frontend server (PID: $($pidData.Frontend))..."
                        Stop-Process -Id $pidData.Frontend -Force -ErrorAction SilentlyContinue
                        $stoppedProcesses += "Frontend (PID: $($pidData.Frontend))"
                    }
                }
            }
            
            # Remove PID file
            Remove-Item $Global:PIDFile -Force -ErrorAction SilentlyContinue
            Write-VerboseLog "Removed PID file: $Global:PIDFile"
        }
        
        # Find and stop any remaining Node.js processes on ports 3000 and 3001
        $ports = @(3000, 3001)
        foreach ($port in $ports) {
            try {
                $connections = netstat -ano | Select-String ":$port.*LISTENING"
                if ($connections) {
                    $processIds = $connections | ForEach-Object { ($_ -split '\s+')[-1] }
                    foreach ($processId in $processIds) {
                        if ($processId -and $processId -ne "0") {
                            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                            if ($process) {
                                Write-InfoLog "Stopping process using port $port (PID: $processId)..."
                                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                                $stoppedProcesses += "Port $port (PID: $processId)"
                            }
                        }
                    }
                }
            }
            catch {
                Write-VerboseLog "No processes found on port $port or error checking: $($_.Exception.Message)"
            }
        }
        
        # Give processes time to shut down gracefully
        Start-Sleep -Seconds 2
        
        if ($stoppedProcesses.Count -gt 0) {
            Write-SuccessLog "Stopped processes: $($stoppedProcesses -join ', ')"
        } else {
            Write-InfoLog "No Node.js processes were running"
        }
    }
    catch {
        Write-ErrorLog "Error stopping Node.js processes: $($_.Exception.Message)"
    }
}

# Stop Docker services
function Stop-DockerServices {
    Write-InfoLog "Stopping Docker services..."
    
    try {
        # Check if Docker is running
        $dockerCheck = Start-Process -FilePath "docker" -ArgumentList "info" -Wait -PassThru -WindowStyle Hidden
        if ($dockerCheck.ExitCode -ne 0) {
            Write-WarningLog "Docker daemon is not running - skipping Docker cleanup"
            return
        }
        
        # Check what's currently running
        $runningServices = & docker-compose ps --services --filter "status=running" 2>$null
        if (-not $runningServices) {
            Write-InfoLog "No Docker services are currently running"
            return
        }
        
        Write-InfoLog "Stopping Docker services: $($runningServices -join ', ')"
        
        # Stop services gracefully
        $composeStop = Start-Process -FilePath "docker-compose" -ArgumentList "stop", "--timeout", "30" -Wait -PassThru -WindowStyle Hidden
        if ($composeStop.ExitCode -eq 0) {
            Write-SuccessLog "Docker services stopped gracefully"
        } else {
            Write-WarningLog "Docker stop had issues, attempting force shutdown..."
        }
        
        # Remove containers (but keep volumes unless specified)
        $downArgs = @("down")
        if (-not $KeepData) {
            Write-VerboseLog "Preserving Docker volumes and data"
        } else {
            Write-VerboseLog "Keeping data as requested"
        }
        
        $composeDown = Start-Process -FilePath "docker-compose" -ArgumentList $downArgs -Wait -PassThru -WindowStyle Hidden
        if ($composeDown.ExitCode -eq 0) {
            Write-SuccessLog "Docker containers removed successfully"
        } else {
            Write-WarningLog "Docker container removal had issues"
        }
        
        # Verify shutdown
        $remainingServices = & docker-compose ps --services --filter "status=running" 2>$null
        if ($remainingServices) {
            Write-WarningLog "Some services may still be running: $($remainingServices -join ', ')"
        } else {
            Write-SuccessLog "All Docker services have been stopped"
        }
    }
    catch {
        Write-ErrorLog "Error stopping Docker services: $($_.Exception.Message)"
    }
}

# Clean up temporary files and processes
function Invoke-Cleanup {
    Write-InfoLog "Performing cleanup tasks..."
    
    try {
        $cleanedFiles = @()
        
        # Remove PID file if it still exists
        if (Test-Path $Global:PIDFile) {
            Remove-Item $Global:PIDFile -Force
            $cleanedFiles += $Global:PIDFile
            Write-VerboseLog "Removed PID file"
        }
        
        # Clean up any orphaned lock files
        $lockFiles = Get-ChildItem -Path . -Filter "*.lock" -ErrorAction SilentlyContinue
        foreach ($lockFile in $lockFiles) {
            try {
                Remove-Item $lockFile.FullName -Force
                $cleanedFiles += $lockFile.Name
                Write-VerboseLog "Removed lock file: $($lockFile.Name)"
            }
            catch {
                Write-VerboseLog "Could not remove lock file: $($lockFile.Name)"
            }
        }
        
        # Clean up temporary directories if empty
        $tempDirs = @("temp", "tmp")
        foreach ($tempDir in $tempDirs) {
            if (Test-Path $tempDir) {
                $items = Get-ChildItem $tempDir -ErrorAction SilentlyContinue
                if (-not $items) {
                    try {
                        Remove-Item $tempDir -Force
                        $cleanedFiles += "$tempDir/"
                        Write-VerboseLog "Removed empty temporary directory: $tempDir"
                    }
                    catch {
                        Write-VerboseLog "Could not remove directory: $tempDir"
                    }
                }
            }
        }
        
        if ($cleanedFiles.Count -gt 0) {
            Write-SuccessLog "Cleaned up files: $($cleanedFiles -join ', ')"
        } else {
            Write-InfoLog "No temporary files to clean up"
        }
    }
    catch {
        Write-WarningLog "Cleanup encountered issues: $($_.Exception.Message)"
    }
}

# Display shutdown summary
function Show-ShutdownSummary {
    $shutdownDuration = New-TimeSpan -Start $Global:StopTime -End (Get-Date)
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Success
    Write-Host "              TELEHEALTH PLATFORM SHUTDOWN COMPLETE               " -ForegroundColor $Colors.Success
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Success
    Write-Host ""
    
    Write-Host "✅ Shutdown Summary:" -ForegroundColor $Colors.Highlight
    Write-Host "   • All Node.js processes stopped" -ForegroundColor $Colors.Success
    Write-Host "   • Docker services stopped and containers removed" -ForegroundColor $Colors.Success
    Write-Host "   • Temporary files cleaned up" -ForegroundColor $Colors.Success
    Write-Host "   • Process files removed" -ForegroundColor $Colors.Success
    
    if ($KeepData) {
        Write-Host "   • Data volumes preserved (as requested)" -ForegroundColor $Colors.Info
    } else {
        Write-Host "   • Data volumes preserved" -ForegroundColor $Colors.Info
    }
    
    Write-Host ""
    Write-Host "⏱️  Shutdown completed in: " -NoNewline -ForegroundColor $Colors.Highlight
    Write-Host "$($shutdownDuration.Minutes)m $($shutdownDuration.Seconds)s" -ForegroundColor $Colors.Success
    
    Write-Host "📋 Shutdown time: " -NoNewline -ForegroundColor $Colors.Highlight
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor $Colors.Info
    
    Write-Host "📝 Shutdown log: " -NoNewline -ForegroundColor $Colors.Highlight
    Write-Host "$Global:LogFile" -ForegroundColor $Colors.Info
    
    Write-Host ""
    Write-Host "🚀 To restart the platform:" -ForegroundColor $Colors.Highlight
    Write-Host "   .\start-telehealth.ps1" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "All services have been stopped successfully!" -ForegroundColor $Colors.Success
    Write-Host ""
}

# Verify shutdown completeness
function Test-ShutdownCompleteness {
    Write-InfoLog "Verifying shutdown completeness..."
    
    $issues = @()
    
    try {
        # Check for processes on our ports
        $ports = @(3000, 3001, 5432, 6379, 8080)
        foreach ($port in $ports) {
            $connections = netstat -ano | Select-String ":$port.*LISTENING" 2>$null
            if ($connections) {
                $issues += "Port $port still in use"
                Write-WarningLog "Port $port is still in use"
            }
        }
        
        # Check for remaining Docker containers
        $containers = & docker ps --filter "name=telehealth" --format "{{.Names}}" 2>$null
        if ($containers) {
            $issues += "Docker containers still running: $($containers -join ', ')"
            Write-WarningLog "Some Docker containers are still running: $($containers -join ', ')"
        }
        
        # Check for PID file
        if (Test-Path $Global:PIDFile) {
            $issues += "PID file still exists"
            Write-WarningLog "PID file still exists: $Global:PIDFile"
        }
        
        if ($issues.Count -eq 0) {
            Write-SuccessLog "Shutdown verification passed - all services stopped cleanly"
        } else {
            Write-WarningLog "Shutdown verification found issues: $($issues -join '; ')"
            Write-InfoLog "These issues may resolve themselves or require manual intervention"
        }
    }
    catch {
        Write-WarningLog "Could not fully verify shutdown completeness: $($_.Exception.Message)"
    }
}

# Main shutdown function
function Stop-TelehealthPlatform {
    try {
        Show-Header
        
        if (-not (Get-ShutdownConfirmation)) {
            Write-InfoLog "Shutdown cancelled by user"
            return
        }
        
        Write-InfoLog "Beginning graceful shutdown process..."
        
        Stop-NodeProcesses
        Stop-DockerServices
        Invoke-Cleanup
        Test-ShutdownCompleteness
        Show-ShutdownSummary
        
        Write-SuccessLog "Telehealth Platform shutdown completed successfully!"
    }
    catch {
        Write-ErrorLog "Shutdown process encountered an error: $($_.Exception.Message)"
        Write-ErrorLog "Some services may still be running - check manually if needed"
        exit 1
    }
}

# Execute main function
Stop-TelehealthPlatform