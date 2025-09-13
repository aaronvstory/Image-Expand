# Comprehensive Logging Setup Research for Vite + React Applications

## Executive Summary
This research document provides detailed strategies for implementing comprehensive logging in a Vite + React development environment, with focus on capturing browser console logs in the terminal, verbose server logging, and PowerShell integration.

## 1. Vite Dev Server Verbose Logging Configuration

### Built-in Vite Logging Options

#### Server Configuration with Custom Logger
```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // Enable detailed server logging
  logLevel: 'info', // Options: 'error' | 'warn' | 'info' | 'silent'
  
  // Custom logger configuration
  customLogger: {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
    clearScreen: (type) => {
      // Disable clear screen for better log persistence
      if (process.env.VITE_NO_CLEAR === 'true') return;
      console.clear();
    }
  },
  
  server: {
    // Enable CORS debugging
    cors: { 
      credentials: true,
      origin: (origin, callback) => {
        console.log(`[CORS] Request from origin: ${origin}`);
        callback(null, true);
      }
    },
    
    // HMR verbose logging
    hmr: {
      overlay: true,
      protocol: 'ws',
      clientPort: 5173,
      timeout: 120000
    }
  }
});
```

#### Environment Variable Configuration
```bash
# .env.development
VITE_LOG_LEVEL=debug
VITE_NO_CLEAR=true
DEBUG=vite:*
```

#### Package.json Scripts with Debug Flags
```json
{
  "scripts": {
    "dev:verbose": "cross-env DEBUG=vite:* vite --debug --force",
    "dev:trace": "cross-env NODE_OPTIONS='--trace-warnings' vite",
    "dev:inspect": "node --inspect-brk ./node_modules/.bin/vite"
  }
}
```

## 2. Browser Console Automatic Logging Capture Methods

### Method 1: Vite Plugin for Console Interception
```typescript
// plugins/console-logger.ts
import { Plugin } from 'vite';

export function consoleLoggerPlugin(): Plugin {
  return {
    name: 'console-logger',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `<script>
          (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            const originalInfo = console.info;
            
            const sendToServer = (level, args) => {
              fetch('/__console', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  level,
                  timestamp: new Date().toISOString(),
                  message: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                  ).join(' ')
                })
              }).catch(() => {});
            };
            
            console.log = function(...args) {
              originalLog.apply(console, args);
              sendToServer('log', args);
            };
            
            console.error = function(...args) {
              originalError.apply(console, args);
              sendToServer('error', args);
            };
            
            console.warn = function(...args) {
              originalWarn.apply(console, args);
              sendToServer('warn', args);
            };
            
            console.info = function(...args) {
              originalInfo.apply(console, args);
              sendToServer('info', args);
            };
            
            // Capture unhandled errors
            window.addEventListener('error', (e) => {
              sendToServer('error', [e.message, e.filename, e.lineno, e.colno]);
            });
            
            // Capture unhandled promise rejections
            window.addEventListener('unhandledrejection', (e) => {
              sendToServer('error', ['Unhandled Promise Rejection:', e.reason]);
            });
          })();
        </script>
        </head>`
      );
    },
    
    configureServer(server) {
      server.middlewares.use('/__console', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            const { level, timestamp, message } = JSON.parse(body);
            const color = {
              log: '\x1b[37m',
              error: '\x1b[31m',
              warn: '\x1b[33m',
              info: '\x1b[36m'
            }[level] || '\x1b[37m';
            
            console.log(`${color}[Browser ${level.toUpperCase()}] ${timestamp}: ${message}\x1b[0m`);
            res.end('ok');
          });
        }
      });
    }
  };
}
```

### Method 2: WebSocket-Based Real-time Logging
```typescript
// plugins/websocket-logger.ts
import { Plugin } from 'vite';
import { WebSocketServer } from 'ws';

export function websocketLoggerPlugin(): Plugin {
  let wss: WebSocketServer;
  
  return {
    name: 'websocket-logger',
    
    configureServer(server) {
      wss = new WebSocketServer({ port: 8080 });
      
      wss.on('connection', (ws) => {
        console.log('[Logger] Browser console connected');
        
        ws.on('message', (data) => {
          const log = JSON.parse(data.toString());
          const timestamp = new Date().toISOString();
          
          switch(log.level) {
            case 'error':
              console.error(`\x1b[31m[Browser] ${timestamp}: ${log.message}\x1b[0m`);
              break;
            case 'warn':
              console.warn(`\x1b[33m[Browser] ${timestamp}: ${log.message}\x1b[0m`);
              break;
            case 'info':
              console.info(`\x1b[36m[Browser] ${timestamp}: ${log.message}\x1b[0m`);
              break;
            default:
              console.log(`[Browser] ${timestamp}: ${log.message}`);
          }
        });
      });
    },
    
    transformIndexHtml(html) {
      return html.replace(
        '</body>',
        `<script>
          const ws = new WebSocket('ws://localhost:8080');
          const methods = ['log', 'error', 'warn', 'info'];
          
          methods.forEach(method => {
            const original = console[method];
            console[method] = function(...args) {
              original.apply(console, args);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  level: method,
                  message: args.map(a => 
                    typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
                  ).join(' ')
                }));
              }
            };
          });
        </script>
        </body>`
      );
    }
  };
}
```

## 3. PowerShell Transcript and Output Redirection Techniques

### PowerShell Transcript Logging
```powershell
# start-dev-with-logging.ps1
param(
    [string]$LogPath = ".\logs\dev-session-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"
)

# Create logs directory if it doesn't exist
$LogDir = Split-Path $LogPath -Parent
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# Start transcript
Start-Transcript -Path $LogPath -Append

# Set error action preference
$ErrorActionPreference = "Continue"

# Function to write colored output that also goes to transcript
function Write-ColorOutput {
    param(
        [string]$Message,
        [ConsoleColor]$ForegroundColor = 'White'
    )
    Write-Host $Message -ForegroundColor $ForegroundColor
    Add-Content -Path $LogPath -Value "[$ForegroundColor] $Message"
}

# Environment setup
Write-ColorOutput "Starting Vite Development Server with Enhanced Logging" -ForegroundColor Green
Write-ColorOutput "Log file: $LogPath" -ForegroundColor Cyan
Write-ColorOutput "Timestamp: $(Get-Date)" -ForegroundColor Yellow

# Set environment variables
$env:NODE_ENV = "development"
$env:DEBUG = "vite:*"
$env:VITE_LOG_LEVEL = "debug"

# Start Vite with output capture
$ViteProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" `
    -PassThru -NoNewWindow -RedirectStandardOutput ".\logs\vite-stdout.log" `
    -RedirectStandardError ".\logs\vite-stderr.log"

# Monitor output files
$StdOutWatcher = Start-Job -ScriptBlock {
    param($LogFile)
    Get-Content $LogFile -Wait | ForEach-Object {
        Write-Host "[VITE OUT] $_" -ForegroundColor Green
    }
} -ArgumentList ".\logs\vite-stdout.log"

$StdErrWatcher = Start-Job -ScriptBlock {
    param($LogFile)
    Get-Content $LogFile -Wait | ForEach-Object {
        Write-Host "[VITE ERR] $_" -ForegroundColor Red
    }
} -ArgumentList ".\logs\vite-stderr.log"

# Wait for process or user interrupt
try {
    $ViteProcess.WaitForExit()
} finally {
    Stop-Job $StdOutWatcher, $StdErrWatcher
    Remove-Job $StdOutWatcher, $StdErrWatcher
    Stop-Transcript
}
```

### Advanced PowerShell Tee-Object Pattern
```powershell
# dev-with-tee.ps1
$LogFile = ".\logs\dev-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Run npm dev and capture all output
& npm run dev 2>&1 | Tee-Object -FilePath $LogFile | ForEach-Object {
    if ($_ -match "error|fail|exception") {
        Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match "warn|warning") {
        Write-Host $_ -ForegroundColor Yellow
    } elseif ($_ -match "success|ready|compiled") {
        Write-Host $_ -ForegroundColor Green
    } else {
        Write-Host $_
    }
}
```

## 4. Ways to Inject Logging Scripts into React Apps During Development

### Method 1: React Component Logger HOC
```typescript
// utils/withLogging.tsx
import React, { useEffect, useRef } from 'react';

export function withLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return (props: P) => {
    const renderCount = useRef(0);
    const previousProps = useRef<P>();
    
    useEffect(() => {
      renderCount.current++;
      console.group(`[${componentName}] Render #${renderCount.current}`);
      console.log('Props:', props);
      
      if (previousProps.current) {
        const changes = Object.keys(props as any).filter(
          key => (props as any)[key] !== (previousProps.current as any)[key]
        );
        if (changes.length > 0) {
          console.log('Changed props:', changes);
        }
      }
      
      console.groupEnd();
      previousProps.current = props;
    });
    
    useEffect(() => {
      console.log(`[${componentName}] Mounted`);
      return () => console.log(`[${componentName}] Unmounted`);
    }, []);
    
    return <Component {...props} />;
  };
}
```

### Method 2: Global Development Logger
```typescript
// utils/devLogger.ts
class DevLogger {
  private enabled: boolean;
  private buffer: any[] = [];
  private ws: WebSocket | null = null;
  
  constructor() {
    this.enabled = import.meta.env.DEV;
    
    if (this.enabled) {
      this.connectWebSocket();
      this.overrideConsoleMethods();
      this.setupPerformanceMonitoring();
      this.setupNetworkMonitoring();
    }
  }
  
  private connectWebSocket() {
    try {
      this.ws = new WebSocket('ws://localhost:8080');
      this.ws.onopen = () => {
        console.log('[DevLogger] Connected to logging server');
        this.flushBuffer();
      };
    } catch (e) {
      console.warn('[DevLogger] Could not connect to logging server');
    }
  }
  
  private overrideConsoleMethods() {
    const methods = ['log', 'error', 'warn', 'info', 'debug'];
    
    methods.forEach(method => {
      const original = (console as any)[method];
      (console as any)[method] = (...args: any[]) => {
        original.apply(console, args);
        this.send(method, args);
      };
    });
  }
  
  private setupPerformanceMonitoring() {
    // Log React renders
    if (typeof window !== 'undefined' && (window as any).React) {
      const React = (window as any).React;
      const originalCreateElement = React.createElement;
      
      React.createElement = (type: any, ...args: any[]) => {
        if (typeof type === 'function' && type.name) {
          this.send('render', [`Component rendered: ${type.name}`]);
        }
        return originalCreateElement.apply(React, [type, ...args]);
      };
    }
    
    // Log performance metrics
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.send('performance', [{
            name: entry.name,
            type: entry.entryType,
            duration: entry.duration,
            startTime: entry.startTime
          }]);
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
  }
  
  private setupNetworkMonitoring() {
    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const [url, options] = args;
      
      this.send('network', [`[FETCH START] ${options?.method || 'GET'} ${url}`]);
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        this.send('network', [
          `[FETCH END] ${options?.method || 'GET'} ${url} - ${response.status} (${duration.toFixed(2)}ms)`
        ]);
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.send('error', [
          `[FETCH ERROR] ${options?.method || 'GET'} ${url} - ${error} (${duration.toFixed(2)}ms)`
        ]);
        throw error;
      }
    };
    
    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._method = method;
      this._url = url;
      this._startTime = performance.now();
      return originalXHROpen.apply(this, [method, url, ...args] as any);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
      const logger = window.devLogger;
      
      this.addEventListener('load', function() {
        const duration = performance.now() - this._startTime;
        logger.send('network', [
          `[XHR] ${this._method} ${this._url} - ${this.status} (${duration.toFixed(2)}ms)`
        ]);
      });
      
      this.addEventListener('error', function() {
        const duration = performance.now() - this._startTime;
        logger.send('error', [
          `[XHR ERROR] ${this._method} ${this._url} (${duration.toFixed(2)}ms)`
        ]);
      });
      
      return originalXHRSend.apply(this, args);
    };
  }
  
  private send(level: string, args: any[]) {
    const log = {
      level,
      timestamp: new Date().toISOString(),
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(log));
    } else {
      this.buffer.push(log);
    }
  }
  
  private flushBuffer() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.buffer.forEach(log => this.ws!.send(JSON.stringify(log)));
      this.buffer = [];
    }
  }
}

// Initialize on app start
if (import.meta.env.DEV) {
  (window as any).devLogger = new DevLogger();
}

export default DevLogger;
```

### Method 3: React DevTools Integration
```typescript
// utils/reactDevToolsLogger.ts
export function setupReactDevToolsLogging() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    // Hook into React DevTools
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    
    if (hook) {
      // Log component updates
      hook.onCommitFiberRoot = (function(original) {
        return function(id: any, root: any, priorityLevel: any) {
          const result = original?.apply(this, arguments);
          
          // Extract render information
          const updates: string[] = [];
          const traverse = (fiber: any) => {
            if (fiber.elementType && fiber.elementType.name) {
              updates.push(fiber.elementType.name);
            }
            if (fiber.child) traverse(fiber.child);
            if (fiber.sibling) traverse(fiber.sibling);
          };
          
          if (root.current) {
            traverse(root.current);
            if (updates.length > 0) {
              console.log('[React Render]', updates.join(', '));
            }
          }
          
          return result;
        };
      })(hook.onCommitFiberRoot);
    }
  }
}
```

## 5. Methods to Display Browser Console Logs in Terminal

### Method 1: Puppeteer Integration for E2E with Console Capture
```typescript
// scripts/dev-with-puppeteer.ts
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

async function startDevWithLogging() {
  // Start Vite dev server
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['inherit', 'pipe', 'pipe']
  });
  
  // Wait for server to be ready
  await new Promise(resolve => {
    viteProcess.stdout?.on('data', (data) => {
      console.log(`[Vite] ${data}`);
      if (data.toString().includes('ready in')) {
        resolve(true);
      }
    });
  });
  
  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', (msg) => {
    const type = msg.type();
    const color = {
      'error': '\x1b[31m',
      'warning': '\x1b[33m',
      'info': '\x1b[36m',
      'log': '\x1b[37m'
    }[type] || '\x1b[37m';
    
    console.log(`${color}[Browser ${type.toUpperCase()}] ${msg.text()}\x1b[0m`);
  });
  
  // Capture page errors
  page.on('pageerror', (error) => {
    console.error('\x1b[31m[Browser ERROR]', error.message, '\x1b[0m');
  });
  
  // Capture request failures
  page.on('requestfailed', (request) => {
    console.error('\x1b[31m[Network ERROR]', request.url(), request.failure()?.errorText, '\x1b[0m');
  });
  
  await page.goto('http://localhost:5173');
  
  // Keep running
  process.on('SIGINT', async () => {
    await browser.close();
    viteProcess.kill();
    process.exit(0);
  });
}

startDevWithLogging().catch(console.error);
```

### Method 2: Chrome DevTools Protocol (CDP) Integration
```typescript
// scripts/cdp-logger.ts
import CDP from 'chrome-remote-interface';

async function setupCDPLogging() {
  const client = await CDP({
    host: 'localhost',
    port: 9222
  });
  
  const { Runtime, Console } = client;
  
  await Promise.all([
    Runtime.enable(),
    Console.enable()
  ]);
  
  // Listen for console API calls
  Runtime.consoleAPICalled((params) => {
    const { type, args, timestamp } = params;
    const messages = args.map(arg => {
      if (arg.type === 'string') return arg.value;
      if (arg.type === 'object') return JSON.stringify(arg.preview);
      return arg.description || arg.type;
    }).join(' ');
    
    console.log(`[CDP ${type}] ${new Date(timestamp).toISOString()}: ${messages}`);
  });
  
  // Listen for exceptions
  Runtime.exceptionThrown((params) => {
    const { exceptionDetails } = params;
    console.error('[CDP Exception]', exceptionDetails.text);
    if (exceptionDetails.stackTrace) {
      console.error('Stack:', exceptionDetails.stackTrace.callFrames.map(f => 
        `  at ${f.functionName || '<anonymous>'} (${f.url}:${f.lineNumber}:${f.columnNumber})`
      ).join('\n'));
    }
  });
}
```

### Method 3: Service Worker Interceptor
```typescript
// public/sw-logger.js
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'LOG') {
    // Forward to server
    fetch('/__console', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event.data.payload)
    });
  }
});

// Intercept all fetch requests for logging
self.addEventListener('fetch', (event) => {
  const startTime = Date.now();
  
  event.respondWith(
    fetch(event.request).then(response => {
      const duration = Date.now() - startTime;
      
      // Log to server
      fetch('/__console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'network',
          message: `${event.request.method} ${event.request.url} - ${response.status} (${duration}ms)`
        })
      });
      
      return response;
    })
  );
});
```

## 6. Complete Implementation Example

### Full Vite Configuration with All Logging Features
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { consoleLoggerPlugin } from './plugins/console-logger';
import { websocketLoggerPlugin } from './plugins/websocket-logger';

export default defineConfig({
  plugins: [
    consoleLoggerPlugin(),
    websocketLoggerPlugin()
  ],
  
  logLevel: 'info',
  
  server: {
    host: true,
    strictPort: true,
    
    // Middleware for additional logging
    configure: (app) => {
      // Log all requests
      app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - start;
          console.log(`[HTTP] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
        });
        next();
      });
    }
  },
  
  build: {
    // Source maps for debugging
    sourcemap: true,
    
    // Verbose rollup output
    rollupOptions: {
      onwarn(warning, warn) {
        console.log('[Build Warning]', warning);
        warn(warning);
      }
    }
  },
  
  // Custom environment variables
  define: {
    '__DEV_LOGGING__': JSON.stringify(true),
    '__LOG_LEVEL__': JSON.stringify(process.env.LOG_LEVEL || 'debug')
  }
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "dev:verbose": "cross-env DEBUG=vite:* NODE_OPTIONS='--trace-warnings' vite --debug",
    "dev:logged": "node scripts/start-with-logging.js",
    "dev:puppeteer": "ts-node scripts/dev-with-puppeteer.ts",
    "dev:powershell": "powershell -ExecutionPolicy Bypass -File ./scripts/start-dev-with-logging.ps1",
    "logs:tail": "tail -f logs/*.log",
    "logs:clean": "rm -rf logs/*.log"
  }
}
```

### Entry Point with Logging Setup
```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './utils/devLogger';
import { setupReactDevToolsLogging } from './utils/reactDevToolsLogger';

// Initialize development logging
if (import.meta.env.DEV) {
  console.log('[App] Development mode - Enhanced logging enabled');
  setupReactDevToolsLogging();
  
  // Log performance metrics
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.table({
      'DNS Lookup': `${perfData.domainLookupEnd - perfData.domainLookupStart}ms`,
      'TCP Connection': `${perfData.connectEnd - perfData.connectStart}ms`,
      'Request': `${perfData.responseStart - perfData.requestStart}ms`,
      'Response': `${perfData.responseEnd - perfData.responseStart}ms`,
      'DOM Processing': `${perfData.domComplete - perfData.domInteractive}ms`,
      'Load Event': `${perfData.loadEventEnd - perfData.loadEventStart}ms`,
      'Total': `${perfData.loadEventEnd - perfData.fetchStart}ms`
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Recommendations

### Priority Implementation Order
1. **Vite Plugin for Console Interception** - Easiest to implement, provides immediate value
2. **PowerShell Transcript Logging** - Simple wrapper for Windows development
3. **Global Development Logger** - Comprehensive solution for React apps
4. **WebSocket-Based Logging** - Real-time, bidirectional communication
5. **Puppeteer/CDP Integration** - Advanced debugging and E2E testing

### Best Practices
1. **Environment-specific**: Only enable verbose logging in development
2. **Performance-aware**: Use throttling/debouncing for high-frequency logs
3. **Structured logging**: Use consistent log formats (JSON preferred)
4. **Log rotation**: Implement file size limits and rotation policies
5. **Privacy**: Never log sensitive data (passwords, tokens, PII)
6. **Filtering**: Implement log level filtering (debug, info, warn, error)
7. **Timestamps**: Always include ISO timestamps for correlation
8. **Context**: Include component names, request IDs, user sessions

### Security Considerations
1. Ensure logging endpoints are disabled in production
2. Validate and sanitize all logged data
3. Use authentication for WebSocket connections in staging
4. Implement rate limiting for log endpoints
5. Never expose internal paths or sensitive configuration

## Conclusion

This comprehensive logging setup provides multiple layers of visibility into your Vite + React application:
- Server-side logging captures build and HMR events
- Browser console interception forwards client logs to terminal
- PowerShell transcripts provide session recording
- React-specific logging tracks component lifecycle
- Network monitoring captures API interactions

Choose the methods that best fit your debugging needs and development workflow. The modular approach allows you to enable/disable specific logging features as needed.