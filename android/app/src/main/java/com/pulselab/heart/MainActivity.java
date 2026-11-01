package com.pulselab.heart;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;

public final class MainActivity extends Activity {
  private static final String APP_URL = "https://appassets.androidplatform.net/assets/index.html";
  private WebView webView;

  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setStatusBarColor(Color.rgb(10, 10, 12));
    getWindow().setNavigationBarColor(Color.rgb(10, 10, 12));
    WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
        .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
        .build();
    webView = new WebView(this);
    webView.setBackgroundColor(Color.rgb(10, 10, 12));
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    webView.setWebViewClient(new WebViewClient() {
      @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        return assetLoader.shouldInterceptRequest(request.getUrl());
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        if ("appassets.androidplatform.net".equalsIgnoreCase(url.getHost())) return false;
        if ("https".equalsIgnoreCase(url.getScheme()) || "http".equalsIgnoreCase(url.getScheme())) {
          try { startActivity(new Intent(Intent.ACTION_VIEW, url)); } catch (Exception ignored) { }
        }
        return true;
      }
    });
    setContentView(webView);
    webView.loadUrl(APP_URL);
  }
  @Override public void onBackPressed() {
    if (webView != null && webView.canGoBack()) webView.goBack();
    else super.onBackPressed();
  }
  @Override protected void onDestroy() {
    if (webView != null) { webView.destroy(); webView=null; }
    super.onDestroy();
  }
}
