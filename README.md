# chrome-skk
An SKK implementation for ChromeOS IME API.

Chrome OS用SKK IME

# インストール方法
1. Releaseページから`chrome-skk-vx.xx.xx.zip`をダウンロードして解凍する
2. Chromeで`chrome://extensions`を開き、**Load Unpacked**をクリックして先程解凍したフォルダを指定する
3. インストールされた拡張機能を右クリックして**options**をクリック
3. 辞書ファイルのURLを入力し、適宜圧縮形式や文字エンコードも選択する（例：`https://skk-dev.github.io/dict/SKK-JISYO.S.gz`）
4. **reload**ボタンをクリック
5. IMEをクリックして設定アイコンをクリック
6. **Add input methods**をクリックして、使っているキーボードレイアウトに合わせてSKKを選択する(例: `SKK(for Japanese keyboard)`)
7. IMEをSKKに切り替える
8. Happy SKK!
