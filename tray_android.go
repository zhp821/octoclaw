//go:build android

package main

import (
	"context"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/sipeed/picoclaw/pkg/gateway"
	"github.com/sipeed/picoclaw/pkg/logger"
	"github.com/sipeed/picoclaw/web/backend/utils"
)

func runTray() {
	logger.Infof("System tray is unavailable in %s builds; running without tray", runtime.GOOS)

	// Get config path - utils.GetDefaultConfigPath() checks PICOCLAW_CONFIG env var first
	configPath := utils.GetDefaultConfigPath()

	// Start gateway in-process (shares same process, but still uses separate port for WebSocket)
	go func() {
		logger.Info("Starting gateway in-process with config: " + configPath)
		err := gateway.Run(false, configPath, true)
		if err != nil {
			logger.Errorf("Gateway exited with error: %v", err)
		}
	}()

	if !*noBrowser {
		go func() {
			time.Sleep(browserDelay)
			if err := openBrowser(); err != nil {
				logger.Errorf("Warning: Failed to auto-open browser: %v", err)
			}
		}()
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	<-ctx.Done()
	shutdownApp()
}
