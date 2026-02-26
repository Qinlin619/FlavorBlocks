/**
 * Flavor Blocks - 核心逻辑 (v1.0.1)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const progressEl = document.getElementById('progress');
const winOverlay = document.getElementById('win-overlay');

// UI 元素
const startScreen = document.getElementById('start-screen');
const levelScreen = document.getElementById('level-screen');
const dishScreen = document.getElementById('dish-screen');
const dishList = document.getElementById('dish-list');
const gameUI = document.getElementById('game-ui');

// 核心状态
let PIXEL_SIZE = 60;
let currentLevelData = null;
let currentRegion = "asia";
let currentLevelIdx = 0;
let pieces = [];
let draggingPiece = null;
let offset = { x: 0, y: 0 };
let currentLang = 'zh'; // Default to zh as requested
let completedLevels = JSON.parse(localStorage.getItem('pixel_restaurant_completed') || '{}');

const I18N = {
    en: {
        title: "Flavor Blocks",
        play: "OPEN MENU",
        selectRegion: "MENU",
        selectDesc: "Discover the global flavors within every pixel",
        subTitle: "SELECT DISH",
        served: "SERVED",
        progress: "PREPARATION",
        winTitle: "DISH READY!",
        winDesc: "Your order has been served perfectly.",
        map: "MENU",
        next: "NEXT DISH",
        restart: "RESTART",
        congrats: "Incredible! You've tasted every delicacy in our restaurant!",
        back: "CLOSE",
        producer: "PRODUCER: 伞伞"
    },
    zh: {
        title: "寻味方块",
        play: "开启菜单",
        selectRegion: "菜单",
        selectDesc: "在像素之间，寻回味蕾的纯粹觉醒",
        subTitle: "请点餐",
        served: "已上菜",
        progress: "备菜进度",
        winTitle: "菜已经准备好了！",
        winDesc: "滋味归位，请慢用。",
        map: "菜单",
        next: "下一道菜",
        restart: "重做",
        congrats: "太棒了！你已经品鉴完了餐厅的所有美食！",
        back: "返回",
        producer: "制作人：伞伞"
    }
};

// 美食关卡数据库
const FOOD_LEVELS = {
    "asia": [
        {
            name: { en: "Onigiri", zh: "饭团" },
            dim: 5,
            mask: [
                [0, 0, 1, 0, 0],
                [0, 1, 1, 1, 0],
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 0, 1, 0, 0]
            ],
            colors: { 1: "#000000" },
            story: { en: "A grain of rice. Finding balance in Eastern delicacy.", zh: "故事从一粒米开始。在东方的精致中，寻找形状的平衡。" }
        },
        {
            name: { en: "Sushi", zh: "三文鱼握寿司" },
            dim: 6,
            mask: [
                [0, 2, 2, 2, 2, 0],
                [0, 2, 2, 2, 2, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1]
            ],
            colors: { 1: "#ffffff", 2: "#ff4757" },
            story: { en: "Minimalistic cutting, the highest respect for ingredients.", zh: "极简的切割，是对食材最高的敬意。" }
        },
        {
            name: { en: "Dumpling", zh: "中国饺子" },
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
            story: { en: "Wrapped with the warmth of reunion, every fold is a trace of time.", zh: "包裹着团圆的温度，每一个褶皱都是岁月的痕迹。" }
        },
        {
            name: { en: "Ramen", zh: "日本拉面" },
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
            story: { en: "Midnight comfort in a rich broth, pixelated lines sketch the noodle soup.", zh: "浓郁的汤底中，像素化的线条勾勒出深夜的慰藉。" }
        },
        ...Array.from({ length: 10 }, (_, i) => ({
            name: { en: `New Asia Dish ${i + 1}`, zh: `亚洲新品 ${i + 1}` },
            dim: 3,
            mask: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
            colors: { 1: "#f5f5f5" },
            story: { en: "A new creation is brewing...", zh: "一道神秘的新品正在研制中..." }
        }))
    ],
    "europe": [
        {
            name: { en: "Pizza", zh: "意式披萨" },
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
            colors: { 1: "#d35400", 2: "#f1c40f", 3: "#e74c3c" },
            story: { en: "Colors and temperature interweave on a round crust.", zh: "漫步在托斯卡纳的午后，色彩与温度交织在一张圆饼里。" }
        },
        {
            name: { en: "Croissant", zh: "牛角包" },
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
            story: { en: "The crisp morning of Paris, waking up in layered buttery scent.", zh: "巴黎清晨的酥脆，在层层叠叠的黄油香气中苏醒。" }
        },
        ...Array.from({ length: 10 }, (_, i) => ({
            name: { en: `New Europe Dish ${i + 1}`, zh: `欧陆新品 ${i + 1}` },
            dim: 3,
            mask: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
            colors: { 1: "#f5f5f5" },
            story: { en: "A new creation is brewing...", zh: "一道神秘的新品正在研制中..." }
        }))
    ],
    "americas": [
        {
            name: { en: "Burger", zh: "芝士汉堡" },
            dim: 8,
            mask: [
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [6, 6, 6, 6, 6, 6, 6, 6],
                [3, 3, 3, 3, 3, 3, 3, 3],
                [4, 4, 4, 4, 4, 4, 4, 4],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0]
            ],
            colors: { 1: "#e67e22", 6: "#f1c40f", 3: "#5d4037", 4: "#2ecc71" },
            story: { en: "Busy free harbor, also an order of layers stacked.", zh: "这是自由港口的繁忙，也是层层叠加的秩序。" }
        },
        {
            name: { en: "Taco", zh: "墨西哥卷饼" },
            dim: 8,
            mask: [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 4, 4, 4, 4, 1, 0],
                [1, 4, 3, 3, 3, 3, 4, 1],
                [1, 4, 2, 2, 2, 2, 4, 1],
                [1, 1, 1, 1, 1, 1, 1, 1]
            ],
            colors: { 1: "#f1c40f", 2: "#e74c3c", 3: "#2ecc71", 4: "#d35400" },
            story: { en: "All the passion wrapped in colorful flatbread.", zh: "所有的热情都被包裹在色彩鲜艳的饼皮之中。" }
        },
        {
            name: { en: "Donut", zh: "甜甜圈" },
            dim: 8,
            mask: [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 2, 2, 1, 1, 1],
                [1, 1, 2, 0, 0, 2, 1, 1],
                [1, 1, 2, 0, 0, 2, 1, 1],
                [1, 1, 1, 2, 2, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ],
            colors: { 1: "#ff9ff3", 2: "#feca57" },
            story: { en: "A sweet ring of happiness, glazed with pink dreams.", zh: "一颗圆润的快乐，淋上粉红色的梦幻果酱。" }
        },
        ...Array.from({ length: 10 }, (_, i) => ({
            name: { en: `New Americas Dish ${i + 1}`, zh: `美洲新品 ${i + 1}` },
            dim: 3,
            mask: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
            colors: { 1: "#f5f5f5" },
            story: { en: "A new creation is brewing...", zh: "一道神秘的新品正在研制中..." }
        }))
    ],
    "others": [
        {
            name: { en: "Fish & Chips", zh: "炸鱼薯条" },
            dim: 9,
            mask: [
                [0, 0, 0, 0, 0, 1, 1, 1, 1],
                [0, 0, 0, 0, 1, 1, 1, 1, 1],
                [2, 2, 2, 1, 1, 1, 1, 1, 1],
                [2, 2, 2, 1, 1, 1, 1, 1, 1],
                [2, 2, 2, 0, 0, 1, 1, 1, 0],
                [3, 3, 3, 3, 3, 3, 3, 3, 3],
                [0, 3, 3, 3, 3, 3, 3, 3, 0]
            ],
            colors: { 1: "#e67e22", 2: "#f1c40f", 3: "#ecf0f1" },
            story: { en: "Classic island comfort, wrapped in newspaper and tradition.", zh: "经典的海岛慰藉，包裹在旧报纸与传统之中。" }
        },
        {
            name: { en: "Hot Pot", zh: "重庆火锅" },
            dim: 10,
            mask: [
                [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
                [0, 2, 1, 1, 1, 1, 1, 1, 2, 0],
                [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                [2, 1, 3, 1, 1, 1, 3, 1, 1, 2],
                [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                [2, 1, 1, 3, 1, 3, 1, 1, 1, 2],
                [0, 2, 1, 1, 1, 1, 1, 1, 2, 0],
                [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
                [0, 0, 0, 4, 0, 0, 4, 0, 0, 0],
                [0, 0, 4, 4, 4, 4, 4, 4, 0, 0]
            ],
            colors: { 1: "#c0392b", 2: "#bdc3c7", 3: "#f1c40f", 4: "#2c3e50" },
            story: { en: "Bubbling red oil, spicy passion from the mist of Chongqing.", zh: "翻滚的红油，是山城迷雾中沸腾的热情。" }
        },
        ...Array.from({ length: 10 }, (_, i) => ({
            name: { en: `Special Special ${i + 1}`, zh: `特调新品 ${i + 1}` },
            dim: 3,
            mask: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
            colors: { 1: "#f5f5f5" },
            story: { en: "A new creation is brewing...", zh: "一道神秘的新品正在研制中..." }
        }))
    ]
};

class Piece {
    constructor(pixels, targetX, targetY, colorId) {
        this.pixels = pixels;
        this.targetX = targetX;
        this.targetY = targetY;
        this.colorId = colorId;
        this.color = currentLevelData.colors[colorId] || "#000000";

        // 初始随机位置：确保完全在画布内
        const minPixelX = Math.min(...pixels.map(p => p.x));
        const maxPixelX = Math.max(...pixels.map(p => p.x));
        const minPixelY = Math.min(...pixels.map(p => p.y));
        const maxPixelY = Math.max(...pixels.map(p => p.y));

        const pieceW = (maxPixelX - minPixelX + 1) * PIXEL_SIZE;
        const pieceH = (maxPixelY - minPixelY + 1) * PIXEL_SIZE;

        // 随机尝试放置直到不在目标位置正上方
        let attempts = 0;
        do {
            this.x = Math.random() * (canvas.width - pieceW) - minPixelX * PIXEL_SIZE;
            this.y = Math.random() * (canvas.height - pieceH) - minPixelY * PIXEL_SIZE;
            attempts++;
        } while (
            attempts < 10 &&
            Math.abs(this.x - this.targetX) < 100 &&
            Math.abs(this.y - this.targetY) < 100
        );

        this.isLocked = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.isLocked ? 1.0 : 0.9;
        this.pixels.forEach(p => {
            const rx = this.x + p.x * PIXEL_SIZE;
            const ry = this.y + p.y * PIXEL_SIZE;
            ctx.fillRect(rx, ry, PIXEL_SIZE - 1, PIXEL_SIZE - 1);

            // 为浅色块添加一个极淡的轮廓线，增强辨识度
            ctx.strokeStyle = "rgba(0,0,0,0.05)";
            ctx.lineWidth = 1;
            ctx.strokeRect(rx, ry, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
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
        // 目标槽位颜色：稍微深一点的灰色，并带上虚线边框感
        ctx.fillStyle = "rgba(0,0,0,0.03)";
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

        // 特殊逻辑：单块碎片可以互换目标位置，如果它们颜色相同且都是 1x1
        if (this.pixels.length === 1) {
            const p = this.pixels[0];
            for (let other of pieces) {
                // 如果是其他未鎖定的同色单块
                if (other !== this && !other.isLocked && other.pixels.length === 1 && other.colorId === this.colorId) {
                    const op = other.pixels[0];
                    // 检查此 piece 是否靠近 other piece 的目标位置
                    const targetXForThis = this.targetX + (op.x - p.x) * PIXEL_SIZE;
                    const targetYForThis = this.targetY + (op.y - p.y) * PIXEL_SIZE;

                    const dist = Math.sqrt(Math.pow(this.x - targetXForThis, 2) + Math.pow(this.y - targetYForThis, 2));
                    if (dist < 30) {
                        const oldPX = p.x;
                        const oldPY = p.y;
                        const oldOpX = op.x;
                        const oldOpY = op.y;

                        // 互换目标像素位置信息 (逻辑坐标)
                        p.x = oldOpX;
                        p.y = oldOpY;
                        op.x = oldPX;
                        op.y = oldPY;

                        // 同时补偿 other 的绘制坐标，确保其在屏幕上的物理位置保持不变，防止“瞬移”
                        other.x += (oldOpX - oldPX) * PIXEL_SIZE;
                        other.y += (oldOpY - oldPY) * PIXEL_SIZE;

                        this.x = this.targetX;
                        this.y = this.targetY;
                        this.isLocked = true;
                        return true;
                    }
                }
            }
        }

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

function applyLanguage() {
    const lang = I18N[currentLang];
    const mainTitle = document.getElementById('main-title');
    const menuTitle = document.getElementById('level-select-title');
    const subMenuTitle = document.getElementById('sub-menu-title');

    mainTitle.innerText = lang.title;

    // Toggle English styling for all major headers
    [mainTitle, menuTitle, subMenuTitle].forEach(el => {
        if (!el) return;
        if (currentLang === 'en') {
            el.classList.add('is-en');
        } else {
            el.classList.remove('is-en');
        }
    });

    document.getElementById('playBtn').innerText = lang.play;
    menuTitle.innerText = lang.selectRegion;
    const menuDesc = document.querySelector('.menu-description');
    if (menuDesc) menuDesc.innerText = lang.selectDesc;

    document.getElementById('game-ui-title').innerText = lang.title;
    document.getElementById('label-progress').innerText = lang.progress;
    document.getElementById('win-title').innerText = lang.winTitle;
    document.getElementById('win-desc').innerText = lang.winDesc;
    document.getElementById('toLevelBtn').innerText = lang.map;
    document.getElementById('restartWinBtn').innerText = lang.restart;
    document.getElementById('nextBtn').innerText = lang.next;
    document.getElementById('backToMenu').innerText = lang.back;
    const backToCarousel = document.getElementById('backToCarousel');
    if (backToCarousel) backToCarousel.innerText = lang.back;

    const producerEl = document.getElementById('producer-credit');
    if (producerEl) {
        producerEl.innerText = lang.producer;
        splitTextToSpans(producerEl);
    }

    // 同时对大标题也应用碎片重构
    if (mainTitle) {
        splitTextToSpans(mainTitle);
    }

    document.querySelectorAll('.dish-item').forEach(btn => {
        const region = btn.dataset.region;
        const levelIdx = parseInt(btn.dataset.level || 0);
        const data = FOOD_LEVELS[region][levelIdx];
        const key = `${region}_${levelIdx}`;

        const nameEl = btn.querySelector('.dish-name');
        if (nameEl) nameEl.innerText = data.name[currentLang];

        if (completedLevels[key]) {
            btn.classList.add('stamped');
        } else {
            btn.classList.remove('stamped');
        }
    });
}

function initGameFromData(data, region, idx) {
    isVictoryTriggered = false;
    winOverlay.classList.add('hidden');
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
    document.querySelector('.small-title').innerText = data.name[currentLang];
    const storyEl = document.getElementById('story-text');
    if (storyEl) {
        storyEl.innerText = data.story[currentLang];
        storyEl.style.animation = 'none';
        storyEl.offsetHeight;
        storyEl.style.animation = null;
    }
    render();
}

function showDishes(region) {
    currentRegion = region;
    const regionNames = {
        asia: { en: "ASIA", zh: "亚洲风味" },
        europe: { en: "EUROPE", zh: "欧陆风情" },
        americas: { en: "AMERICAS", zh: "美洲经典" },
        others: { en: "OTHERS", zh: "特调之选" }
    };

    document.getElementById('sub-menu-region').innerText = regionNames[region][currentLang];
    document.getElementById('sub-menu-title').innerText = I18N[currentLang].subTitle;
    document.getElementById('backToCarousel').innerText = I18N[currentLang].back;

    dishList.innerHTML = '';

    FOOD_LEVELS[region].forEach((levelData, idx) => {
        const key = `${region}_${idx}`;
        const item = document.createElement('button');
        item.className = 'dish-item';
        if (completedLevels[key]) item.classList.add('stamped');
        item.dataset.region = region;
        item.dataset.level = idx;

        item.innerHTML = `
            <span class="dish-name">${levelData.name[currentLang]}</span>
        `;

        item.addEventListener('click', () => {
            dishScreen.classList.add('hidden');
            gameUI.classList.remove('hidden');
            initGameFromData(levelData, region, idx);
        });

        dishList.appendChild(item);
    });

    levelScreen.classList.add('hidden');
    dishScreen.classList.remove('hidden');
}

function drawWinPreview() {
    const previewCanvas = document.getElementById('win-preview-canvas');
    const pCtx = previewCanvas.getContext('2d');
    const mask = currentLevelData.mask;
    const rows = mask.length;
    const cols = mask[0].length;

    const previewSize = 200;
    const padding = 20;
    const cellSize = Math.min((previewSize - padding * 2) / cols, (previewSize - padding * 2) / rows);

    pCtx.clearRect(0, 0, previewSize, previewSize);

    const offsetX = (previewSize - cols * cellSize) / 2;
    const offsetY = (previewSize - rows * cellSize) / 2;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const colorId = mask[y][x];
            if (colorId !== 0) {
                pCtx.fillStyle = currentLevelData.colors[colorId] || "#000";
                pCtx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize - 0.5, cellSize - 0.5);
            }
        }
    }
}

let isVictoryTriggered = false;

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => p.drawTarget(ctx));
    pieces.forEach(p => p.draw(ctx));
    const lockedCount = pieces.filter(p => p.isLocked).length;
    const progress = Math.round((lockedCount / pieces.length) * 100);
    progressEl.innerText = `${progress}%`;

    if (lockedCount === pieces.length && pieces.length > 0 && !isVictoryTriggered) {
        isVictoryTriggered = true;
        const key = `${currentRegion}_${currentLevelIdx}`;
        if (!completedLevels[key]) {
            completedLevels[key] = true;
            localStorage.setItem('pixel_restaurant_completed', JSON.stringify(completedLevels));
            applyLanguage(); // 更新菜单上的印章
        }
        setTimeout(() => {
            drawWinPreview();
            winOverlay.classList.remove('hidden');
        }, 400);
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
        let nextX = e.clientX - rect.left - offset.x;
        let nextY = e.clientY - rect.top - offset.y;

        // 边界限制：计算 piece 的实际宽度和高度
        const minPixelX = Math.min(...draggingPiece.pixels.map(p => p.x));
        const maxPixelX = Math.max(...draggingPiece.pixels.map(p => p.x));
        const minPixelY = Math.min(...draggingPiece.pixels.map(p => p.y));
        const maxPixelY = Math.max(...draggingPiece.pixels.map(p => p.y));

        const pieceLeft = nextX + minPixelX * PIXEL_SIZE;
        const pieceRight = nextX + (maxPixelX + 1) * PIXEL_SIZE;
        const pieceTop = nextY + minPixelY * PIXEL_SIZE;
        const pieceBottom = nextY + (maxPixelY + 1) * PIXEL_SIZE;

        if (pieceLeft < 0) nextX -= pieceLeft;
        if (pieceRight > canvas.width) nextX -= (pieceRight - canvas.width);
        if (pieceTop < 0) nextY -= pieceTop;
        if (pieceBottom > canvas.height) nextY -= (pieceBottom - canvas.height);

        draggingPiece.x = nextX;
        draggingPiece.y = nextY;
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

// 绑定语言切换按钮
const langBtn = document.getElementById('langBtn');
if (langBtn) {
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'zh' : 'en';
        applyLanguage();
        if (currentLevelData) {
            document.querySelector('.small-title').innerText = currentLevelData.name[currentLang];
            const storyEl = document.getElementById('story-text');
            if (storyEl) storyEl.innerText = currentLevelData.story[currentLang];
        }
    });
}

applyLanguage(); // 初始化执行一次

// 绑定风味卡片点击
document.querySelectorAll('.flavor-card').forEach(card => {
    card.addEventListener('click', () => {
        const region = card.dataset.region;
        showDishes(region);
    });
});

// 增加轮播图拖拽滚动功能
const carousel = document.querySelector('.flavor-carousel');
if (carousel) {
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener('mousedown', (e) => {
        isDown = true;
        carousel.classList.add('active');
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        carousel.style.cursor = 'grabbing';
    });

    carousel.addEventListener('mouseleave', () => {
        isDown = false;
        carousel.style.cursor = 'grab';
    });

    carousel.addEventListener('mouseup', () => {
        isDown = false;
        carousel.style.cursor = 'grab';
    });

    carousel.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2; // 滚动速度
        carousel.scrollLeft = scrollLeft - walk;
    });

    // 绑定左右箭头按钮逻辑
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextCarouselBtn');

    if (prevBtn && nextBtn) {
        const scrollAmount = 380; // 卡片宽度350 + 间距30
        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }
}

function splitTextToSpans(element) {
    const text = element.innerText;
    element.innerHTML = '';
    [...text].forEach((char, i) => {
        const span = document.createElement('span');
        span.innerText = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.animationDelay = `${Math.random() * 0.5 + i * 0.05}s`;

        // 赋予随机碎片初始方向
        const rx = (Math.random() - 0.5) * 40;
        const ry = (Math.random() - 0.5) * 40;
        span.style.setProperty('--rx', `${rx}px`);
        span.style.setProperty('--ry', `${ry}px`);

        span.className = 'pixel-fragment';
        element.appendChild(span);
    });
}

document.getElementById('backToMenu').addEventListener('click', () => {
    levelScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

document.getElementById('backToCarousel').addEventListener('click', () => {
    dishScreen.classList.add('hidden');
    levelScreen.classList.remove('hidden');
});

document.getElementById('homeBtn').addEventListener('click', () => {
    gameUI.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

document.getElementById('restartWinBtn').addEventListener('click', () => {
    winOverlay.classList.add('hidden');
    initGameFromData(currentLevelData, currentRegion, currentLevelIdx);
});

document.getElementById('toLevelBtn').addEventListener('click', () => {
    winOverlay.classList.add('hidden');
    gameUI.classList.add('hidden');
    dishScreen.classList.remove('hidden'); // Changed from levelScreen to dishScreen
});

document.getElementById('nextBtn').addEventListener('click', () => {
    winOverlay.classList.add('hidden');
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
            alert(I18N[currentLang].congrats);
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
