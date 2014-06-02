・HtmltagParserについて

 「HTMLソースエディタ兼wysiwgみたいなやつ」を作っていて、スクリプト側でタグチェックするだけではなく、
 js側でも基本的なタグチェックしてくれる軽めのソースないかな？と調べていたのですが、日本語でいいのが
 無かったので、作ってみました。

　・とりあえず、脆弱性検査して引っかからないレベルのタグ許可させたい
　・HTMLソースエディタ使うと、すぐXSS埋め込めるので、XSS動作だけは勘弁。
　・あとで、内容確認しながら使うところによって、タグ追加できるようにしたい。

 上記の内容をコンセプトに作りました。同じような悩みをお持ちの方、ぜひ使ってみてください。
 なお、ソース自体も非常に短くて、読むのが楽なので、カスタマイズベースにもいかがでしょうか？

 今後進化させていきたいので、是非、バグや機能追加等のプルリクエストをお待ちしています。

※あたりまえですが、jsですので、スクリプト側でのチェックは必須です。サーバ負荷を軽くする＆ユーザ側で
すぐにタグ間違いに気づけるようにするのが主目的です。


簡単な使いかたは、sample.htmlをご覧ください。

基本は、以下です。
１．HtmlTagChecker.jsを適当に配置して、該当ページで読み込む。
２．以下みたいに、引数に検証する文字列を突っ込むと、ansに、statusと、err_strの２つのキーを持つ連想配列(hash)が
　返ってきます。

	var ans = $.html_tag_checker.check(str);

３．statusがtrueであれば、問題無し、falseのときは、err_strをalertとかで表示して修正を促してください。
４．第二引数にhashを渡すことで、エラーメッセージの内容や挙動を変えたり、許可タグを追加・削除したりすることができます。
５．そのままで動作する場合、以下のタグ要件を検証します。

＜許可しないタグ＞<br/>
script, object, iframe, frame, frameset, meta, style, body, input, form, textarea, applet, bgsound, base, embed, head, html, ilayer, layer, link, name, xml, title, basefont, id, area, col, isindex, param, !doctype, marquee

＜単体で閉じる必要性が無いと判断するタグ(これ以外で閉じタグが無いような場合は、アラートします。)＞<br/>
br, hr, img<br/>

＜どのようなタグでも許可するアトリビュート＞<br/>
style, class, id<br/>

＜特定のタグについて許可するアトリビュート＞<br/>
img : alt, src<br/>
font : color, size<br/>
a : href, target<br/>
td : rowspan, colspan<br/>

＜アトリビュートの内容チェック＞<br/>
style : 中に、expression文字列が無いかどうかの確認。<br/>
img[src] : http(s)://から開始しているかどうか、最後が.(gif|jpg|png|GIF|JPG|PNG)のいずれかであるかどうか。<br/>
a[href] : http(s)://から開始しているかどうか<br/>

こんな感じです。

