
BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {

    create: function () {
        this.setupBackground();
        this.setupPlayer();
        this.setupEnemies();
        this.setupBullets();
        this.setupExplosions();
        this.setupPlayerIcons();
        this.setupText();
        this.cursors = this.input.keyboard.createCursorKeys();
    },

    setupBackground: function () {
        this.sea = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'sea');
        this.sea.autoScroll(0, BasicGame.SEA_SCROLL_SPEED);
    },

    setupPlayer: function () {
        this.player = this.add.sprite(this.game.width / 2, this.game.height - 50, 'player');
        this.player.anchor.setTo(0.5, 0.5);
        this.player.animations.add('fly', [0, 1, 2], 20, true);
        this.player.animations.add('ghost', [3, 0, 3, 1], 20, true);
        this.player.play('fly');
        this.physics.enable(this.player, Phaser.Physics.ARCADE);
        this.player.speed = BasicGame.PLAYER_SPEED;
        this.player.body.collideWorldBounds = true;
        // 20 x 20 pixel hitbox, centered a little bit higher than the center
        this.player.body.setSize(20, 20, 0, -5);
    },

    setupPlayerIcons: function () {
        this.lives = this.add.group();
        // calculate location of first life icon
        var firstLifeIconX = this.game.width - 10 - (BasicGame.PLAYER_EXTRA_LIVES * 30);
        for (var i = 0; i < BasicGame.PLAYER_EXTRA_LIVES; i++) {
            var life = this.lives.create(firstLifeIconX + (30 * i), 30, 'player');
            life.scale.setTo(0.5, 0.5);
            life.anchor.setTo(0.5, 0.5);
        }
    },

    setupEnemies: function () {
        this.enemyPool = this.add.group();
        this.enemyPool.enableBody = true;
        this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
        this.enemyPool.createMultiple(50, 'greenEnemy');
        this.enemyPool.setAll('anchor.x', 0.5);
        this.enemyPool.setAll('anchor.y', 0.5);
        this.enemyPool.setAll('outOfBoundsKill', true);
        this.enemyPool.setAll('checkWorldBounds', true);
        this.enemyPool.setAll('reward', BasicGame.ENEMY_REWARD, false, false, 0, true);

        // Set the animation for each sprite
        this.enemyPool.forEach(function (enemy) {
            enemy.animations.add('fly', [0, 1, 2], 20, true);
            enemy.animations.add('hit', [3, 1, 3, 2], 20, false);
            enemy.events.onAnimationComplete.add(function (e) {
                e.play('fly');
            }, this);
        });

        this.nextEnemyAt = 0;
        this.enemyDelay = BasicGame.SPAWN_ENEMY_DELAY;
    },

    setupBullets: function () {
        // Add an empty sprite group into our game
        this.bulletPool = this.add.group();

        // Enable physics to the whole sprite group
        this.bulletPool.enableBody = true;
        this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;

        // Add 100 'bullet' sprites in the group.
        // By default this uses the first frame of the sprite sheet and
        //   sets the initial state as non-existing (i.e. killed/dead)
        this.bulletPool.createMultiple(100, 'bullet');

        // Sets anchors of all sprites
        this.bulletPool.setAll('anchor.x', 0.5);
        this.bulletPool.setAll('anchor.y', 0.5);

        // Automatically kill the bullet sprites when they go out of bounds
        this.bulletPool.setAll('outOfBoundsKill', true);
        this.bulletPool.setAll('checkWorldBounds', true);

        this.nextShotAt = 0;
        this.shotDelay = BasicGame.SHOT_DELAY;
    },

    setupExplosions: function () {
        this.explosionPool = this.add.group();
        this.explosionPool.enableBody = true;
        this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
        this.explosionPool.createMultiple(100, 'explosion');
        this.explosionPool.setAll('anchor.x', 0.5);
        this.explosionPool.setAll('anchor.y', 0.5);
        this.explosionPool.forEach(function (explosion) {
            explosion.animations.add('boom');
        });
    },

    setupText: function () {
        this.score = 0;
        this.scoreText = this.add.text(
        this.game.width / 2, 30, '' + this.score,
        { font: '20px monospace', fill: '#fff', align: 'center' }
        );
        this.scoreText.anchor.setTo(0.5, 0.5);
    },

    update: function () {
        this.checkCollisions();
        this.spawnEnemies();
        this.processPlayerInput();
        this.processDelayedEffects();
    },

    checkCollisions: function () {
        this.physics.arcade.overlap(
          this.bulletPool, this.enemyPool, this.enemyHit, null, this
        );

        this.physics.arcade.overlap(
         this.player, this.enemyPool, this.playerHit, null, this
       );
    },

    spawnEnemies: function () {
        if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
            this.nextEnemyAt = this.time.now + this.enemyDelay;
            var enemy = this.enemyPool.getFirstExists(false);
            // spawn at a random location top of the screen
            enemy.reset(this.rnd.integerInRange(20, this.game.width - 20), 0, BasicGame.ENEMY_HEALTH);
            // also randomize the speed
            enemy.body.velocity.y = this.rnd.integerInRange(BasicGame.ENEMY_MIN_Y_VELOCITY, BasicGame.ENEMY_MAX_Y_VELOCITY);
            enemy.play('fly');
        }
    },

    processPlayerInput: function () {
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;

        if (this.cursors.left.isDown) {
            this.player.body.velocity.x = -this.player.speed;
        }
        else if (this.cursors.right.isDown) {
            this.player.body.velocity.x = this.player.speed;
        }

        if (this.cursors.up.isDown) {
            this.player.body.velocity.y = -this.player.speed;
        }
        else if (this.cursors.down.isDown) {
            this.player.body.velocity.y = this.player.speed;
        }

        if (this.input.activePointer.isDown && this.physics.arcade.distanceToPointer(this.player) > 15) {
            this.physics.arcade.moveToPointer(this.player, this.player.speed);
        }

        if (this.input.keyboard.isDown(Phaser.Keyboard.Z) || this.input.activePointer.isDown) {
            if (this.returnText && this.returnText.exists) {
                this.quitGame();
            } else {
                this.fire();
            }
        }
    },

    processDelayedEffects: function () {
        if (this.ghostUntil && this.ghostUntil < this.time.now) {
            this.ghostUntil = null;
            this.player.play('fly');
        }
        if (this.showReturn && this.time.now > this.showReturn) {
            this.returnText = this.add.text(
            this.game.width / 2, this.game.height / 2 + 20,
            'Press Z or Tap Game to go back to Main Menu',
            { font: '16px sans-serif', fill: '#fff' }
            );
            this.returnText.anchor.setTo(0.5, 0.5);
            this.showReturn = false;
        }
    },

    fire: function () {
         if (!this.player.alive || this.nextShotAt > this.time.now) {
             return;
         }

        if (this.bulletPool.countDead() === 0) {
            return;
        }

        this.nextShotAt = this.time.now + this.shotDelay;

        // Find the first dead bullet in the pool
        var bullet = this.bulletPool.getFirstExists(false);

        // Reset (revive) the sprite and place it in a new location
        bullet.reset(this.player.x, this.player.y - 20);

        bullet.body.velocity.y = -BasicGame.BULLET_VELOCITY;
    },

    enemyHit: function (bullet, enemy) {
        bullet.kill();
        this.damageEnemy(enemy, BasicGame.BULLET_DAMAGE);
    },

    playerHit: function (player, enemy) {
        // check first if this.ghostUntil is not not undefined or null
        if (this.ghostUntil && this.ghostUntil > this.time.now) {
            return;
        }

        // crashing into an enemy only deals 5 damage
        this.damageEnemy(enemy, BasicGame.CRASH_DAMAGE); this.explode(player);
        var life = this.lives.getFirstAlive();
        if (life !== null) {
            life.kill();
            this.ghostUntil = this.time.now + BasicGame.PLAYER_GHOST_TIME;
            this.player.play('ghost');
        } else {
            this.explode(player);
            player.kill();
            this.displayEnd(false);
        }
    },

    damageEnemy: function (enemy, damage) {
        enemy.damage(damage);
        if (enemy.alive) {
            enemy.play('hit');
        }
        else {
            this.explode(enemy);
            this.addToScore(enemy.reward);
        }
    },

    addToScore: function (score) {
        this.score += score;
        this.scoreText.text = this.score;
        if (this.score >= 2000) {
            this.enemyPool.destroy();
            this.displayEnd(true);
        }
    },

    explode: function (sprite) {
             if (this.explosionPool.countDead() === 0) {
                   return;
                 }
             var explosion = this.explosionPool.getFirstExists(false);
             explosion.reset(sprite.x, sprite.y);
             explosion.play('boom', 15, false, true);
             // add the original sprite's velocity to the explosion
             explosion.body.velocity.x = sprite.body.velocity.x;
             explosion.body.velocity.y = sprite.body.velocity.y;
    },

    displayEnd: function (win) {
        // you can't win and lose at the same time
        if (this.endText && this.endText.exists) {
            return;
        }

        var msg = win ? 'You Win!!!' : 'Game Over!';
        this.endText = this.add.text(
        this.game.width / 2, this.game.height / 2 - 60, msg,
        { font: '72px serif', fill: '#fff' }
        );
        this.endText.anchor.setTo(0.5, 0);
        this.showReturn = this.time.now + BasicGame.RETURN_MESSAGE_DELAY;
    },

    quitGame: function (pointer) {

        //  Here you should destroy anything you no longer need.
        //  Stop music, delete sprites, purge caches, free resources, all that good stuff.
        this.sea.destroy();
        this.player.destroy();
        this.enemyPool.destroy();
        this.bulletPool.destroy();
        this.explosionPool.destroy();
        this.scoreText.destroy();
        this.endText.destroy();
        this.returnText.destroy();

        //  Then let's go back to the main menu.
        this.state.start('MainMenu');

    }


};
