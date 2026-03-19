package com.picoclaw.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BootReceiver - Starts the Go backend service when device boots
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.i(TAG, "Device booted, starting GoBackendService");
            Intent serviceIntent = new Intent(context, GoBackendService.class);
            context.startForegroundService(serviceIntent);
        }
    }
}
