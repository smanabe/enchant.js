enchant(); //ライブラリの初期化,おまじない

window.onload = function() { //HTMLが読み込まれてからの処理
     //初期設定
    game = new Game(320, 320); //ゲームオブジェクトの生成と表示される領域の大きさの指定
    game.fps = 24; //ゲームの進行スピードを設定
    game.score = 0;
    game.touched = false;
    game.preload('graphic.png','effect0.gif','bg.png','icon0.gif'); //ゲームに使う素材を予め読み込んでおく。ここでは、画像データの読み込み
    game.onload = function() { //ゲームの準備が整ったらfunction内を実行
        game.life = 3; //ライフを初期設定
        background = new Background(); //背景を出現させる
        player = new Player(0, 152); //プレイヤーを出現させる
        
        /*game.rootScene.onenterframe = function() {
        // アイテムを生成, 表示
        if (game.frame % 50 == 0) {
            var r = Math.floor(Math.random()*100);
            var item = null;
            if (r < 10) {
                item = new power();
            }
            item.moveTo(320+30, Math.random()*(320 - 32));
            game.rootScene.addChild(item);  
        }*/
        
        
        //ライフを表示
        lifeLabel = new MutableText(8, 320 - 32, game.width, "");
        lifeLabel.addEventListener('enterframe',function(){
            this.text = "LIFE " + "OOOOOOOOOO".substring(0, game.life);
        });
        game.rootScene.addChild(lifeLabel); //Lifecycle
        
        items = [];
        enemies = [];
        game.rootScene.backgroundColor = 'black'; 

        game.rootScene.addEventListener('enterframe', function(){
               //ゲームを進行させる
            if(rand(100)<10){
                    //ランダムに敵キャラを登場させる
                var y = rand(320);
                var omega = y < 160 ? 1 : -1;
                var enemy = new Enemy(320, y, omega);
                enemy.key = game.frame;
                enemies[game.frame] = enemy;
            }
            scoreLabel.score = game.score;
        });
        scoreLabel = new ScoreLabel(8, 8);
        game.rootScene.addChild(scoreLabel);
    }
    game.start();　//ゲームスタート
}



//自機のクラス
var Player = enchant.Class.create(enchant.Sprite, { //Class.createで自作クラスが作れる
    initialize: function(x, y){
        enchant.Sprite.call(this, 16, 16);　//Spriteを呼び出す
        this.image = game.assets['graphic.png'];
        this.x = x;
        this.y = y;
        this.frame = 0;
        
          //自機の操作　タッチで移動する
        game.rootScene.addEventListener('touchstart',
                function(e){ player.y = e.y; game.touched = true; });
        game.rootScene.addEventListener('touchend',
                function(e){ player.y = e.y; game.touched = false; });
        game.rootScene.addEventListener('touchmove',
                function(e){ player.y = e.y; });
        this.addEventListener('enterframe', function(){
            if(game.touched && game.frame % 24 == 0){     //3フレームに一回、自動的に撃つ
                     var s = new PlayerShoot(this.x, this.y); }
        });
        
        game.rootScene.addChild(this); //Sceneの子要素として追加
    }
});

//敵のクラス
var Enemy = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y, omega){
        enchant.Sprite.call(this, 16, 16);　//Spriteを呼び出す
        this.image = game.assets['graphic.png'];
        this.x = x; this.y = y; this.frame = 3; this.time = 0;
       
          this.omega = omega*Math.PI / 180; //ラジアン角に変換
          this.direction = 0; this.moveSpeed = 3;

          //敵の動きを定義する
        this.addEventListener('enterframe', function(){
            this.direction += this.omega;
            this.x -= this.moveSpeed * Math.cos(this.direction);
            this.y += this.moveSpeed * Math.sin(this.direction);

               //画面外に出たら消える
            if(this.y > 320 || this.x > 320 || this.x < -this.width || this.y < -this.height){
                this.remove();
            }else if(this.time++ % 30 == 0){ //10フレームに一回、撃つ
                var s = new EnemyShoot(this.x, this.y);
            }
        });
        game.rootScene.addChild(this); //Sceneの子要素として追加
    },
    remove: function(){
        game.rootScene.removeChild(this);
        delete enemies[this.key]; delete this;
    }
});

//弾のクラス
var Shoot = enchant.Class.create(enchant.Sprite, { //Spriteが第一引数であり、これをクラス定義の為に使う
    initialize: function(x, y, direction){　//コンストラクタメソッドinitialize
        enchant.Sprite.call(this, 16, 16); //Spriteを呼び出す
        this.image = game.assets['graphic.png'];
        this.x = x;
        this.y = y;
        this.frame = 1;
        this.direction = direction; this.moveSpeed = 10;
        this.addEventListener('enterframe', function(){ //弾は決められた方向にまっすぐ飛ぶ
            this.x += this.moveSpeed * Math.cos(this.direction);
            this.y += this.moveSpeed * Math.sin(this.direction);
            if(this.y > 320 || this.x > 320 || this.x < -this.width || this.y < -this.height){
                this.remove();
            }
        });
        game.rootScene.addChild(this); //Sceneの子要素として追加
    },
    remove: function(){ game.rootScene.removeChild(this); delete this; }
});

//プレイヤーの撃つ弾のクラス
var PlayerShoot = enchant.Class.create(Shoot, { //弾のクラスを継承
    initialize: function(x, y){ //コンストラクタメソッドinitialize
        Shoot.call(this, x, y, 0);
        this.addEventListener('enterframe', function(){
            // 自機の弾が敵機に当たったかどうかの判定
            for(var i in enemies){
                if(enemies[i].intersect(this)){　//当たり判定
                    //爆発させる
                    var blast = new Blast(enemies[i].x,enemies[i].y);
                    //当たっていたら敵を消去
                    this.remove(); enemies[i].remove();
                    game.score += 100; //スコアを加算
                }
            }
        });
    }
});



//敵機の撃つ弾のクラス
var EnemyShoot = enchant.Class.create(Shoot, { //弾のクラスを継承
    initialize: function(x, y){
        Shoot.call(this, x, y, Math.PI);
        this.addEventListener('enterframe', function(){
            if(player.within(this, 8)){     //プレイヤーに弾が当たった
                game.life--; //ライフを1減らす
                if(game.life <= 0) //ライフが0ならばゲームオーバー
                     game.end(game.score, "SCORE: " + game.score)
            }
        });
    }
});


//爆発エフェクト
var Blast = enchant.Class.create(enchant.Sprite, {　//Spriteが第一引数であり、これをクラス定義の為に使う
    initialize: function(x,y){
        enchant.Sprite.call(this,16,16);
        this.x = x;
        this.y = y;
        this.image = game.assets['effect0.gif'];
        this.time = 0;
        //アニメーションの遅れ
        this.duration = 20;
        this.frame = 0;
        
        this.addEventListener('enterframe', function(){
            this.time++;
            //爆発アニメーション
            this.frame = Math.floor(this.time/this.duration *5);
            if(this.time == this.duration)this.remove();
        });
        game.rootScene.addChild(this); //Sceneの子要素として追加
    },
    remove: function(){
        game.rootScene.removeChild(this);
    }
});

//背景クラス
var Background = enchant.Class.create(enchant.Sprite, {　//Spriteが第一引数であり、これをクラス定義の為に使う
        initialize: function() {
            //ちょっと大きめの背景を用意
            enchant.Sprite.call(this,640,320);
            this.x = 0;
            this.y = 0;
            this.image = game.assets['bg.png'];
            this.addEventListener('enterframe',function(){
                //背景をスクロール
                this.x--;
                //端まで来たらリピート
                if(this.x <=-320)this.x=0;
            });
            game.rootScene.addChild(this);　//Sceneの子要素として追加
        }
});

//アイテム作成中
var Item = enchant.Class.create(enchant.Sprite, {
    // 初期化処理
    initialize: function(x,y) {
        Sprite.call(this, 16, 16);
        this.image = game.assets['icon0,gif'];
    },
    // 更新処理
    onenterframe: function() {
        // 移動
        this.x += -4;
        
        // 衝突判定
        if (this.intersect(player)) {
            // ヒットイベントを発行する
            var e = new enchant.Event("hit");
            this.dispatchEvent(e);
        }
        
        // 削除処理
        if (this.x < -40) {
            this.parentNode.removeChild(this);
        }
    },
    // ヒット時処理
    onhit: function(e) {
        console.log("hit!");
    },
});



//アイテムゲット作成中
var power = enchant.Class.create(Item, {
    // 初期化処理
    initialize: function() {
        Item.call(this);
        this.frame = 14;
    },
    // 更新処理
    onhit: function(e) {
        // スコアアップラベルを生成, 表示
        var label = new ScoreUpLabel(100);
        label.moveTo(this.x, this.y);
        game.rootScene.addChild(label);
        
        // 削除
        this.parentNode.removeChild(this);
        // スコア加算
        scoreLabel.score += 100;
    },
});

