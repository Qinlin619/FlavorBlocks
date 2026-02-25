/**
 * Pixel Slice - 核心逻辑 (环球美食版)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const progressEl = document.getElementById('progress');
const winOverlay = document.getElementById('win-overlay');

// UI 元素
const startScreen = document.getElementById('start-screen');
const levelScreen = document.getElementById('level-screen');
const gameUI = document.getElementById('game-ui');

// 核心状态
let PIXEL_SIZE = 60;
let currentLevelData = null;
let currentRegion = "asia";
let currentLevelIdx = 0;
let pieces = [];
let draggingPiece = null;
let offset = { x: 0, y: 0 };

// 美食关卡数据库
// 美食关卡数据库
const FOOD_LEVELS = {
    "asia": [
        {
            name: "饭团 (Onigiri)",
            dim: 5,
            mask: [
                [0, 0, 1, 0, 0],
                [0, 1, 1, 1, 0],
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 0, 1, 0, 0]
            ],
            colors: { 1: "#000000" }, // 简约黑
            story: "故事从一粒米开始。在东方的精致中，寻找形状的平衡。"
        },
        {
            name: "三文鱼握寿司 (Sushi)",
            dim: 6,
            mask: [
                [0, 2, 2, 2, 2, 0],
                [0, 2, 2, 2, 2, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1]
            ],
            colors: { 1: "#ffffff", 2: "#ff4757" }, // 白饭+鱼片
            story: "极简的切割，是对食材最高的敬意。"
        },
        {
            name: "中国饺子 (Dumpling)",
            dim: 7,
            mask: [
                [0, 0, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 0],
                [0, 0, 2, 2, 2, 0, 0]
            ],
            colors: { 1: "#fdfdfd", 2: "#e0e0e0" },
            story: "包裹着团圆的温度，每一个褶皱都是岁月的痕迹。"
        },
        {
            name: "日本拉面 (Ramen)",
            dim: 10,
            mask: [
                [0, 0, 0, 4, 4, 0, 0, 0, 0, 0],
                [0, 0, 4, 4, 4, 4, 0, 0, 0, 0],
                [0, 3, 3, 3, 3, 3, 3, 3, 0, 0],
                [3, 3, 5, 5, 3, 3, 3, 3, 3, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
                [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
                [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 0, 0]
            ],
            colors: { 1: "#e74c3c", 2: "#ffffff", 3: "#f1c40f", 4: "#34495e", 5: "#ffffff" },
            story: "浓郁的汤底中，像素化的线条勾勒出深夜的慰藉。"
        }
    ],
    "europe": [
        {
            name: "意式披萨 (Pizza)",
            dim: 8,
            mask: [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 2, 2, 2, 2, 1, 0],
                [1, 2, 3, 2, 3, 2, 2, 1],
                [1, 2, 2, 2, 2, 3, 2, 1],
                [1, 2, 3, 2, 2, 2, 2, 1],
                [0, 1, 2, 3, 2, 2, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ],
            colors: { 1: "#d35400", 2: "#f1c40f", 3: "#e74c3c" }, // 饼底+芝士+萨拉米
            story: "漫步在托斯卡纳的午后，色彩与温度交织在一张圆饼里。"
        },
        {
            name: "牛角包 (Croissant)",
            dim: 8,
            mask: [
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0]
            ],
            colors: { 1: "#e67e22" },
            story: "巴黎清晨的酥脆，在层层叠叠的黄油香气中苏醒。"
        }
    ],
    "americas": [
        {
            name: "芝士汉堡 (Burger)",
            dim: 8,
            mask: [
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [6, 6, 6, 6, 6, 6, 6, 6], // 芝士
                [3, 3, 3, 3, 3, 3, 3, 3], // 肉饼
                [4, 4, 4, 4, 4, 4, 4, 4], // 菜
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0]
            ],
            colors: { 1: "#e67e22", 6: "#f1c40f", 3: "#5d4037", 4: "#2ecc71" },
            story: "这是自由港口的繁忙，也是层层叠加的秩序。"
        },
        {
            name: "墨西哥卷饼 (Taco)",
            dim: 8,
            mask: [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 4, 4, 4, 4, 1, 0],
                [1, 4, 3, 3, 3, 3, 4, 1],
                [1, 4, 2, 2, 2, 2, 4, 1],
                [1, 1, 1, 1, 1, 1, 1, 1]
            ],
            colors: { 1: "#f1c40f", 2: "#e74c3c", 3: "#2ecc71", 4: "#d35400" },
            story: "所有的热情都被包裹在色彩鲜艳的饼皮之中。"
        }
    ]
};

class Piece {
    constructor(pixels, targetX, targetY, colorId) {
        this.pixels = pixels;
        this.targetX = targetX;
        this.targetY = targetY;
        this.colorId = colorId;
        this.color = currentLevelData.colors[colorId] || "#000000";

        // 初始随机位置
        const padding = 100;
        this.x = Math.random() * (canvas.width - padding * 2) + padding;
        this.y = Math.random() * (canvas.height - padding * 2) + padding;

        if (Math.abs(this.x - this.targetX) < 100 && Math.abs(this.y - this.targetY) < 100) {
            this.x += 200;
        }

        this.isLocked = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.isLocked ? 1.0 : 0.9;
        this.pixels.forEach(p => {
            ctx.fillRect(
                this.x + p.x * PIXEL_SIZE,
                this.y + p.y * PIXEL_SIZE,
                PIXEL_SIZE - 1,
                PIXEL_SIZE - 1
            );
        });
        ctx.globalAlpha = 1.0;

        // 如果选中，画个描边
        if (draggingPiece === this) {
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            this.pixels.forEach(p => {
                ctx.strokeRect(this.x + p.x * PIXEL_SIZE, this.y + p.y * PIXEL_SIZE, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
            });
        }
    }

    drawTarget(ctx) {
        ctx.fillStyle = "#f9f9f9";
        this.pixels.forEach(p => {
            ctx.fillRect(
                this.targetX + p.x * PIXEL_SIZE,
                this.targetY + p.y * PIXEL_SIZE,
                PIXEL_SIZE - 1,
                PIXEL_SIZE - 1
            );
        });
    }

    isPointInside(px, py) {
        if (this.isLocked) return false;
        return this.pixels.some(p => {
            const rx = this.x + p.x * PIXEL_SIZE;
            const ry = this.y + p.y * PIXEL_SIZE;
            return px >= rx && px <= rx + PIXEL_SIZE && py >= ry && py <= ry + PIXEL_SIZE;
        });
    }

    checkSnap() {
        if (this.isLocked) return true;
        const dist = Math.sqrt(Math.pow(this.x - this.targetX, 2) + Math.pow(this.y - this.targetY, 2));
        if (dist < 30) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isLocked = true;
            return true;
        }
        return false;
    }
}

function initGameFromData(data, region, idx) {
    currentLevelData = data;
    currentRegion = region;
    currentLevelIdx = idx;
    const dim = data.dim;
    PIXEL_SIZE = Math.min(60, 450 / dim);

    const mask = data.mask;
    const unassignedByColor = {};

    for (let y = 0; y < mask.length; y++) {
        for (let x = 0; x < mask[y].length; x++) {
            const colorId = mask[y][x];
            if (colorId !== 0) {
                if (!unassignedByColor[colorId]) unassignedByColor[colorId] = [];
                unassignedByColor[colorId].push({ x, y });
            }
        }
    }

    pieces = [];
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.7;

    const targetX = (canvas.width - mask[0].length * PIXEL_SIZE) / 2;
    const targetY = (canvas.height - mask.length * PIXEL_SIZE) / 2;

    for (const colorId in unassignedByColor) {
        const unassigned = unassignedByColor[colorId];
        while (unassigned.length > 0) {
            const startIdx = Math.floor(Math.random() * unassigned.length);
            const startPixel = unassigned.splice(startIdx, 1)[0];
            const piecePixels = [startPixel];
            const clusterLimit = dim <= 5 ? 2 : 4;
            let clusterSize = Math.floor(Math.random() * clusterLimit) + 2;

            for (let i = 0; i < clusterSize && unassigned.length > 0; i++) {
                let neighbors = [];
                piecePixels.forEach(p => {
                    [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(d => {
                        const nx = p.x + d.x, ny = p.y + d.y;
                        const idx = unassigned.findIndex(u => u.x === nx && u.y === ny);
                        if (idx !== -1) neighbors.push(idx);
                    });
                });
                if (neighbors.length > 0) {
                    piecePixels.push(unassigned.splice(neighbors[Math.floor(Math.random() * neighbors.length)], 1)[0]);
                }
            }
            pieces.push(new Piece(piecePixels, targetX, targetY, parseInt(colorId)));
        }
    }
    document.querySelector('.small-title').innerText = data.name;
    render();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => p.drawTarget(ctx));
    pieces.forEach(p => p.draw(ctx));
    const lockedCount = pieces.filter(p => p.isLocked).length;
    const progress = Math.round((lockedCount / pieces.length) * 100);
    progressEl.innerText = `${progress}%`;
    if (lockedCount === pieces.length && pieces.length > 0) {
        setTimeout(() => winOverlay.classList.remove('hidden'), 500);
    }
}

canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (let i = pieces.length - 1; i >= 0; i--) {
        if (pieces[i].isPointInside(mx, my)) {
            draggingPiece = pieces[i];
            offset.x = mx - draggingPiece.x;
            offset.y = my - draggingPiece.y;
            pieces.splice(i, 1);
            pieces.push(draggingPiece);
            break;
        }
    }
});

window.addEventListener('mousemove', e => {
    if (draggingPiece) {
        const rect = canvas.getBoundingClientRect();
        draggingPiece.x = e.clientX - rect.left - offset.x;
        draggingPiece.y = e.clientY - rect.top - offset.y;
        render();
    }
});

window.addEventListener('mouseup', () => {
    if (draggingPiece) {
        draggingPiece.checkSnap();
        draggingPiece = null;
        render();
    }
});

document.getElementById('playBtn').addEventListener('click', () => {
    startScreen.classList.add('hidden');
    levelScreen.classList.remove('hidden');
});

document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const region = btn.dataset.region;
        const levelIdx = parseInt(btn.dataset.level || 0);
        const levelData = FOOD_LEVELS[region][levelIdx];
        levelScreen.classList.add('hidden');
        gameUI.classList.remove('hidden');
        initGameFromData(levelData, region, levelIdx);
    });
});

document.getElementById('homeBtn').addEventListener('click', () => {
    gameUI.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

document.getElementById('backToMenu').addEventListener('click', () => {
    levelScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

document.getElementById('toLevelBtn').addEventListener('click', () => {
    winOverlay.classList.add('hidden');
    gameUI.classList.add('hidden');
    levelScreen.classList.remove('hidden');
});

document.getElementById('nextBtn').addEventListener('click', () => {
    winOverlay.classList.add('hidden');

    // 逻辑：寻找下一关
    const regions = Object.keys(FOOD_LEVELS);
    let nextIdx = currentLevelIdx + 1;
    let nextRegion = currentRegion;

    if (nextIdx >= FOOD_LEVELS[currentRegion].length) {
        // 当前区玩完了，去下一个区
        const currentRegionIdx = regions.indexOf(currentRegion);
        if (currentRegionIdx < regions.length - 1) {
            nextRegion = regions[currentRegionIdx + 1];
            nextIdx = 0;
        } else {
            // 全通关了
            alert("恭喜！你已拼完所有的全球美食！");
            winOverlay.classList.add('hidden');
            gameUI.classList.add('hidden');
            startScreen.classList.remove('hidden');
            return;
        }
    }

    const nextLevelData = FOOD_LEVELS[nextRegion][nextIdx];
    initGameFromData(nextLevelData, nextRegion, nextIdx);
});

document.getElementById('hintBtn').addEventListener('click', () => {
    initGameFromData(currentLevelData);
});

window.addEventListener('resize', () => {
    if (!gameUI.classList.contains('hidden') && currentLevelData) {
        initGameFromData(currentLevelData);
    }
});
