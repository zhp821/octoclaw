package com.picoclaw.app.plugin;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * BackendServicePlugin - Manages the PicoClaw backend service on Android
 *
 * This plugin handles:
 * 1. Extracting config.json from assets to app private directory
 * 2. Providing config path to the backend
 */
@CapacitorPlugin(name = "BackendService")
public class BackendServicePlugin extends Plugin {

    private static final String TAG = "BackendServicePlugin";
    private static final String CONFIG_FILE_NAME = "config.json";
    private static final String BACKEND_DIR = "backend";

    /**
     * Initialize the backend service
     * Extracts config.json from assets to private directory
     */
    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            Context context = getContext();

            // Create backend directory in app private storage
            File backendDir = new File(context.getFilesDir(), BACKEND_DIR);
            if (!backendDir.exists()) {
                backendDir.mkdirs();
            }

            // Extract config.json from assets
            File configFile = new File(backendDir, CONFIG_FILE_NAME);
            if (!configFile.exists()) {
                copyAssetToFile(context, CONFIG_FILE_NAME, configFile);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("configPath", configFile.getAbsolutePath());
            ret.put("backendDir", backendDir.getAbsolutePath());
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize backend service", e);
            call.reject("Initialization failed: " + e.getMessage());
        }
    }

    /**
     * Get the config file path
     */
    @PluginMethod
    public void getConfigPath(PluginCall call) {
        try {
            Context context = getContext();
            File backendDir = new File(context.getFilesDir(), BACKEND_DIR);
            File configFile = new File(backendDir, CONFIG_FILE_NAME);

            JSObject ret = new JSObject();
            ret.put("configPath", configFile.getAbsolutePath());
            ret.put("exists", configFile.exists());
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to get config path: " + e.getMessage());
        }
    }

    /**
     * Copy file from assets to filesystem
     */
    private void copyAssetToFile(Context context, String assetName, File outFile) throws IOException {
        InputStream in = null;
        OutputStream out = null;
        try {
            in = context.getAssets().open(assetName);
            out = new FileOutputStream(outFile);

            byte[] buffer = new byte[1024];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            out.flush();
            Log.i(TAG, "Copied asset " + assetName + " to " + outFile.getAbsolutePath());
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    Log.w(TAG, "Failed to close input stream", e);
                }
            }
            if (out != null) {
                try {
                    out.close();
                } catch (IOException e) {
                    Log.w(TAG, "Failed to close output stream", e);
                }
            }
        }
    }
}
