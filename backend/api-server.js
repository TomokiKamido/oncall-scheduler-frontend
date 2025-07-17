// backend/api-server.js
// 独自のバックエンドサーバー実装
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

// .envファイルから環境変数を読み込む
dotenv.config();

// Firebase Admin SDKの初期化
admin.initializeApp();

// アプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// MongoDB接続設定
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'oncall_scheduler_db';
let db;

// データベース接続
MongoClient.connect(mongoUri)
  .then(client => {
    console.log('MongoDB接続成功');
    db = client.db(dbName);
  })
  .catch(err => {
    console.error('MongoDB接続エラー:', err);
    process.exit(1);
  });

// 認証ミドルウェア
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '認証トークンが必要です' });
  }
  
  try {
    // Firebase Admin SDKでトークンを検証
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: '無効なトークンです' });
  }
};

// ユーザーデータ保存エンドポイント
app.post('/api/v1/users/:userId/custom-data', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const customData = req.body;
    
    // 認証されたユーザーのみ自分のデータを更新可能
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: '権限がありません' });
    }
    
    const collection = db.collection('user_custom_data');
    const result = await collection.updateOne(
      { userId },
      {
        $set: {
          ...customData,
          lastModified: new Date()
        }
      },
      { upsert: true }
    );
    
    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId
    });
  } catch (error) {
    console.error('データ保存エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ユーザーデータ取得エンドポイント
app.get('/api/v1/users/:userId/custom-data', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 認証されたユーザーのみ自分のデータを取得可能
    if (req.user.uid !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '権限がありません' });
    }
    
    const collection = db.collection('user_custom_data');
    const userData = await collection.findOne({ userId });
    
    if (!userData) {
      return res.status(404).json({ error: 'データが見つかりません' });
    }
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`APIサーバーがポート ${PORT} で起動しました`);
});
