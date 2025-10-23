// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字


// ----------------------------------------
// 新增：煙火效果相關變數
// ----------------------------------------
let fireworks = []; // 儲存活躍的粒子
let explosionTriggered = false; // 確保爆炸只發生一次

// ----------------------------------------
// 新增：簡易粒子類別 - 實現煙火爆炸後的碎片
// ----------------------------------------
class Particle {
    constructor(x, y, col) {
        this.pos = createVector(x, y);
        // 隨機爆炸速度，確保粒子向外飛散
        this.vel = p5.Vector.random2D().mult(random(2, 8));
        this.acc = createVector(0, 0.1); // 簡易重力
        this.lifespan = 255;
        this.col = col;
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.lifespan -= 5; // 逐漸透明
    }

    show() {
        noStroke();
        // 設置透明度 (alpha)
        fill(hue(this.col), saturation(this.col), brightness(this.col), this.lifespan); 
        ellipse(this.pos.x, this.pos.y, 4, 4);
    }

    isFinished() {
        return this.lifespan < 0;
    }
}


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 新增：檢查是否滿分並觸發爆炸
        // ----------------------------------------
        // 檢查是否滿分 (finalScore > 0 以避免未評分時觸發) 且尚未爆炸
        if (finalScore === maxScore && finalScore > 0 && !explosionTriggered) {
             // 觸發煙火效果
             triggerFirework(width / 2, height / 2);
             explosionTriggered = true; // 設置標記，防止重複觸發
        } else if (finalScore !== maxScore) {
            // 如果分數不是滿分，則重置標記
            explosionTriggered = false;
        }
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// ----------------------------------------
// 新增：觸發煙火爆炸的函式
// ----------------------------------------
function triggerFirework(x, y) {
    // 啟用 HSB 模式以便控制顏色和亮度
    colorMode(HSB, 255); 
    let fireworkColor = color(random(255), 255, 255); // 隨機顏色
    let numParticles = 100; // 粒子數量
    
    // 產生粒子
    for (let i = 0; i < numParticles; i++) {
        fireworks.push(new Particle(x, y, fireworkColor));
    }
    // 啟用 loop 讓粒子系統動起來
    loop(); 
}

// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // 設定 HSB 模式以利於煙火色彩控制
    colorMode(RGB, 255); 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    noLoop(); // 只有在分數改變或煙火燃放時才繪製
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    
    // -----------------------------------------------------------------
    // C. (新增) 處理背景與煙火粒子更新
    // -----------------------------------------------------------------
    
    // 如果有煙火粒子，使用半透明背景產生拖影 (trail) 效果
    if (fireworks.length > 0) {
        background(255, 30); // 淺色背景拖影
    } else {
        background(255); // 沒有煙火時，清除背景
    }

    // 更新並繪製所有煙火粒子
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();

        // 移除已燃燒完的粒子
        if (fireworks[i].isFinished()) {
            fireworks.splice(i, 1);
        }
    }
    
    // 如果所有粒子都消失了，停止 loop (省資源)
    if (fireworks.length === 0) {
        noLoop();
    }
    
    // -----------------------------------------------------------------
    // A. 畫面反映與分數文本繪製
    // -----------------------------------------------------------------
    
    // 計算百分比
    let percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;

    textSize(80); 
    textAlign(CENTER);
    
    // 根據分數區間改變文本顏色和內容
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage >= 0) {
        // 低分：顯示警示文本，使用紅色
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
}
