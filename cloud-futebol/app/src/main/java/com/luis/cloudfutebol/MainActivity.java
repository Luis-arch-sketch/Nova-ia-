package com.luis.cloudfutebol;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

public class MainActivity extends Activity {
    private WebView web;
    private FrameLayout root;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private String controllerScript = "";
    private TextView padToggle;
    private int dp(float n) { return Math.round(n * getResources().getDisplayMetrics().density); }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setSystemUiVisibility(5894 | 1024 | 512);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8,15,24));
        setContentView(root);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        WebSettings options = web.getSettings();
        options.setJavaScriptEnabled(true);
        options.setDomStorageEnabled(true);
        options.setMediaPlaybackRequiresUserGesture(false);
        options.setSupportMultipleWindows(false);
        options.setJavaScriptCanOpenWindowsAutomatically(false);
        options.setLoadWithOverviewMode(true);
        options.setUseWideViewPort(true);
        String agent = options.getUserAgentString();
        options.setUserAgentString(agent.replace("; wv","").replace("Version/4.0 ",""));
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,true);
        controllerScript = readAsset("gamepad.js");
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(web, controllerScript, Collections.singleton("https://www.xbox.com"));
        }
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view,url);
                if (url != null && url.startsWith("https://www.xbox.com/")) {
                    view.evaluateJavascript(controllerScript,null);
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View view, CustomViewCallback cb) {
                if (fullscreenView != null) { cb.onCustomViewHidden(); return; }
                fullscreenView=view;
                fullscreenCallback=cb;
                root.addView(view,new FrameLayout.LayoutParams(-1,-1));
                padToggle.bringToFront();
            }
            @Override public void onHideCustomView() {
                if (fullscreenView != null) {
                    root.removeView(fullscreenView);
                    fullscreenView=null;
                    if (fullscreenCallback != null) fullscreenCallback.onCustomViewHidden();
                    fullscreenCallback=null;
                }
            }
        });
        padToggle = new TextView(this);
        padToggle.setText("🎮");
        padToggle.setTextSize(23);
        padToggle.setTextColor(Color.WHITE);
        padToggle.setGravity(Gravity.CENTER);
        padToggle.setBackgroundColor(0xBB15263B);
        FrameLayout.LayoutParams p=new FrameLayout.LayoutParams(dp(54),dp(54),Gravity.RIGHT|Gravity.TOP);
        p.topMargin=dp(8);p.rightMargin=dp(10);
        root.addView(padToggle,p);
        padToggle.setOnClickListener(v -> web.evaluateJavascript("(function(){if(window.CloudPad){window.CloudPad.toggle()}else{alert('Abra o Xbox Cloud antes de ativar o controle.')}})();",null));
        padToggle.setOnLongClickListener(v->{web.reload();return true;});
        web.loadUrl("https://www.xbox.com/pt-BR/play");
    }
    private String readAsset(String path) {
        try (InputStream in = getAssets().open(path)) {
            byte[] bytes = new byte[in.available()];
            int count = in.read(bytes);
            return count > 0 ? new String(bytes,0,count,StandardCharsets.UTF_8) : "";
        } catch(Exception ignored) {return "";}
    }
    @Override public void onBackPressed() {
        if (fullscreenView != null) {
            if (fullscreenCallback != null) fullscreenCallback.onCustomViewHidden();
            root.removeView(fullscreenView);
            fullscreenView=null;fullscreenCallback=null;
        } else if(web != null && web.canGoBack()) { web.goBack(); }
        else {super.onBackPressed();}
    }
    @Override protected void onDestroy(){
        if(web!=null){web.destroy();web=null;}
        super.onDestroy();
    }
}
