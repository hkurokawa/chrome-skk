# chrome-skk
An SKK implementation for ChromeOS IME API.

Chrome OS用SKK IME

# Fork元
このレポジトリは https://github.com/jmuk/chrome-skk をフォークしたものです。
@jmukさんのご許可をいただいて、Chrome WebStoreにて公開しております。

# インストール方法
Web Store から、もしくは手動でインストールできます。

## Web Store 経由
https://chrome.google.com/webstore/detail/skk-japanese-input/gdfnmlnbnmgdliccidmiphhpicaecffj から拡張機能をインストールしてください

## 手動
1. Releaseページから`chrome-skk-vx.xx.xx.zip`をダウンロードして解凍する
1. Chromeで`chrome://extensions`を開き、**Load Unpacked**をクリックして先程解凍したフォルダを指定する

# 設定方法
1. インストールされた拡張機能を右クリックして**options**をクリック
1. 辞書ファイルのURLを入力し、適宜圧縮形式や文字エンコードも選択する（例：`https://skk-dev.github.io/dict/SKK-JISYO.S.gz`）
1. **reload**ボタンをクリック
1. IMEをクリックして設定アイコンをクリック
1. **Add input methods**をクリックして、使っているキーボードレイアウトに合わせてSKKを選択する(例: `SKK(for Japanese keyboard)`)
1. IMEをSKKに切り替える
1. Happy SKK!

# 既知の問題と回避方法
最新のバージョンでは Manifest V3 への移行にともなって Service Worker 化をしたところ、https://github.com/hkurokawa/chrome-skk/issues/14 という問題が発生しています。これは Chrome 側が拡張機能の Service Worker をどう取り扱うかという問題であり、報告はしていますが、すぐには直らなさそうです。この問題を回避したい場合は以下の2つの方法があります。

## 1. 拡張機能の options ページを開き、開発者ツールを開いた状態で放置する
自分も詳しくは分かっていませんが、以下のスクリーンショットのように Chrome で chrome-skk の options ページを開いて、開発者ツールを起動し、そのまま閉じなければ、この問題は回避できます。Chrome およびこのタブが開かれていれば、前面に表示する必要はありません。自分は基本的に Chrome は開きっぱなしなので、この方法で回避しています。なお、いわゆるハックなので、Chrome のどこかのバージョンで動かなくなる可能性があります。

![image](https://user-images.githubusercontent.com/6446183/226134195-7abe78f7-4c58-4778-a109-201d5c3732eb.png)

## 2. Service Worker 化されていないバージョンを使う
v1.x 以前、つまり v0.x は Manifest V2 であり、Service Worker 化はされていません。したがって、v0.x を手動インストールすればこの問題は発生しません。

できるだけ緊急度や重要度の高い変更は v0.x 系にもバックポートしていくつもりですが、どこかのタイミングで難しくなる可能性はあるので確約はできません。
