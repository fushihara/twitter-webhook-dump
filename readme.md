# twitterのaccount activity apiの内容をダンプするプログラム

どんなイベントが何時来るのか確認用。

# 確認したイベント

- 他人が、自分のツイートをfavった。数秒遅れ。fav削除は無し。
- 他人からDMが来た
- 他人が、自分をフォローした。
- 自分が、他人をフォローした。鍵垢の時は、リクエストを送った段階で来る。許可の段階でも来る。
- 自分が誰かをブロックした。解除した時も来る
- 自分のツイートを消した時はイベントが来た。
- 他人から、自分宛てにメンションが来た時
- 他人が、自分のツイートをRTした時
- 他人が、自分のツイートを引用RTした時
- https://twittercommunity.com/t/account-activity-api-tweet-deletes/109494
