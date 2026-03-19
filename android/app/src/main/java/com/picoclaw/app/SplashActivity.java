package com.picoclaw.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class SplashActivity extends Activity {
    private static final String TAG = "SplashActivity";
    private static final int MAX_RETRIES = 30;
    private static final int RETRY_DELAY_MS = 500;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.parseColor("#1a1a2e"));
        int padding = (int) (48 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding, padding, padding);
        
        // Logo
        ImageView logoView = new ImageView(this);
        logoView.setImageResource(R.drawable.logo);
        int logoWidth = (int) (200 * getResources().getDisplayMetrics().density);
        int logoHeight = (int) (80 * getResources().getDisplayMetrics().density);
        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(logoWidth, logoHeight);
        logoParams.bottomMargin = (int) (32 * getResources().getDisplayMetrics().density);
        logoView.setLayoutParams(logoParams);
        layout.addView(logoView);
        
        // Progress bar
        ProgressBar progressBar = new ProgressBar(this);
        progressBar.setIndeterminateTintList(android.content.res.ColorStateList.valueOf(Color.parseColor("#4cc9f0")));
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        progressParams.bottomMargin = (int) (24 * getResources().getDisplayMetrics().density);
        progressBar.setLayoutParams(progressParams);
        layout.addView(progressBar);
        
        // Status text
        TextView statusText = new TextView(this);
        statusText.setText("正在启动...");
        statusText.setTextColor(Color.parseColor("#a0a0a0"));
        statusText.setTextSize(14);
        layout.addView(statusText);
        
        setContentView(layout);
        
        startGoBackend();
        waitForBackend();
    }
    
    private void startGoBackend() {
        Intent serviceIntent = new Intent(this, GoBackendService.class);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
        Log.i(TAG, "GoBackendService started");
    }
    
    private void waitForBackend() {
        new Thread(() -> {
            for (int i = 0; i < MAX_RETRIES; i++) {
                try {
                    java.net.URL url = new java.net.URL("http://127.0.0.1:18800/api/models");
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(2000);
                    conn.setReadTimeout(2000);
                    
                    if (conn.getResponseCode() == 200) {
                        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
                        StringBuilder response = new StringBuilder();
                        String line;
                        while ((line = br.readLine()) != null) {
                            response.append(line);
                        }
                        br.close();
                        
                        org.json.JSONObject resp = new org.json.JSONObject(response.toString());
                        int total = resp.optInt("total", 0);
                        String defaultModel = resp.optString("default_model", "");
                        
                        boolean hasModel = total > 0 && !defaultModel.isEmpty();
                        Log.i(TAG, "Models: total=" + total + ", default=" + defaultModel + ", hasModel=" + hasModel);
                        
                        boolean finalHasModel = hasModel;
                        runOnUiThread(() -> proceedToMain(finalHasModel));
                        return;
                    }
                } catch (Exception e) {
                    Log.d(TAG, "Backend not ready, retry " + i + ": " + e.getMessage());
                }
                
                try {
                    Thread.sleep(RETRY_DELAY_MS);
                } catch (InterruptedException e) {
                    break;
                }
            }
            
            runOnUiThread(() -> proceedToMain(false));
        }).start();
    }
    
    private void proceedToMain(boolean hasModel) {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent intent = new Intent(this, MainActivity.class);
            if (!hasModel) {
                intent.putExtra("route", "/models");
            }
            startActivity(intent);
            finish();
        }, 300);
    }
}