package com.picoclaw.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;

/**
 * GoBackendService - Android Service that runs the Go backend binaries
 *
 * This service:
 * 1. Extracts the Go binaries from assets to app private directory
 * 2. Extracts config.json from assets
 * 3. Starts the Android server which:
 *    - Serves frontend static files on port 18800
 *    - Proxies API requests to the PicoClaw gateway on port 18801
 * 4. Monitors the process and restarts if needed
 */
public class GoBackendService extends Service {
    private static final String TAG = "GoBackendService";
    private static final String CHANNEL_ID = "GoBackendChannel";
    private static final int NOTIFICATION_ID = 1;
    private static final String BACKEND_BINARY = "libpicoclaw-web.so";
    private static final String CONFIG_NAME = "config.json";
    private static final String BACKEND_DIR = "backend";

    private Process serverProcess;
    private Thread outputThread;
    private Thread errorThread;
    private String backendExePath = null;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "GoBackendService created");
        
        // Backend executable is in native library dir (packaged as .so for execution permission)
        backendExePath = getApplicationInfo().nativeLibraryDir + "/" + BACKEND_BINARY;
        Log.i(TAG, "Backend executable path: " + backendExePath);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "GoBackendService started");

        // Create notification for foreground service
        createNotificationChannel();
        Notification notification = createNotification();
        startForeground(NOTIFICATION_ID, notification);

        // Start backend in background thread
        new Thread(this::startBackend).start();

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "GoBackendService destroyed");
        stopBackend();
    }

    /**
     * Start the backend processes
     */
    private void startBackend() {
        try {
            // Set up PicoClaw home directory (used by both web and gateway)
            File picoHome = new File(getFilesDir(), ".picoclaw");
            if (!picoHome.exists()) {
                picoHome.mkdirs();
            }

            // Create workspace directory
            File workspaceDir = new File(picoHome, "workspace");
            if (!workspaceDir.exists()) {
                workspaceDir.mkdirs();
            }

            // Create logs directory
            File logsDir = new File(picoHome, "logs");
            if (!logsDir.exists()) {
                logsDir.mkdirs();
            }

            // Create backend directory for config
            File backendDir = new File(getFilesDir(), BACKEND_DIR);
            if (!backendDir.exists()) {
                backendDir.mkdirs();
            }

            // Create etc directory with resolv.conf for Go DNS resolution
            // Go looks for /etc/resolv.conf relative to the current working directory
            File etcInBackend = new File(backendDir, "etc");
            if (!etcInBackend.exists()) {
                etcInBackend.mkdirs();
            }
            File resolvConf = new File(etcInBackend, "resolv.conf");
            try (FileOutputStream out = new FileOutputStream(resolvConf)) {
                // Use Google public DNS servers
                out.write("nameserver 8.8.8.8\nnameserver 8.8.4.4\n".getBytes());
                Log.i(TAG, "Created resolv.conf at " + resolvConf.getAbsolutePath());
            } catch (IOException e) {
                Log.e(TAG, "Failed to create resolv.conf", e);
            }

            // Extract config
            File configFile = new File(backendDir, CONFIG_NAME);
            if (!configFile.exists()) {
                try {
                    extractAsset(CONFIG_NAME, configFile);
                } catch (IOException e) {
                    // No config in assets, create empty config file
                    // Go backend will initialize it via onboard process
                    Log.i(TAG, "No config.json in assets, creating empty config file");
                    try (FileOutputStream out = new FileOutputStream(configFile)) {
                        out.write("{}".getBytes());
                    } catch (IOException e2) {
                        Log.e(TAG, "Failed to create empty config file", e2);
                    }
                }
            }

            // Stop existing process if any
            stopBackend();

            // Verify backend executable exists
            File backendFile = new File(backendExePath);
            if (!backendFile.exists()) {
                Log.e(TAG, "Backend executable not found: " + backendExePath);
                return;
            }
            Log.i(TAG, "Backend executable exists: " + backendFile.getAbsolutePath());
            Log.i(TAG, "Backend file length: " + backendFile.length());
            Log.i(TAG, "Backend canExecute: " + backendFile.canExecute());
            Log.i(TAG, "PicoClaw Home: " + picoHome.getAbsolutePath());
            Log.i(TAG, "Workspace: " + workspaceDir.getAbsolutePath());

            // Start picoclaw-web using sh -c to avoid direct execution issues
            ProcessBuilder pb = new ProcessBuilder(
                    "sh",
                    "-c",
                    "\"" + backendExePath + "\" -public \"" + configFile.getAbsolutePath() + "\""
            );

            // Set environment variables
            pb.environment().put("PICOCLAW_CONFIG", configFile.getAbsolutePath());
            pb.environment().put("PICOCLAW_HOME", picoHome.getAbsolutePath());
            pb.environment().put("HOME", getFilesDir().getAbsolutePath());
            pb.environment().put("GODEBUG", "netdns=go");
            pb.directory(backendDir);
            pb.redirectErrorStream(true);

            Log.i(TAG, "Starting PicoClaw backend");
            Log.i(TAG, "Config path: " + configFile.getAbsolutePath());
            serverProcess = pb.start();

            // Start output monitoring threads
            outputThread = new Thread(() -> monitorStream(serverProcess.getInputStream(), "OUT"));
            errorThread = new Thread(() -> monitorStream(serverProcess.getErrorStream(), "ERR"));
            outputThread.start();
            errorThread.start();

            // Wait for process to complete
            int exitCode = serverProcess.waitFor();
            Log.i(TAG, "Android server exited with code: " + exitCode);

        } catch (Exception e) {
            Log.e(TAG, "Failed to start backend", e);
        }
    }

    /**
     * Stop the backend process
     */
    private void stopBackend() {
        if (serverProcess != null) {
            Log.i(TAG, "Stopping Android server");
            serverProcess.destroy();
            try {
                if (!serverProcess.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)) {
                    serverProcess.destroyForcibly();
                }
            } catch (InterruptedException e) {
                serverProcess.destroyForcibly();
            }
            serverProcess = null;
        }

        if (outputThread != null) {
            outputThread.interrupt();
            outputThread = null;
        }

        if (errorThread != null) {
            errorThread.interrupt();
            errorThread = null;
        }
    }

    /**
     * Monitor process output stream
     */
    private void monitorStream(InputStream stream, String tag) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                Log.d(TAG, "[" + tag + "] " + line);
            }
        } catch (IOException e) {
            if (!Thread.currentThread().isInterrupted()) {
                Log.e(TAG, "Error reading " + tag, e);
            }
        }
    }

    /**
     * Extract asset file to filesystem
     */
    private void extractAsset(String assetName, File outFile) throws IOException {
        Log.i(TAG, "Extracting asset: " + assetName + " to " + outFile.getAbsolutePath());

        try (InputStream in = getAssets().open(assetName);
             OutputStream out = new FileOutputStream(outFile)) {

            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            out.flush();
        }

        Log.i(TAG, "Extracted " + assetName + " successfully");
    }

    /**
     * Create notification channel for Android O+
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "PicoClaw Backend",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("PicoClaw Go Backend Service");

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    /**
     * Create foreground service notification
     */
    private Notification createNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
                .setContentTitle("PicoClaw Backend")
                .setContentText("Go backend service is running")
                .setSmallIcon(android.R.drawable.ic_menu_info_details)
                .setContentIntent(pendingIntent)
                .build();
    }
}
