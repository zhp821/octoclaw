package com.picoclaw.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private String pendingRoute = null;
    private boolean navigated = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Intent intent = getIntent();
        if (intent != null && intent.hasExtra("route")) {
            pendingRoute = intent.getStringExtra("route");
        }
        
        super.onCreate(savedInstanceState);
        Log.i(TAG, "MainActivity created, pendingRoute: " + pendingRoute);
    }
    
    @Override
    public void onStart() {
        super.onStart();
        Log.i(TAG, "onStart called");
        setupWebViewClient();
        tryNavigate();
    }
    
    private void setupWebViewClient() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    // Open external links in system browser
                    if (url != null && (url.startsWith("http://") || url.startsWith("https://")) && !url.contains("localhost") && !url.contains("127.0.0.1")) {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    }
                    return false;
                }
                
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    if (url != null && (url.startsWith("http://") || url.startsWith("https://")) && !url.contains("localhost") && !url.contains("127.0.0.1")) {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    }
                    return false;
                }
            });
            Log.i(TAG, "WebViewClient set up for external links");
        }
    }
    
    private void tryNavigate() {
        if (pendingRoute != null && !navigated) {
            final String route = pendingRoute;
            pendingRoute = null;
            navigated = true;
            
            Log.i(TAG, "Scheduling navigation to: " + route);
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    String url = "http://localhost:18800" + route;
                    webView.loadUrl(url);
                    Log.i(TAG, "Navigated to: " + url);
                } else {
                    Log.e(TAG, "WebView is null, cannot navigate");
                }
            }, 2000);
        }
    }
}
