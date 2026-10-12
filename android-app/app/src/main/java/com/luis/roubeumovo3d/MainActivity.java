package com.luis.roubeumovo3d;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final String HOME = "https://roube-um-ovo-3d-salas.onrender.com/";
    private static final String GAME_HOST = "roube-um-ovo-3d-salas.onrender.com";
    private static final int FILE_CHOOSE = 810;
    private WebView game;
    private ValueCallback<Uri[]> fileCallback;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        immersive();
        game = new WebView(this);
        game.setBackgroundColor(Color.rgb(16, 24, 40));
        setContentView(game);

        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);

        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme())
                        && GAME_HOST.equalsIgnoreCase(uri.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Link indisponível", Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            @Override public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (!req.isForMainFrame()) return;
                String page = "<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'>"
                    + "<style>body{background:#111b31;color:white;text-align:center;font:18px sans-serif;padding:22vh 20px}"
                    + "a{display:inline-block;background:#ffa520;color:#111;padding:18px;border-radius:14px;text-decoration:none;font-weight:bold}</style>"
                    + "<h2>🥚 Roube um Ovo 3D</h2><p>Conecte-se à internet para entrar nas salas online.</p>"
                    + "<a href='" + HOME + "'>Tentar novamente</a>";
                view.loadDataWithBaseURL(HOME, page, "text/html", "UTF-8", null);
            }
        });

        game.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView webView,
                        ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent get = new Intent(Intent.ACTION_GET_CONTENT);
                    get.setType("*/*");
                    get.addCategory(Intent.CATEGORY_OPENABLE);
                    get.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                    startActivityForResult(Intent.createChooser(get, "Escolher arquivo de backup"), FILE_CHOOSE);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, "Seletor de arquivo indisponível", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        game.setDownloadListener(new DownloadListener() {
            @Override public void onDownloadStart(String url, String ua, String disposition,
                                                   String mime, long size) {
                try {
                    if (!url.startsWith("https://")) throw new Exception("Unsupported URL");
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "roube-um-ovo-arquivo");
                    ((DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(request);
                    Toast.makeText(MainActivity.this, "Download iniciado", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Abra o link no navegador para baixar", Toast.LENGTH_LONG).show();
                }
            }
        });
        game.loadUrl(HOME);
    }

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) immersive();
    }

    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code != FILE_CHOOSE || fileCallback == null) return;
        Uri[] uris = null;
        if (result == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                uris = new Uri[count];
                for (int i = 0; i < count; i++) uris[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) {
                uris = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(uris);
        fileCallback = null;
    }

    @Override public void onBackPressed() {
        if (game != null && game.canGoBack()) { game.goBack(); return; }
        new AlertDialog.Builder(this)
            .setTitle("Sair do Roube um Ovo 3D?")
            .setNegativeButton("Continuar jogando", (d, w) -> d.dismiss())
            .setPositiveButton("Sair", (d, w) -> finish())
            .show();
    }

    @Override protected void onDestroy() {
        if (game != null) { game.destroy(); game = null; }
        super.onDestroy();
    }
}
