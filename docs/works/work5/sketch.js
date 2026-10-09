// sketch.js

// --- グローバル変数定義 ---
const modelSetConfigs = [
  { name: 'fish', count: 12, color: 'lagoon' },
  { name: 'knife', count: 8, color: 'seablue' },
  { name: 'garlic', count: 10, color: 'moss' },
  { name: 'grape', count: 10, color: 'plum' },
];

const numDisplays = modelSetConfigs.length;
const canvasWidth = 200;

let allModels = {};

// マウス回転と間隔調整
let rotationsY = [];
let rotationsX = [];
let modelSpacings = [];
const initialModelSpacing = 100;
const canvasPadding = 200;

// ▼ 自動回転の速度
const rotationSpeed = 0.05;

// ▼ 1フレームごとに更新するディスプレイのインデックス
let updateIndex = 0;

let pg; // 3Dシーンをレンダリングする共有バッファ
let ditheredImageCaches = []; // ディザ処理済み画像を保存するキャッシュ

/**
 * アセットを読み込む関数
 */
function preload() {
  for (const config of modelSetConfigs) {
    const setName = config.name;
    const modelCount = config.count;
    allModels[setName] = [];
    for (let i = 0; i < modelCount; i++) {
      let modelPath = `assets/${setName}/${i + 1}.obj`;
      let model = loadModel(modelPath, true);
      allModels[setName].push(model);
      console.log(`Loading ${modelPath}...`);
    }
  }
}

/**
 * 初期設定
 */
function setup() {
  for (let i = 0; i < numDisplays; i++) {
    rotationsY[i] = 0;
    rotationsX[i] = 0; // X軸の回転は固定
    modelSpacings[i] = initialModelSpacing;
  }

  const initialHeights = modelSetConfigs.map(config => initialModelSpacing * config.count + canvasPadding * 2);
  const initialMaxHeight = Math.max(...initialHeights);

  const canvas = createCanvas(canvasWidth * numDisplays, initialMaxHeight);
  canvas.parent('canvas-container');
  pixelDensity(1);

  pg = createGraphics(canvasWidth, initialMaxHeight, WEBGL);
  pg.pixelDensity(1);
  pg.noStroke();

  console.log("全モデルの読み込み完了。");

  updateAllDitherCaches();
}

/**
 * 描画ループ（常に実行される）
 */
function draw() {
  // 1. 全てのディスプレイの回転角度を更新する
  for (let i = 0; i < numDisplays; i++) {
    rotationsY[i] += rotationSpeed;
  }

  // 2. 1フレームにつき1つのディスプレイのキャッシュだけを更新（コマ送り更新）
  updateDitherCache(updateIndex);
  updateIndex = (updateIndex + 1) % numDisplays; // 次に更新するインデックスへ

  // 3. 全てのキャッシュされた画像を描画する
  background(245);
  for (let i = 0; i < numDisplays; i++) {
    const config = modelSetConfigs[i];
    const cachedImage = ditheredImageCaches[i];

    if (cachedImage) {
      let riso = new Riso(config.color);

      push();
      translate(i * canvasWidth, 0);
      clearRiso();
      riso.image(cachedImage, 0, 0);
      drawRiso();
      pop();
    }
  }
}

/**
 * 3Dシーンをオフスクリーンキャンバス(pg)に描画する
 */
function draw3DScene(rotX, rotY, spacing, modelsToDraw) {
  pg.background(240);
  const modelCount = modelsToDraw.length;
  const modelsHeight = spacing * modelCount;

  for (let i = 0; i < modelCount; i++) {
    pg.push();
    const yPos = -modelsHeight / 2 + spacing / 2 + i * spacing;
    pg.translate(0, yPos, 0);
    pg.rotateY(PI);
    pg.rotateX(PI);
    pg.rotateY(rotY);
    pg.rotateX(rotX);
    pg.ambientLight(100);
    pg.pointLight(255, 255, 255, 0, -200, 200);
    pg.normalMaterial();
    pg.scale(0.5);
    if (modelsToDraw[i]) {
      pg.model(modelsToDraw[i]);
    }
    pg.pop();
  }
}

// --- キャッシュ更新用の関数 ---

function updateDitherCache(index) {
  const config = modelSetConfigs[index];
  const models = allModels[config.name];

  draw3DScene(rotationsX[index], rotationsY[index], modelSpacings[index], models);
  ditheredImageCaches[index] = ditherImage(pg, 'atkinson', 128);
}

function updateAllDitherCaches() {
  for (let i = 0; i < numDisplays; i++) {
    updateDitherCache(i);
  }
}

function keyPressed() {
  // ▼ キー操作はカーソル位置に関わらず全画面に適用されるように、
  //    activeIndexの代わりに固定値（例: 0）を使うか、あるいは機能を削除します。
  //    ここでは最初のディスプレイ（インデックス0）を操作対象とします。
  const activeIndex = 0;

  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    if (keyCode === UP_ARROW) {
      modelSpacings[activeIndex] += 10;
    } else {
      modelSpacings[activeIndex] -= 10;
      if (modelSpacings[activeIndex] < 50) {
        modelSpacings[activeIndex] = 50;
      }
    }

    // 全てのディスプレイに同じ間隔を適用する場合
    for (let i = 0; i < numDisplays; i++) {
      modelSpacings[i] = modelSpacings[activeIndex];
    }

    const requiredHeights = modelSetConfigs.map((config, i) => {
      return modelSpacings[i] * config.count + canvasPadding * 2;
    });
    const maxHeight = Math.max(...requiredHeights);

    resizeCanvas(canvasWidth * numDisplays, maxHeight);
    pg.resizeCanvas(canvasWidth, maxHeight);

    updateAllDitherCaches();
  }
}