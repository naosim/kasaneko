import kaplay from 'kaplay';

const k = kaplay({
  background: [26, 26, 46],
  crisp: true,
  scale: 2,
  canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
});

const MOVE_SPEED = 200;
const JUMP_FORCE = 650;
const MAX_FALL_NORMAL = 500;
const MAX_FALL_UMBRELLA = 180;
const DAMAGE_SPEED = 800; // 高い落下速度のみダメージ

k.scene('game', () => {
  k.setGravity(1600);

  // 地面配置（画面下部に配置）
  const groundY = k.height() - 32;
  k.add([
    k.rect(k.width(), 32),
    k.pos(0, groundY),
    k.color(k.rgb(74, 78, 105)),
    k.area(),
    k.body({ isStatic: true }),
    k.anchor('topleft'),
    'ground',
  ]);
  

  // 足場
  k.add([
    k.rect(48, 16),
    k.pos(48, groundY - 64),
    k.color(k.rgb(74, 78, 105)),
    k.area(),
    k.body({ isStatic: true }),
    k.anchor('topleft'),
    'ground',
  ]);

  k.add([
    k.rect(48, 16),
    k.pos(128, groundY - 128),
    k.color(k.rgb(74, 78, 105)),
    k.area(),
    k.body({ isStatic: true }),
    k.anchor('topleft'),
    'ground',
  ]);

  k.add([
    k.rect(48, 16),
    k.pos(80, groundY - 192),
    k.color(k.rgb(74, 78, 105)),
    k.area(),
    k.body({ isStatic: true }),
    k.anchor('topleft'),
    'ground',
  ]);

  k.add([
    k.circle(8),
    k.color(k.rgb(255, 105, 180)),
    k.pos(176, groundY - 224),
    k.area(),
    k.anchor('center'),
    'candy',
  ]);

  // プレイヤー配置（地面の上）
  const playerStartY = groundY - 16; // 地面の上16px（プレイヤーの半分）
  const player: any = k.add([
    k.rect(16, 16),
    k.color(k.rgb(255, 153, 102)),
    k.pos(50, playerStartY),
    k.area(),
    k.body(),
    k.anchor('bot'), // 下端を基準に配置
    {
      umbrellaOpen: false,
      lastFallSpeed: 0,
      lives: 3,
      isInvincible: false,
    },
    'player',
  ]);
  

  k.add([
    k.text('❤️❤️❤️', { size: 24 }),
    k.pos(16, 16),
    k.z(100),
    {
      update() {
        (this as any).text = '❤️'.repeat(Math.max(0, player.lives));
      },
    },
  ]);

  k.onKeyDown('left', () => player.move(-MOVE_SPEED, 0));
  k.onKeyDown('right', () => player.move(MOVE_SPEED, 0));

  k.onKeyPress('z', () => {
    if (player.isGrounded()) {
      player.jump(JUMP_FORCE);
    } else {
      player.umbrellaOpen = !player.umbrellaOpen;
    }
  });

  k.onKeyPress('up', () => {
    if (player.isGrounded()) {
      player.jump(JUMP_FORCE);
    } else {
      player.umbrellaOpen = !player.umbrellaOpen;
    }
  });

  player.onUpdate(() => {
    const isGrounded = player.isGrounded();

    // 伞 открыт時のみ少し色を変える
    if (player.umbrellaOpen) {
      player.color = k.rgb(255, 204, 102);
    } else {
      player.color = k.rgb(255, 153, 102);
    }

    if (!isGrounded) {
      if (player.umbrellaOpen) {
        if (player.vel.y > MAX_FALL_UMBRELLA) {
          player.vel.y = MAX_FALL_UMBRELLA;
        }
      } else {
        if (player.vel.y > MAX_FALL_NORMAL) {
          player.vel.y = MAX_FALL_NORMAL;
        }
      }
    }

    player.lastFallSpeed = player.vel.y;

    if (player.pos.y > k.height() + 100) {
      player.pos = k.vec2(50, k.height() - 48);
      player.lives--;
      if (player.lives <= 0) {
        k.go('gameover');
      }
    }
  });

  player.onCollide('ground', () => {
    const fallSpeed = Math.abs(player.lastFallSpeed);
    if (fallSpeed > DAMAGE_SPEED && !player.umbrellaOpen && !player.isInvincible) {
      player.lives--;
      player.isInvincible = true;
      player.color = k.rgb(255, 0, 0);
      k.wait(0.5, () => {
        player.color = k.rgb(255, 255, 255);
        player.isInvincible = false;
      });
      if (player.lives <= 0) {
        k.go('gameover');
      }
    }
  });

  player.onCollide('candy', (candy: any) => {
    k.destroy(candy);
    k.add([
      k.text('CLEAR!', { size: 32 }),
      k.pos(k.center()),
      k.anchor('center'),
      k.color(k.rgb(255, 215, 0)),
    ]);
    k.wait(2, () => {
      k.go('victory');
    });
  });

  setupMobileControls();
});

k.scene('gameover', () => {
  k.add([
    k.text('GAME OVER', { size: 48 }),
    k.pos(k.center()),
    k.anchor('center'),
    k.color(k.rgb(255, 100, 100)),
  ]);
  k.add([
    k.text('Press Z to retry', { size: 24 }),
    k.pos(k.center().add(0, 60)),
    k.anchor('center'),
  ]);
  k.onKeyPress('z', () => k.go('game'));
});

k.scene('victory', () => {
  k.add([
    k.text('VICTORY!', { size: 48 }),
    k.pos(k.center()),
    k.anchor('center'),
    k.color(k.rgb(255, 215, 0)),
  ]);
  k.add([
    k.text('Press Z to play again', { size: 24 }),
    k.pos(k.center().add(0, 60)),
    k.anchor('center'),
  ]);
  k.onKeyPress('z', () => k.go('game'));
});

// モバイル/ゲームコントローラー対応
function setupMobileControls() {
  const screenW = k.width();

  // ゲームコントローラー対応
  // 十字キー(D-pad)で移動
  let gamepadMoveDir = 0;
  
  k.onGamepadButtonDown("dpad-left", () => {
    gamepadMoveDir = -1;
  });
  k.onGamepadButtonDown("dpad-right", () => {
    gamepadMoveDir = 1;
  });
  k.onGamepadButtonRelease("dpad-left", () => {
    gamepadMoveDir = 0;
  });
  k.onGamepadButtonRelease("dpad-right", () => {
    gamepadMoveDir = 0;
  });

  // 左スティックで移動（閾値0.3でデジタル動作）
  let stickMoveDir = 0;
  k.onGamepadStick("left", (value: any) => {
    const threshold = 0.3;
    if (value.x < -threshold) {
      stickMoveDir = -1;
    } else if (value.x > threshold) {
      stickMoveDir = 1;
    } else {
      stickMoveDir = 0;
    }
  });

  // ゲームパッド移動処理（1フレームに1回だけ）
  k.onUpdate(() => {
    const players = k.get('player');
    if (players.length === 0) return;
    const p: any = players[0];
    
    const moveDir = stickMoveDir || gamepadMoveDir;
    if (moveDir !== 0) {
      p.move(moveDir * MOVE_SPEED, 0);
    }
  });

  // Aボタン/Bボタンでジャンプ
  k.onGamepadButtonPress("south", () => {
    const players = k.get('player');
    if (players.length === 0) return;
    const p: any = players[0];
    if (p.isGrounded()) {
      p.jump(JUMP_FORCE);
    } else {
      p.umbrellaOpen = !p.umbrellaOpen;
    }
  });
  k.onGamepadButtonPress("east", () => {
    const players = k.get('player');
    if (players.length === 0) return;
    const p: any = players[0];
    if (p.isGrounded()) {
      p.jump(JUMP_FORCE);
    } else {
      p.umbrellaOpen = !p.umbrellaOpen;
    }
  });

  // タッチ判定（モバイル）
  k.onUpdate(() => {
    const players = k.get('player');
    if (players.length === 0) return;
    const p: any = players[0];

    const touches = k.get('touch');
    if (touches.length > 0) {
      const t: any = touches[0];
      const tx = t.pos.x;

      if (tx < screenW / 2) {
        p.move(-MOVE_SPEED, 0);
      } else if (tx < screenW - 100) {
        p.move(MOVE_SPEED, 0);
      }

      if (tx >= screenW - 100) {
        if (p.isGrounded()) {
          p.jump(JUMP_FORCE);
        } else {
          p.umbrellaOpen = !p.umbrellaOpen;
        }
      }
    }
  });
}

k.go('game');