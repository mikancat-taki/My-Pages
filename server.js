// server.js

// 必要なモジュールを読み込み
const express = require('express');
const bodyParser = require('body-parser');
const Datastore = require('nedb'); // 軽量なローカルデータベース

const app = express();
const port = 3000;

// 投稿データ用のデータベースを設定
const dbPosts = new Datastore({ filename: 'posts.db', autoload: true });
// コメントデータ用のデータベースを設定
const dbComments = new Datastore({ filename: 'comments.db', autoload: true });

// ミドルウェアの設定
// JSON形式のデータを扱えるようにする
app.use(bodyParser.json());
// 静的ファイル（HTML, CSS, JS）を公開する（index.htmlなどが置かれたフォルダを指定）
app.use(express.static('.')); 
// 外部からのAPIアクセスを許可する（CORS対応）
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// --- API ルートの定義 ---

// 1. 新しい投稿を受け付ける API
app.post('/api/posts', (req, res) => {
    const data = req.body;
    data.timestamp = Date.now();
    data.date = new Date().toLocaleDateString('ja-JP');

    dbPosts.insert(data, (err, newDoc) => {
        if (err) {
            res.status(500).json({ success: false, message: '投稿に失敗しました' });
            return;
        }
        res.json({ success: true, post: newDoc });
    });
});

// 2. 全投稿を取得する API
app.get('/api/posts', (req, res) => {
    // 最新の投稿順にソートして全て取得
    dbPosts.find({}).sort({ timestamp: -1 }).exec((err, docs) => {
        if (err) {
            res.status(500).json({ success: false, message: '記事の取得に失敗しました' });
            return;
        }
        res.json(docs);
    });
});

// 3. 特定の記事の投稿を取得する API
app.get('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    // NeDBはIDに"_id"を使う
    dbPosts.findOne({ _id: postId }, (err, doc) => {
        if (err || !doc) {
            res.status(404).json({ success: false, message: '記事が見つかりません' });
            return;
        }
        res.json(doc);
    });
});


// 4. コメントを投稿する API
app.post('/api/comments/:postId', (req, res) => {
    const data = req.body;
    data.postId = req.params.postId;
    data.timestamp = Date.now();
    data.date = new Date().toLocaleTimeString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    dbComments.insert(data, (err, newDoc) => {
        if (err) {
            res.status(500).json({ success: false, message: 'コメント投稿に失敗しました' });
            return;
        }
        res.json({ success: true, comment: newDoc });
    });
});

// 5. 特定の記事のコメントを取得する API
app.get('/api/comments/:postId', (req, res) => {
    const postId = req.params.postId;
    dbComments.find({ postId: postId }).sort({ timestamp: -1 }).exec((err, docs) => {
        if (err) {
            res.status(500).json({ success: false, message: 'コメントの取得に失敗しました' });
            return;
        }
        res.json(docs);
    });
});

// サーバーを起動
app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
});
