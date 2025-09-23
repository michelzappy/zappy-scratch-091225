#Requires -Version 5.1
<#
.SYNOPSIS
    Comprehensive PowerShell startup script for Telehealth Platform on Windows
.DESCRIPTION
    This script sets up and starts all necessary services for the telehealth platform:
    - Environment setup and validation
    - Dependency management with Windows path workarounds  
    - Infrastructure services (PostgreSQL, Redis, Adminer)
    - Database initialization and migrations
    - Backend and frontend service orchestration
    - Health validation and status dashboard
    - Process management and error handling
.PARAMETER SkipDependencies
    Skip npm dependency installation if already installed
.PARAMETER SkipDocker
    Skip Docker service startup if already running
.PARAMETER LogLevel
    Set logging level (Info, Warning, Error, Verbose)
.EXAMPLE
    .\start-telehealth.ps1
.EXAMPLE
    .\start-telehealth.ps1 -SkipDependencies -LogLevel Verbose
#>

[CmdletBinding()]
param(
    [switch]$SkipDependencies = $false,
    [switch]$SkipDocker = $false,
    [ValidateSet('Info', 'Warning', 'Error', 'Verbose')]
    [string]$LogLevel = 'Info'
)

# Script configuration
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Global variables for process management
$Global:BackendProcess = $null
$Global:FrontendProcess = $null
$Global:LogFile = "logs\startup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').log"
$Global:PIDFile = "telehealth.pids"
$Global:StartTime = Get-Date

# Create logs directory
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
    Add-Content -Path $Global:LogFile -Value $logEntry -Encoding UTF8
    
    # Write to console based on log level
    $shouldDisplay = switch ($Global:LogLevel) {
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

# Error handling function
function Handle-Error {
    param(
        [string]$Operation,
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )
    
    Write-ErrorLog "Failed during: $Operation"
    Write-ErrorLog "Error: $($ErrorRecord.Exception.Message)"
    Write-ErrorLog "Location: $($ErrorRecord.InvocationInfo.ScriptName):$($ErrorRecord.InvocationInfo.ScriptLineNumber)"
    
    # Cleanup on error
    Invoke-Cleanup
    exit 1
}

# Display header
function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Header
    Write-Host "║                    TELEHEALTH PLATFORM STARTUP                  ║" -ForegroundColor $Colors.Header
    Write-Host "║                        Windows PowerShell                       ║" -ForegroundColor $Colors.Header  
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Header
    Write-Host ""
    Write-InfoLog "Starting Telehealth Platform initialization..."
    Write-VerboseLog "Log Level: $LogLevel"
    Write-VerboseLog "Log File: $Global:LogFile"
}

# Check prerequisites
function Test-Prerequisites {
    Write-InfoLog "Checking prerequisites..."
    
    $prerequisites = @(
        @{ Name = "Docker"; Command = "docker"; Args = "--version"; MinVersion = $null },
        @{ Name = "Docker Compose"; Command = "docker-compose"; Args = "--version"; MinVersion = $null },
        @{ Name = "Node.js"; Command = "node"; Args = "--version"; MinVersion = "18.0.0" },
        @{ Name = "npm"; Command = "npm"; Args = "--version"; MinVersion = $null }
    )
    
    foreach ($prereq in $prerequisites) {
        try {
            Write-VerboseLog "Checking $($prereq.Name)..."
            $result = & $prereq.Command $prereq.Args 2>&1
            
            if ($LASTEXITCODE -ne 0) {
                throw "$($prereq.Name) not found or not working properly"
            }
            
            # Version check for Node.js
            if ($prereq.MinVersion -and $prereq.Name -eq "Node.js") {
                $version = $result -replace '^v', '' -replace '\r?\n', ''
                if ([version]$version -lt [version]$prereq.MinVersion) {
                    throw "$($prereq.Name) version $version is below minimum required $($prereq.MinVersion)"
                }
            }
            
            Write-VerboseLog "$($prereq.Name): OK ($($result -replace '\r?\n', ''))"
        }
        catch {
            Write-ErrorLog "$($prereq.Name) is not installed or not working properly"
            Write-ErrorLog "Please install $($prereq.Name) before continuing"
            throw "Prerequisite check failed for $($prereq.Name)"
        }
    }
    
    Write-SuccessLog "All prerequisites are installed and working"
}

# Setup environment
function Initialize-Environment {
    Write-InfoLog "Setting up environment..."
    
    try {
        # Check for .env file
        if (-not (Test-Path ".env")) {
            if (Test-Path ".env.example") {
                Write-WarningLog ".env file not found. Creating from .env.example..."
                Copy-Item ".env.example" ".env" -Force
                Write-SuccessLog ".env file created from template"
                Write-WarningLog "Please review .env file and update values if needed"
            } else {
                Write-ErrorLog "Neither .env nor .env.example found"
                throw "Environment configuration files missing"
            }
        } else {
            Write-SuccessLog ".env file exists"
        }
        
        # Validate critical environment variables
        $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
        $criticalVars = @('DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'PORT')
        
        foreach ($var in $criticalVars) {
            $found = $envContent | Where-Object { $_ -match "^$var=" }
            if (-not $found) {
                Write-WarningLog "Critical environment variable $var not found in .env"
            } else {
                Write-VerboseLog "Environment variable $var is configured"
            }
        }
        
        # Create necessary directories
        $directories = @('logs', 'uploads', 'temp')
        foreach ($dir in $directories) {
            if (-not (Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
                Write-VerboseLog "Created directory: $dir"
            }
        }
        
        Write-SuccessLog "Environment setup complete"
    }
    catch {
        Handle-Error "Environment Setup" $_
    }
}

# Install dependencies with Windows path handling
function Install-Dependencies {
    if ($SkipDependencies) {
        Write-InfoLog "Skipping dependency installation (requested)"
        return
    }
    
    Write-InfoLog "Installing dependencies..."
    
    try {
        # Backend dependencies
        Write-InfoLog "Installing backend dependencies..."
        Push-Location "backend"
        
        if (-not (Test-Path "node_modules")) {
            Write-InfoLog "No node_modules found. Running npm install..."
            $backendInstall = Start-Process -FilePath "npm" -ArgumentList "install", "--no-audit", "--fund=false" -Wait -PassThru -WindowStyle Hidden
            if ($backendInstall.ExitCode -ne 0) {
                throw "Backend npm install failed with exit code $($backendInstall.ExitCode)"
            }
        } else {
            Write-VerboseLog "Backend node_modules exists. Checking for updates..."
            $backendUpdate = Start-Process -FilePath "npm" -ArgumentList "install", "--no-audit", "--fund=false" -Wait -PassThru -WindowStyle Hidden
            if ($backendUpdate.ExitCode -ne 0) {
                Write-WarningLog "Backend dependency update failed, but continuing..."
            }
        }
        
        Pop-Location
        Write-SuccessLog "Backend dependencies installed"
        
        # Frontend dependencies
        Write-InfoLog "Installing frontend dependencies..."
        Push-Location "frontend"
        
        if (-not (Test-Path "node_modules")) {
            Write-InfoLog "No frontend node_modules found. Running npm install..."
            $frontendInstall = Start-Process -FilePath "npm" -ArgumentList "install", "--no-audit", "--fund=false" -Wait -PassThru -WindowStyle Hidden
            if ($frontendInstall.ExitCode -ne 0) {
                throw "Frontend npm install failed with exit code $($frontendInstall.ExitCode)"
            }
        } else {
            Write-VerboseLog "Frontend node_modules exists. Checking for updates..."
            $frontendUpdate = Start-Process -FilePath "npm" -ArgumentList "install", "--no-audit", "--fund=false" -Wait -PassThru -WindowStyle Hidden
            if ($frontendUpdate.ExitCode -ne 0) {
                Write-WarningLog "Frontend dependency update failed, but continuing..."
            }
        }
        
        Pop-Location
        Write-SuccessLog "All dependencies installed successfully"
    }
    catch {
        Pop-Location -ErrorAction SilentlyContinue
        Handle-Error "Dependency Installation" $_
    }
}

# Start Docker services
function Start-DockerServices {
    if ($SkipDocker) {
        Write-InfoLog "Skipping Docker service startup (requested)"
        return
    }
    
    Write-InfoLog "Starting Docker services..."
    
    try {
        # Check Docker daemon
        $dockerCheck = Start-Process -FilePath "docker" -ArgumentList "info" -Wait -PassThru -WindowStyle Hidden
        if ($dockerCheck.ExitCode -ne 0) {
            throw "Docker daemon is not running. Please start Docker Desktop."
        }
        
        # Check if services are already running
        $runningServices = & docker-compose ps --services --filter "status=running" 2>$null
        if ($runningServices) {
            Write-WarningLog "Some Docker services are already running: $($runningServices -join ', ')"
            
            $response = Read-Host "Do you want to restart them? (y/N)"
            if ($response -match '^[Yy]') {
                Write-InfoLog "Restarting Docker services..."
                & docker-compose down --timeout 30
                Start-Sleep -Seconds 2
            } else {
                Write-InfoLog "Continuing with existing Docker services..."
                return
            }
        }
        
        # Start services
        Write-InfoLog "Launching Docker containers..."
        $composeStart = Start-Process -FilePath "docker-compose" -ArgumentList "up", "-d" -Wait -PassThru -WindowStyle Hidden
        if ($composeStart.ExitCode -ne 0) {
            throw "docker-compose up failed with exit code $($composeStart.ExitCode)"
        }
        
        Write-InfoLog "Waiting for services to initialize..."
        Start-Sleep -Seconds 5
        
        # Health checks
        Test-ServiceHealth -ServiceName "PostgreSQL" -TestScript { 
            & docker exec telehealth_postgres pg_isready -U telehealth_user -d telehealth_db 2>$null
            return $LASTEXITCODE -eq 0
        } -MaxAttempts 30 -DelaySeconds 1
        
        Test-ServiceHealth -ServiceName "Redis" -TestScript { 
            & docker exec telehealth_redis redis-cli ping 2>$null | Out-String
            return $LASTEXITCODE -eq 0
        } -MaxAttempts 15 -DelaySeconds 1
        
        Write-SuccessLog "All Docker services are running and healthy"
    }
    catch {
        Handle-Error "Docker Services Startup" $_
    }
}

# Health check helper function
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [scriptblock]$TestScript,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 1
    )
    
    Write-InfoLog "Checking $ServiceName health..."
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $result = & $TestScript
            if ($result) {
                Write-SuccessLog "$ServiceName is healthy"
                return
            }
        }
        catch {
            Write-VerboseLog "$ServiceName health check attempt $i failed: $($_.Exception.Message)"
        }
        
        if ($i -eq $MaxAttempts) {
            throw "$ServiceName failed to become healthy after $MaxAttempts attempts"
        }
        
        Start-Sleep -Seconds $DelaySeconds
    }
}

# Initialize database
function Initialize-Database {
    Write-InfoLog "Initializing database..."
    
    try {
        # Check if database is already initialized
        $tableCheck = & docker exec telehealth_postgres psql -U telehealth_user -d telehealth_db -c "SELECT 1 FROM information_schema.tables WHERE table_name='patients' LIMIT 1;" 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-InfoLog "Database appears to be already initialized"
            Write-VerboseLog "Found existing database schema"
        } else {
            Write-InfoLog "Setting up database schema..."
            
            # Run initial schema if exists
            if (Test-Path "database\init.sql") {
                Get-Content "database\init.sql" | & docker exec -i telehealth_postgres psql -U telehealth_user -d telehealth_db
                if ($LASTEXITCODE -ne 0) {
                    Write-WarningLog "Database schema initialization had warnings, but continuing..."
                }
            }
            
            # Run migrations if available
            if (Test-Path "database\migrations") {
                Write-InfoLog "Running database migrations..."
                Push-Location "backend"
                $migrateResult = Start-Process -FilePath "npm" -ArgumentList "run", "db:migrate" -Wait -PassThru -WindowStyle Hidden
                if ($migrateResult.ExitCode -ne 0) {
                    Write-WarningLog "Database migrations had issues, but continuing..."
                }
                Pop-Location
            }
            
            Write-SuccessLog "Database schema initialized"
        }
        
        # Seed data if needed
        Write-InfoLog "Checking seed data..."
        Push-Location "backend"
        $seedResult = Start-Process -FilePath "npm" -ArgumentList "run", "db:seed" -Wait -PassThru -WindowStyle Hidden
        if ($seedResult.ExitCode -eq 0) {
            Write-SuccessLog "Seed data applied successfully"
        } else {
            Write-WarningLog "Seed data application had issues, but continuing..."
        }
        Pop-Location
    }
    catch {
        Pop-Location -ErrorAction SilentlyContinue
        Handle-Error "Database Initialization" $_
    }
}

# Start backend server
function Start-BackendServer {
    Write-InfoLog "Starting backend server..."
    
    try {
        # Kill any existing process on port 3001
        $existingProcess = Get-Process | Where-Object { 
            try { 
                $connections = netstat -ano | Select-String ":3001.*LISTENING"
                $pids = $connections | ForEach-Object { ($_ -split '\s+')[-1] }
                return $_.Id -in $pids
            } catch { return $false }
        }
        
        if ($existingProcess) {
            Write-WarningLog "Port 3001 is already in use. Terminating existing process(es)..."
            $existingProcess | Stop-Process -Force
            Start-Sleep -Seconds 2
        }
        
        # Start backend server
        Write-InfoLog "Launching backend server on port 3001..."
        Push-Location "backend"
        
        $backendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
        $Global:BackendProcess = $backendProcess
        
        Pop-Location
        
        # Wait for server to start and test health
        Write-InfoLog "Waiting for backend server to initialize..."
        Start-Sleep -Seconds 5
        
        Test-ServiceHealth -ServiceName "Backend API" -TestScript {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
                return $response.StatusCode -eq 200
            }
            catch {
                return $false
            }
        } -MaxAttempts 20 -DelaySeconds 2
        
        Write-SuccessLog "Backend server is running on port 3001"
    }
    catch {
        Pop-Location -ErrorAction SilentlyContinue
        Handle-Error "Backend Server Startup" $_
    }
}

# Start frontend server
function Start-FrontendServer {
    Write-InfoLog "Starting frontend server..."
    
    try {
        # Kill any existing process on port 3000
        $existingProcess = Get-Process | Where-Object { 
            try { 
                $connections = netstat -ano | Select-String ":3000.*LISTENING"
                $pids = $connections | ForEach-Object { ($_ -split '\s+')[-1] }
                return $_.Id -in $pids
            } catch { return $false }
        }
        
        if ($existingProcess) {
            Write-WarningLog "Port 3000 is already in use. Terminating existing process(es)..."
            $existingProcess | Stop-Process -Force
            Start-Sleep -Seconds 2
        }
        
        # Start frontend server
        Write-InfoLog "Launching frontend server on port 3000..."
        Push-Location "frontend"
        
        $frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
        $Global:FrontendProcess = $frontendProcess
        
        Pop-Location
        
        # Wait for server to start
        Write-InfoLog "Waiting for frontend server to initialize..."
        Start-Sleep -Seconds 8
        
        Test-ServiceHealth -ServiceName "Frontend Server" -TestScript {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10 -ErrorAction Stop
                return $response.StatusCode -eq 200
            }
            catch {
                return $false
            }
        } -MaxAttempts 15 -DelaySeconds 3
        
        Write-SuccessLog "Frontend server is running on port 3000"
    }
    catch {
        Pop-Location -ErrorAction SilentlyContinue
        Handle-Error "Frontend Server Startup" $_
    }
}

# Save process IDs for cleanup
function Save-ProcessIDs {
    try {
        $pidData = @{
            Backend = if ($Global:BackendProcess) { $Global:BackendProcess.Id } else { $null }
            Frontend = if ($Global:FrontendProcess) { $Global:FrontendProcess.Id } else { $null }
            Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        }
        
        $pidData | ConvertTo-Json | Set-Content -Path $Global:PIDFile -Encoding UTF8
        Write-VerboseLog "Process IDs saved to $Global:PIDFile"
    }
    catch {
        Write-WarningLog "Failed to save process IDs: $($_.Exception.Message)"
    }
}

# Display status dashboard
function Show-StatusDashboard {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Success
    Write-Host "           TELEHEALTH PLATFORM IS RUNNING SUCCESSFULLY!           " -ForegroundColor $Colors.Success
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Success
    Write-Host ""
    
    Write-Host "🌐 Application URLs:" -ForegroundColor $Colors.Highlight
    Write-Host "   • Frontend Application: " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3000" -ForegroundColor $Colors.Info
    Write-Host "   • Backend API: " -NoNewline -ForegroundColor White  
    Write-Host "http://localhost:3001" -ForegroundColor $Colors.Info
    Write-Host "   • API Health Check: " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:3001/health" -ForegroundColor $Colors.Info
    Write-Host "   • Database UI (Adminer): " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:8080" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "🗄️  Infrastructure:" -ForegroundColor $Colors.Highlight
    Write-Host "   • PostgreSQL Database: " -NoNewline -ForegroundColor White
    Write-Host "localhost:5432" -ForegroundColor $Colors.Info
    Write-Host "   • Redis Cache: " -NoNewline -ForegroundColor White
    Write-Host "localhost:6379" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "🔑 Default Credentials:" -ForegroundColor $Colors.Highlight
    Write-Host "   • Database User: " -NoNewline -ForegroundColor White
    Write-Host "telehealth_user" -ForegroundColor $Colors.Info
    Write-Host "   • Database Password: " -NoNewline -ForegroundColor White
    Write-Host "secure_password" -ForegroundColor $Colors.Info
    Write-Host "   • Database Name: " -NoNewline -ForegroundColor White
    Write-Host "telehealth_db" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "📊 Process Information:" -ForegroundColor $Colors.Highlight
    if ($Global:BackendProcess -and -not $Global:BackendProcess.HasExited) {
        Write-Host "   • Backend PID: " -NoNewline -ForegroundColor White
        Write-Host "$($Global:BackendProcess.Id)" -ForegroundColor $Colors.Info
    }
    if ($Global:FrontendProcess -and -not $Global:FrontendProcess.HasExited) {
        Write-Host "   • Frontend PID: " -NoNewline -ForegroundColor White
        Write-Host "$($Global:FrontendProcess.Id)" -ForegroundColor $Colors.Info
    }
    Write-Host "   • Started: " -NoNewline -ForegroundColor White
    Write-Host "$(Get-Date $Global:StartTime -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor $Colors.Info
    Write-Host "   • Log File: " -NoNewline -ForegroundColor White
    Write-Host "$Global:LogFile" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "🛑 Management:" -ForegroundColor $Colors.Highlight
    Write-Host "   • Stop All Services: " -NoNewline -ForegroundColor White
    Write-Host ".\stop-telehealth.ps1" -ForegroundColor $Colors.Info
    Write-Host "   • View Logs: " -NoNewline -ForegroundColor White
    Write-Host "Get-Content $Global:LogFile -Wait" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "📚 Documentation:" -ForegroundColor $Colors.Highlight
    Write-Host "   • README.md for detailed API documentation" -ForegroundColor White
    Write-Host "   • Check the logs directory for detailed startup logs" -ForegroundColor White
    Write-Host ""
    
    $uptime = New-TimeSpan -Start $Global:StartTime -End (Get-Date)
    Write-Host "⏱️  Platform has been running for: " -NoNewline -ForegroundColor $Colors.Highlight
    Write-Host "$($uptime.Hours)h $($uptime.Minutes)m $($uptime.Seconds)s" -ForegroundColor $Colors.Success
    Write-Host ""
}

# Cleanup function
function Invoke-Cleanup {
    Write-InfoLog "Initiating cleanup process..."
    
    try {
        # Stop Node.js processes
        if ($Global:BackendProcess -and -not $Global:BackendProcess.HasExited) {
            Write-InfoLog "Stopping backend server..."
            Stop-Process -Id $Global:BackendProcess.Id -Force -ErrorAction SilentlyContinue
        }
        
        if ($Global:FrontendProcess -and -not $Global:FrontendProcess.HasExited) {
            Write-InfoLog "Stopping frontend server..."
            Stop-Process -Id $Global:FrontendProcess.Id -Force -ErrorAction SilentlyContinue
        }
        
        # Clean up PID file
        if (Test-Path $Global:PIDFile) {
            Remove-Item $Global:PIDFile -Force -ErrorAction SilentlyContinue
        }
        
        Write-SuccessLog "Cleanup completed"
    }
    catch {
        Write-WarningLog "Cleanup encountered issues: $($_.Exception.Message)"
    }
}

# Main execution function
function Start-TelehealthPlatform {
    try {
        Show-Header
        Test-Prerequisites
        Initialize-Environment
        Install-Dependencies
        Start-DockerServices
        Initialize-Database
        Start-BackendServer
        Start-FrontendServer
        Save-ProcessIDs
        Show-StatusDashboard
        
        Write-InfoLog "Telehealth platform startup completed successfully!"
        Write-InfoLog "Press Ctrl+C to stop all services"
        
        # Keep script running and monitor processes
        while ($true) {
            Start-Sleep -Seconds 30
            
            # Check if processes are still running
            if ($Global:BackendProcess -and $Global:BackendProcess.HasExited) {
                Write-WarningLog "Backend process has exited unexpectedly"
                break
            }
            
            if ($Global:FrontendProcess -and $Global:FrontendProcess.HasExited) {
                Write-WarningLog "Frontend process has exited unexpectedly"
                break
            }
        }
    }
    catch {
        Handle-Error "Main Execution" $_
    }
    finally {
        Invoke-Cleanup
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-Host "`nReceived shutdown signal..." -ForegroundColor Yellow
    Invoke-Cleanup
}

# Trap for Ctrl+C during execution
trap {
    Write-Host "`nShutdown requested..." -ForegroundColor Yellow
    Invoke-Cleanup
    exit 0
}

# Execute main function
Start-TelehealthPlatform