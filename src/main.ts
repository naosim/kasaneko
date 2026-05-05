import kaplay from "kaplay";

const k = kaplay({
  background: [26, 26, 46],
  crisp: true,
  scale: 3,
  pixelDensity: 1,
  canvas: document.getElementById("game-canvas") as HTMLCanvasElement,
  width: 128,
  height: 128,
});

const GAME_CONFIG = {
  MOVE_SPEED: 150,
  JUMP_FORCE: 500,
  MAX_FALL_NORMAL: 240,
  MAX_FALL_UMBRELLA: 80,
  FALL_DAMAGE_FRAMES: 30,
};

// グローバル公開（dev consoleから変更可能）
(window as any).GAME_CONFIG = GAME_CONFIG;

k.scene("game", () => {
  k.setGravity(1600);

  // 地面配置（画面下部に配置）- 高さを24pxに
  const groundY = k.height() - 24;
  k.add([
    k.rect(k.width(), 24),
    k.pos(0, groundY),
    k.color(k.rgb(74, 78, 105)),
    k.area(),
    k.body({ isStatic: true }),
    k.anchor("topleft"),
    "ground",
  ]);

  // 足場 - 36x12 (3ブロック)
  k.add([
    k.rect(36, 12),
    k.pos(48, groundY - 48),
    k.color(k.rgb(74, 78, 105)),
    k.area(),
    k.body({ isStatic: true }),
    k.anchor("topleft"),
    "ground",
  ]);

  k.add([
    k.rect(36, 12),
    k.pos(96, groundY - 96),
    k.color(k.rgb(74, 78, 105)),
    k.area(),
    k.body({ isStatic: true }),
    k.anchor("topleft"),
    "ground",
  ]);

  k.add([
    k.rect(36, 12),
    k.pos(60, groundY - 144),
    k.color(k.rgb(74, 78, 105)),
    k.area(),
    k.body({ isStatic: true }),
    k.anchor("topleft"),
    "ground",
  ]);

  k.add([
    k.circle(6),
    k.color(k.rgb(255, 105, 180)),
    k.pos(132, groundY - 168),
    k.area(),
    k.anchor("center"),
    "candy",
  ]);

  // プレイヤー配置（地面の上）- 12x12
  const playerStartY = groundY - 12;
  const player: any = k.add([
    k.rect(8, 12),
    k.color(k.rgb(255, 153, 102)),
    k.pos(50, playerStartY),
    k.area(),
    k.body(),
    k.anchor("bot"),
    {
      umbrellaOpen: false,
      lastFallSpeed: 0,
      lives: 3,
      isInvincible: false,
      fallFrameCount: 0,
    },
    "player",
  ]);

k.add([
    k.text("❤️❤️❤️", { size: 8 }),
    k.pos(8, 8),
    k.fixed(),
    k.z(100),
    {
      update() {
        (this as any).text = "❤️".repeat(Math.max(0, player.lives));
      },
    },
  ]);

  k.onKeyDown("left", () => player.move(-GAME_CONFIG.MOVE_SPEED, 0));
  k.onKeyDown("right", () => player.move(GAME_CONFIG.MOVE_SPEED, 0));

  k.onKeyPress("z", () => {
    if (player.isGrounded()) {
      player.jump(GAME_CONFIG.JUMP_FORCE);
    } else {
      player.umbrellaOpen = !player.umbrellaOpen;
    }
  });

  k.onKeyPress("up", () => {
    if (player.isGrounded()) {
      player.jump(GAME_CONFIG.JUMP_FORCE);
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
        if (player.vel.y > GAME_CONFIG.MAX_FALL_UMBRELLA) {
          player.vel.y = GAME_CONFIG.MAX_FALL_UMBRELLA;
        }
        player.fallFrameCount = 0;
      } else {
        if (player.vel.y > GAME_CONFIG.MAX_FALL_NORMAL) {
          player.vel.y = GAME_CONFIG.MAX_FALL_NORMAL;
          player.fallFrameCount++;
        } else {
          player.fallFrameCount = 0;
        }
      }
    } else {
      player.fallFrameCount = 0;
    }

    player.lastFallSpeed = player.vel.y;

    if (player.pos.y > k.height() + 100) {
      player.pos = k.vec2(50, k.height() - 36);
      player.lives--;
      if (player.lives <= 0) {
        k.go("gameover");
      }
    }
  });

  // カメラ設定
  k.onUpdate(() => {
    k.camPos(player.pos);
  });

  player.onCollide("ground", () => {
    // 傘が開いてたら閉じる
    if (player.umbrellaOpen) {
      player.umbrellaOpen = false;
    }

    // nフレーム以上落下でダメージ
    if (
      player.fallFrameCount >= GAME_CONFIG.FALL_DAMAGE_FRAMES &&
      !player.isInvincible
    ) {
      player.lives--;
      player.fallFrameCount = 0;
      player.isInvincible = true;
      player.color = k.rgb(255, 0, 0);
      k.wait(0.5, () => {
        player.color = k.rgb(255, 255, 255);
        player.isInvincible = false;
      });
      if (player.lives <= 0) {
        k.go("gameover");
      }
    }
  });

  player.onCollide("candy", (candy: any) => {
    k.destroy(candy);
    k.add([
      k.text("CLEAR!", { size: 12 }),
      k.pos(k.center()),
      k.fixed(),
      k.anchor("center"),
      k.color(k.rgb(255, 215, 0)),
      k.z(200),
    ]);
    k.wait(2, () => {
      k.go("victory");
    });
  });

  setupMobileControls();
});

k.scene("gameover", () => {
  k.add([
    k.text("GAME OVER", { size: 16 }),
    k.pos(k.center()),
    k.fixed(),
    k.anchor("center"),
    k.color(k.rgb(255, 100, 100)),
    k.z(200),
  ]);
  k.add([
    k.text("Press Z to retry", { size: 10 }),
    k.pos(k.center().add(0, 20)),
    k.fixed(),
    k.anchor("center"),
    k.z(200),
  ]);
  k.onKeyPress("z", () => k.go("title"));
});

k.scene("victory", () => {
  k.add([
    k.text("VICTORY!", { size: 16 }),
    k.pos(k.center()),
    k.fixed(),
    k.anchor("center"),
    k.color(k.rgb(255, 215, 0)),
    k.z(200),
  ]);
  k.add([
    k.text("Press Z to play again", { size: 10 }),
    k.pos(k.center().add(0, 20)),
    k.fixed(),
    k.anchor("center"),
    k.z(200),
  ]);
  k.onKeyPress("z", () => k.go("title"));
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
    const players = k.get("player");
    if (players.length === 0) return;
    const p: any = players[0];

    const moveDir = stickMoveDir || gamepadMoveDir;
    if (moveDir !== 0) {
      p.move(moveDir * GAME_CONFIG.MOVE_SPEED, 0);
    }
  });

  // Aボタン/Bボタンでジャンプ
  k.onGamepadButtonPress("south", () => {
    const players = k.get("player");
    if (players.length === 0) return;
    const p: any = players[0];
    if (p.isGrounded()) {
      p.jump(GAME_CONFIG.JUMP_FORCE);
    } else {
      p.umbrellaOpen = !p.umbrellaOpen;
    }
  });
  k.onGamepadButtonPress("east", () => {
    const players = k.get("player");
    if (players.length === 0) return;
    const p: any = players[0];
    if (p.isGrounded()) {
      p.jump(GAME_CONFIG.JUMP_FORCE);
    } else {
      p.umbrellaOpen = !p.umbrellaOpen;
    }
  });

  // タッチ判定（モバイル）
  k.onUpdate(() => {
    const players = k.get("player");
    if (players.length === 0) return;
    const p: any = players[0];

    const touches = k.get("touch");
    if (touches.length > 0) {
      const t: any = touches[0];
      const tx = t.pos.x;

      if (tx < screenW / 2) {
        p.move(-GAME_CONFIG.MOVE_SPEED, 0);
      } else if (tx < screenW - 100) {
        p.move(GAME_CONFIG.MOVE_SPEED, 0);
      }

      if (tx >= screenW - 100) {
        if (p.isGrounded()) {
          p.jump(GAME_CONFIG.JUMP_FORCE);
        } else {
          p.umbrellaOpen = !p.umbrellaOpen;
        }
      }
    }
  });
}

k.scene("title", () => {
  k.add([
    k.text("KASANEKO", { size: 16 }),
    k.pos(k.center().add(0, -12)),
    k.fixed(),
    k.anchor("center"),
    k.color(k.rgb(255, 215, 0)),
    k.z(200),
  ]);
  k.add([
    k.text("傘猫", { size: 12 }),
    k.pos(k.center().add(0, 4)),
    k.fixed(),
    k.anchor("center"),
    k.color(k.rgb(255, 255, 255)),
    k.z(200),
  ]);
  k.add([
    k.text("Press Z or A to Start", { size: 8 }),
    k.pos(k.center().add(0, 24)),
    k.fixed(),
    k.anchor("center"),
    k.color(k.rgb(200, 200, 200)),
    k.z(200),
  ]);

  k.onKeyPress("z", () => k.go("game"));
  k.onKeyPress("up", () => k.go("game"));

  // ゲームコントローラー
  k.onGamepadButtonPress("south", () => k.go("game"));
  k.onGamepadButtonPress("east", () => k.go("game"));
});

k.go("title");
