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
            dim: 4,
            mask: [[0, 1, 1, 0], [1, 1, 1, 1], [1, 1, 1, 1], [0, 2, 2, 0]],
            colors: { 1: "#ffffff", 2: "#333333" },
            story: { en: "A simple classic. Pure rice, pure heart.", zh: "一颗简单的饭团，是米饭最纯粹的仪式感。" }
        },
        {
            name: { en: "Kushiyaki", zh: "串烧" },
            dim: 6,
            mask: [
                [0, 0, 3, 0, 0, 0],
                [0, 1, 1, 1, 0, 0],
                [0, 2, 2, 2, 0, 0],
                [0, 1, 1, 1, 0, 0],
                [0, 2, 2, 2, 0, 0],
                [0, 0, 3, 0, 0, 0]
            ],
            colors: { 1: "#d35400", 2: "#e67e22", 3: "#8d6e63" },
            story: { en: "Sizzling over charcoal, the smoke carries the flavor.", zh: "炭火上的滋滋声，是深夜食堂最动听的音符。" }
        },
        {
            name: { en: "Ramen", zh: "日本拉面" },
            dim: 8,
            mask: [
                [0, 0, 4, 4, 4, 4, 0, 0],
                [0, 3, 3, 3, 3, 3, 3, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 2, 2, 2, 2, 2, 2, 1],
                [1, 2, 2, 5, 2, 2, 2, 1],
                [1, 2, 2, 2, 2, 2, 2, 1],
                [0, 1, 2, 2, 2, 2, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ],
            colors: { 1: "#e74c3c", 2: "#ffffff", 3: "#f1c40f", 4: "#2c3e50", 5: "#ffeb3b" },
            story: { en: "A warm bowl defined by its rich, pixelated broth.", zh: "一碗骨汤，足以慰藉像素世界的风尘。" }
        },
        {
            name: { en: "Sushi Platter", zh: "寿司拼盘" },
            dim: 10,
            mask: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 2, 2, 0, 0, 0],
                [1, 1, 1, 1, 2, 2, 2, 2, 0, 0],
                [0, 3, 3, 0, 0, 4, 4, 0, 0, 0],
                [3, 3, 3, 3, 4, 4, 4, 4, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 0, 0, 1, 1, 0, 0, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 2, 2, 0, 0, 2, 2, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ],
            colors: { 1: "#ffffff", 2: "#ff4757", 3: "#2ecc71", 4: "#f1c40f" },
            story: { en: "Diversity on a wooden plate, each piece a small art.", zh: "指尖的艺术，在方寸之间变幻出万千风味。" }
        },
        {
            name: { en: "Bento Box", zh: "便当盒" },
            dim: 12,
            mask: [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 2, 2, 2, 2, 1, 3, 3, 3, 3, 3, 1],
                [1, 2, 2, 2, 2, 1, 3, 3, 3, 3, 3, 1],
                [1, 2, 2, 2, 2, 1, 3, 3, 3, 3, 3, 1],
                [1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 1],
                [1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 4, 4, 4, 1, 5, 5, 5, 5, 5, 5, 1],
                [1, 4, 4, 4, 1, 5, 5, 5, 5, 5, 5, 1],
                [1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 1],
                [1, 6, 6, 6, 1, 5, 5, 5, 5, 5, 5, 1],
                [1, 6, 6, 6, 1, 5, 5, 5, 5, 5, 5, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ],
            colors: { 1: "#3e2723", 2: "#ffffff", 3: "#ffc107", 4: "#ff5252", 5: "#4caf50", 6: "#9e9e9e" },
            story: { en: "A complete world packed inside a neat grid.", zh: "小小的格子里，装着大大的惊喜。" }
        },
        {
            name: { en: "Xiao Long Bao", zh: "小笼包" },
            dim: 13,
            mask: Array(13).fill(0).map((_, y) => Array(13).fill(0).map((_, x) => (Math.sqrt((x - 6) ** 2 + (y - 7) ** 2) < 5 ? 1 : 0))),
            colors: { 1: "#fefefe", 2: "#e0e0e0" },
            story: { en: "Thins skin, rich soup, a burst of heat and flavor.", zh: "薄皮大馅，一口爆汁。" }
        },
        {
            name: { en: "Bibimbap", zh: "石锅拌饭" },
            dim: 15,
            mask: Array(15).fill(0).map((_, y) => Array(15).fill(0).map((_, x) => (y > 10 && Math.abs(x - 7) < 6 ? 2 : (Math.sqrt((x - 7) ** 2 + (y - 6) ** 2) < 6 ? 1 : 0)))),
            colors: { 1: "#ffffff", 2: "#424242", 3: "#ff5722", 4: "#4caf50" },
            story: { en: "Colorful ingredients mixing into a rhythmic sizzle.", zh: "五彩斑斓的食材，在石锅里热烈起舞。" }
        },
        {
            name: { en: "Dim Sum", zh: "广式点心" },
            dim: 16,
            mask: Array(16).fill(0).map((_, y) => 1), // Placeholder logic for complexity
            colors: { 1: "#f5f5f5" },
            story: { en: "The morning tea culture, thousands of flavors in small steamers.", zh: "一盅两件，叹茶人生。" }
        },
        {
            name: { en: "Tom Yum", zh: "冬阴功汤" },
            dim: 18,
            mask: Array(18).fill(0).map((_, y) => 1),
            colors: { 1: "#ff7043" },
            story: { en: "Sour, spicy, and the aroma of Southeast Asia.", zh: "酸辣奔放，萨瓦迪卡式的热情。" }
        },
        {
            name: { en: "Indian Thali", zh: "印度塔里" },
            dim: 20,
            mask: Array(20).fill(0).map((_, y) => 1),
            colors: { 1: "#fb8c00" },
            story: { en: "A round journey of spices and vibrant colors.", zh: "一场关于香料与色彩的圆满旅行。" }
        }
    ],
    "europe": [
        {
            name: { en: "Baguette", zh: "法棍" },
            dim: 4,
            mask: [[0, 1, 1, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 1, 1, 0]],
            colors: { 1: "#edbf69" },
            story: { en: "Simple flour and water, the soul of Paris.", zh: "面粉与水的奇迹，它是巴黎的呼吸。" }
        },
        {
            name: { en: "Cheese", zh: "奶酪" },
            dim: 5,
            mask: [[1, 1, 1, 1, 1], [1, 0, 1, 0, 1], [1, 1, 1, 1, 1], [1, 0, 1, 1, 1], [1, 1, 1, 0, 1]],
            colors: { 1: "#ffd54f" },
            story: { en: "Time is the secret ingredient of this gold.", zh: "时间是奶酪最好的调味师。" }
        },
        {
            name: { en: "Croissant", zh: "牛角包" },
            dim: 8,
            mask: [[0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]],
            colors: { 1: "#e67e22" },
            story: { en: "Layered crispy morning, smelling like butter.", zh: "层层叠叠的酥脆，唤醒沉睡的味蕾。" }
        },
        {
            name: { en: "Macaron Tower", zh: "马卡龙塔" },
            dim: 10,
            mask: Array(10).fill(0).map((_, y) => 1),
            colors: { 1: "#ff80ab", 2: "#b39ddb", 3: "#80deea" },
            story: { en: "Sweet gems stacked into a colorful dream.", zh: "五彩斑斓的小圆饼，叠起少女心的梦。" }
        },
        {
            name: { en: "Pizza", zh: "拿坡里披萨" },
            dim: 11,
            mask: Array(11).fill(0).map((_, y) => 1),
            colors: { 1: "#f44336", 2: "#ffeb3b", 3: "#4caf50" },
            story: { en: "Thin crust, fresh basil, the Italian standard.", zh: "薄底焦香，这才是披萨该有的样子。" }
        },
        {
            name: { en: "Sausage Platter", zh: "德式香肠拼盘" },
            dim: 13,
            mask: Array(13).fill(0).map((_, y) => 1),
            colors: { 1: "#795548" },
            story: { en: "Hearty and rustic, the taste of the countryside.", zh: "粗犷豪放的满足感。" }
        },
        {
            name: { en: "Afternoon Tea", zh: "英式下午茶" },
            dim: 14,
            mask: Array(14).fill(0).map((_, y) => 1),
            colors: { 1: "#fdfdfd" },
            story: { en: "Elegance on a three-tier stand, clinking of silver.", zh: "优雅的三层架，是午后最闲适的仪式。" }
        },
        {
            name: { en: "Paella", zh: "西班牙海鲜饭" },
            dim: 16,
            mask: Array(16).fill(0).map((_, y) => 1),
            colors: { 1: "#fbc02d" },
            story: { en: "Golden saffron rice, the treasure of the ocean.", zh: "藏红花的金色，海鮮的鮮甜。" }
        },
        {
            name: { en: "Black Forest", zh: "黑森林蛋糕" },
            dim: 18,
            mask: Array(18).fill(0).map((_, y) => 1),
            colors: { 1: "#212121", 2: "#ffffff", 3: "#d32f2f" },
            story: { en: "Chocolate, cream, and a hint of cherry spirits.", zh: "巧克力与樱桃的浪漫邂逅。" }
        },
        {
            name: { en: "Greek Salad", zh: "希腊沙拉" },
            dim: 20,
            mask: Array(20).fill(0).map((_, y) => 1),
            colors: { 1: "#4caf50", 2: "#ffffff", 3: "#212121" },
            story: { en: "Fresh, healthy, the blue of the Mediterranean.", zh: "地中海的和风，伴着橄榄与奶酪。" }
        }
    ],
    "americas": [
        {
            name: { en: "Avocado", zh: "酪梨" },
            dim: 4,
            mask: [[0, 1, 1, 0], [1, 1, 1, 1], [1, 1, 1, 1], [0, 1, 1, 0]],
            colors: { 1: "#8bc34a" },
            story: { en: "The smooth green butter of the tropics.", zh: "森林奶油，轻盈丝滑。" }
        },
        {
            name: { en: "Hot Dog", zh: "热狗" },
            dim: 6,
            mask: [[0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 1, 0], [2, 2, 2, 2, 2, 2], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
            colors: { 1: "#ffb74d", 2: "#e57373" },
            story: { en: "Lively baseball games and the scent of mustard.", zh: "球场上的欢呼声，总是伴着这一口香气。" }
        },
        {
            name: { en: "Popcorn", zh: "爆米花" },
            dim: 7,
            mask: Array(7).fill(0).map((_, y) => 1),
            colors: { 1: "#fff9c4", 2: "#e53935" },
            story: { en: "Wait for the pop, wait for the magic.", zh: "在“砰砰”声中，魔法开始了。" }
        },
        {
            name: { en: "Donut", zh: "甜甜圈" },
            dim: 8,
            mask: [[0, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 0, 0, 0, 0, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 1, 0]],
            colors: { 1: "#ff80ab" },
            story: { en: "Sweet ring of happiness, colorful sprinkles.", zh: "让心情在那一圈甜美中起飞。" }
        },
        {
            name: { en: "Burger", zh: "双层汉堡" },
            dim: 10,
            mask: Array(10).fill(0).map((_, y) => 1),
            colors: { 1: "#ffa726", 2: "#5d4037", 3: "#43a047" },
            story: { en: "Towering layers of classic American satisfaction.", zh: "层层叠加的自由与狂野。" }
        },
        {
            name: { en: "Taco", zh: "墨西哥塔可" },
            dim: 12,
            mask: Array(12).fill(0).map((_, y) => 1),
            colors: { 1: "#ffd54f", 2: "#f44336", 3: "#4caf50" },
            story: { en: "Spicy passion folded in a crunchy shell.", zh: "脆壳里的火辣热情。" }
        },
        {
            name: { en: "Cookie", zh: "巧克力曲奇" },
            dim: 14,
            mask: Array(14).fill(0).map((_, y) => 1),
            colors: { 1: "#8d6e63", 2: "#3e2723" },
            story: { en: "Soft, chewy, and the melty chocolate dots.", zh: "软心曲奇，藏着融化的暖意。" }
        },
        {
            name: { en: "Ceviche", zh: "秘鲁生鱼片" },
            dim: 16,
            mask: Array(16).fill(0).map((_, y) => 1),
            colors: { 1: "#ffffff", 2: "#81d4fa" },
            story: { en: "Acidic freshness from the ancient Andes.", zh: "柠檬浸渍的鲜甜。" }
        },
        {
            name: { en: "Nachos", zh: "纳乔斯" },
            dim: 18,
            mask: Array(18).fill(0).map((_, y) => 1),
            colors: { 1: "#ffeb3b", 2: "#00c853" },
            story: { en: "Golden triangles for ultimate sharing.", zh: "分享快乐的金色三角阵。" }
        },
        {
            name: { en: "BBQ Platter", zh: "巴西烤肉拼盘" },
            dim: 20,
            mask: Array(20).fill(0).map((_, y) => 1),
            colors: { 1: "#4e342e" },
            story: { en: "Smoke, fire, and the primitive taste of meat.", zh: "奔放的巴西风情。" }
        }
    ],
    "africa": [
        {
            name: { en: "Pita", zh: "皮塔饼" },
            dim: 4,
            mask: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [0, 0, 0, 0]],
            colors: { 1: "#f5f5dc" },
            story: { en: "The pocket bread, a historical container of flavors.", zh: "口袋里的美食乾坤。" }
        },
        {
            name: { en: "Dates", zh: "椰枣" },
            dim: 6,
            mask: [[0, 1, 1, 0, 0, 0], [0, 1, 1, 0, 0, 0], [0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
            colors: { 1: "#3e2723" },
            story: { en: "The candy of the desert, natural sweetness.", zh: "沙漠里的天然糖果。" }
        },
        {
            name: { en: "Hummus", zh: "鹰嘴豆泥" },
            dim: 8,
            mask: Array(8).fill(0).map((_, y) => 1),
            colors: { 1: "#e0e0e0" },
            story: { en: "Creamy bliss from crushed chickpeas.", zh: "细腻润滑，中东之魂。" }
        },
        {
            name: { en: "Kebab", zh: "烤肉串" },
            dim: 10,
            mask: Array(10).fill(0).map((_, y) => 1),
            colors: { 1: "#795548" },
            story: { en: "Skewers of heritage, charred to perfection.", zh: "丝绸之路上传承的烟火气。" }
        },
        {
            name: { en: "Falafel", zh: "法拉费" },
            dim: 11,
            mask: Array(11).fill(0).map((_, y) => 1),
            colors: { 1: "#8d6e63" },
            story: { en: "Crispy green balls of goodness.", zh: "酥脆的外表，翠绿的内心。" }
        },
        {
            name: { en: "Tagine", zh: "塔吉锅" },
            dim: 13,
            mask: Array(13).fill(0).map((_, y) => 1),
            colors: { 1: "#ff7043" },
            story: { en: "The iconic cone lid, stewing magic inside.", zh: "神奇的尖顶帽，锁住每一滴原汁。" }
        },
        {
            name: { en: "Couscous", zh: "库斯库斯" },
            dim: 15,
            mask: Array(15).fill(0).map((_, y) => 1),
            colors: { 1: "#fff176" },
            story: { en: "Tiny grains, massive tradition.", zh: "北非明珠，粒粒金黄。" }
        },
        {
            name: { en: "Injera", zh: "英杰拉" },
            dim: 17,
            mask: Array(17).fill(0).map((_, y) => 1),
            colors: { 1: "#d7ccc8" },
            story: { en: "The flatbread that is also your plate and fork.", zh: "既是盘子，也是餐具。" }
        },
        {
            name: { en: "Turkish Delight", zh: "土耳其软糖" },
            dim: 19,
            mask: Array(19).fill(0).map((_, y) => 1),
            colors: { 1: "#f06292" },
            story: { en: "Soft, rose-scented cubes of ancient joy.", zh: "指尖的香甜软糯。" }
        },
        {
            name: { en: "Baklava", zh: "巴卡拉瓦" },
            dim: 20,
            mask: Array(20).fill(0).map((_, y) => 1),
            colors: { 1: "#edbf69" },
            story: { en: "Layers of thin pastry and honey-soaked nuts.", zh: "千层酥脆，蜜意浓情。" }
        }
    ],
    "oceania": [
        {
            name: { en: "Kiwi", zh: "奇异果" },
            dim: 4,
            mask: [[0, 1, 1, 0], [1, 1, 1, 1], [1, 1, 1, 1], [0, 1, 1, 0]],
            colors: { 1: "#8bc34a" },
            story: { en: "The emerald fruit of the Pacific.", zh: "太平洋的祖母绿珍宝。" }
        },
        {
            name: { en: "Toast", zh: "维吉麦吐司" },
            dim: 6,
            mask: [[1, 1, 1, 1, 1, 1], [1, 2, 2, 2, 2, 1], [1, 2, 2, 2, 2, 1], [1, 2, 2, 2, 2, 1], [1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0]],
            colors: { 1: "#ffa726", 2: "#212121" },
            story: { en: "A bold Aussie salty morning icon.", zh: "澳洲人刻在DNA里的咸鲜。" }
        },
        {
            name: { en: "Meat Pie", zh: "澳洲肉馅饼" },
            dim: 8,
            mask: Array(8).fill(0).map((_, y) => 1),
            colors: { 1: "#edbf69" },
            story: { en: "The humble hero of Australian footy matches.", zh: "捧在手边的温暖慰藉。" }
        },
        {
            name: { en: "Fish & Chips", zh: "炸鱼薯条" },
            dim: 10,
            mask: Array(10).fill(0).map((_, y) => 1),
            colors: { 1: "#ffca28" },
            story: { en: "Classic island comfort, newspaper not included.", zh: "海风带走的，只有这一口酥香。" }
        },
        {
            name: { en: "Fairy Bread", zh: "仙女面包" },
            dim: 11,
            mask: Array(11).fill(0).map((_, y) => 1),
            colors: { 1: "#ffffff", 2: "#ff7043", 3: "#4caf50" },
            story: { en: "Butter, sprinkles, and childhood memories.", zh: "彩色糖珠洒下的童年幻境。" }
        },
        {
            name: { en: "Lamington", zh: "拉明顿蛋糕" },
            dim: 13,
            mask: Array(13).fill(0).map((_, y) => 1),
            colors: { 1: "#4e342e", 2: "#ffffff" },
            story: { en: "The National Cake, rolled in coconut snow.", zh: "裹着椰丝白雪的巧克力方块。" }
        },
        {
            name: { en: "Mud Crab", zh: "泥蟹" },
            dim: 15,
            mask: Array(15).fill(0).map((_, y) => 1),
            colors: { 1: "#f44336" },
            story: { en: "Majestic flavor from the deep estuaries.", zh: "来自远古湿地的鲜味霸主。" }
        },
        {
            name: { en: "Flat White", zh: "平白咖啡" },
            dim: 16,
            mask: Array(16).fill(0).map((_, y) => 1),
            colors: { 1: "#6d4c41", 2: "#ffffff" },
            story: { en: "Silky microfoam, the Oceania caffeine standard.", zh: "天鹅绒般的奶泡，大洋洲的清晨之光。" }
        },
        {
            name: { en: "Pavlova", zh: "帕夫洛娃蛋糕" },
            dim: 18,
            mask: Array(18).fill(0).map((_, y) => 1),
            colors: { 1: "#ffffff", 2: "#ff4081" },
            story: { en: "As clouds as a ballerina's dress.", zh: "如天鹅湖般的轻盈与纯洁。" }
        },
        {
            name: { en: "Seafood", zh: "海鲜大拼盘" },
            dim: 20,
            mask: Array(20).fill(0).map((_, y) => 1),
            colors: { 1: "#ef5350", 2: "#ffa726" },
            story: { en: "An extravaganza of the bountiful ocean.", zh: "大海慷慨赋予的终极盛宴。" }
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
        ctx.save();

        const piecePath = new Path2D();
        this.pixels.forEach(p => {
            const rx = this.x + p.x * PIXEL_SIZE;
            const ry = this.y + p.y * PIXEL_SIZE;
            piecePath.rect(rx, ry, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
        });

        // 1. 先绘制整体阴影（如果未锁定）
        if (!this.isLocked) {
            ctx.shadowColor = "rgba(0,0,0,0.15)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 5;
            ctx.fillStyle = this.color;
            ctx.fill(piecePath);

            // 绘制完阴影后立即关闭，防止后续描边也带阴影
            ctx.shadowColor = "transparent";
        }

        // 2. 绘制实际色块填充
        ctx.fillStyle = this.color;
        ctx.fill(piecePath);

        // 3. 绘制每个小方块的边界（这部分不带阴影）
        ctx.strokeStyle = this.isLocked ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.12)";
        ctx.lineWidth = 1;
        this.pixels.forEach(p => {
            const rx = this.x + p.x * PIXEL_SIZE;
            const ry = this.y + p.y * PIXEL_SIZE;
            ctx.strokeRect(rx, ry, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
        });

        ctx.restore();

        // 4. 如果选中，画个更明显的黑色加粗描边
        if (draggingPiece === this) {
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            this.pixels.forEach(p => {
                ctx.strokeRect(this.x + p.x * PIXEL_SIZE, this.y + p.y * PIXEL_SIZE, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
            });
        }
    }

    drawTarget(ctx) {
        // 目标槽位颜色：使其在灰/白色背景下都清晰
        ctx.fillStyle = "rgba(255,255,255,0.4)"; // 在深灰色背景上显示浅色区域
        this.pixels.forEach(p => {
            ctx.fillRect(
                this.targetX + p.x * PIXEL_SIZE,
                this.targetY + p.y * PIXEL_SIZE,
                PIXEL_SIZE - 1,
                PIXEL_SIZE - 1
            );
            // 给目标槽位也带上一层透明细线
            ctx.strokeStyle = "rgba(0,0,0,0.05)";
            ctx.strokeRect(
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

    _getMinCoords() {
        let minX = Infinity, minY = Infinity;
        for (let p of this.pixels) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
        }
        return { x: minX, y: minY };
    }

    _getNormalizedPixels() {
        const min = this._getMinCoords();
        return this.pixels
            .map(p => ({ x: p.x - min.x, y: p.y - min.y }))
            .sort((a, b) => a.x - b.x || a.y - b.y);
    }

    _hasSameShape(other) {
        if (this.pixels.length !== other.pixels.length) return false;
        const norm1 = this._getNormalizedPixels();
        const norm2 = other._getNormalizedPixels();
        for (let i = 0; i < norm1.length; i++) {
            if (norm1[i].x !== norm2[i].x || norm1[i].y !== norm2[i].y) return false;
        }
        return true;
    }

    checkSnap() {
        if (this.isLocked) return true;

        // 查找所有形状和颜色相同且尚未锁定的碎片（包括自己）
        const identicalPieces = pieces.filter(p =>
            !p.isLocked &&
            p.colorId === this.colorId &&
            this._hasSameShape(p)
        );

        for (let targetPiece of identicalPieces) {
            // 计算如果吸附到 targetPiece 的目标位置，当前 piece 应该处于的绘制坐标
            const thisMin = this._getMinCoords();
            const targetMin = targetPiece._getMinCoords();

            const idealX = this.targetX + (targetMin.x - thisMin.x) * PIXEL_SIZE;
            const idealY = this.targetY + (targetMin.y - thisMin.y) * PIXEL_SIZE;

            const dist = Math.sqrt(Math.pow(this.x - idealX, 2) + Math.pow(this.y - idealY, 2));
            if (dist < 30) {
                // 如果不是自己的原始位置，则交换像素坐标信息
                if (targetPiece !== this) {
                    const tempPixels = this.pixels;
                    this.pixels = targetPiece.pixels;
                    targetPiece.pixels = tempPixels;

                    // 补偿被交换碎片的视觉位置，防止瞬间位移
                    targetPiece.x += (targetMin.x - thisMin.x) * PIXEL_SIZE;
                    targetPiece.y += (targetMin.y - thisMin.y) * PIXEL_SIZE;
                }

                this.x = this.targetX;
                this.y = this.targetY;
                this.isLocked = true;
                return true;
            }
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
    const mapLabel = document.querySelector('#toLevelBtn .win-btn-label');
    if (mapLabel) mapLabel.innerText = lang.map;
    else document.getElementById('toLevelBtn').innerText = lang.map;

    const restartLabel = document.querySelector('#restartWinBtn .win-btn-label');
    if (restartLabel) restartLabel.innerText = lang.restart;
    else document.getElementById('restartWinBtn').innerText = lang.restart;

    const nextLabel = document.querySelector('#nextBtn .win-btn-label');
    if (nextLabel) nextLabel.innerText = lang.next;
    else document.getElementById('nextBtn').innerText = lang.next;
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

    const regionNames = {
        asia: { en: "ASIA", zh: "亚洲风味" },
        europe: { en: "EUROPE", zh: "欧陆风情" },
        americas: { en: "AMERICAS", zh: "美洲经典" },
        africa: { en: "AFRICA", zh: "非洲风情" },
        oceania: { en: "OCEANIA", zh: "大洋洲味道" }
    };
    document.querySelectorAll('.flavor-card').forEach(card => {
        const region = card.dataset.region;
        const h3 = card.querySelector('.card-header h3');
        if (h3) {
            h3.innerText = regionNames[region][currentLang];
        }
        const exploreText = card.querySelector('.explore-text');
        if (exploreText) {
            exploreText.innerText = currentLang === 'en' ? "EXPLORE DISHES" : "探索菜品";
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
    canvas.height = window.innerHeight * 0.6; // Reduced from 0.7 to ensure UI fits on screen

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
        africa: { en: "AFRICA", zh: "非洲风情" },
        oceania: { en: "OCEANIA", zh: "大洋洲味道" }
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
    const padding = 25; // Slightly more padding for aesthetics

    // 找到非零像素的实际边界
    let minX = cols, maxX = -1, minY = rows, maxY = -1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (mask[y][x] !== 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // 如果是空关卡则直接返回
    if (maxX === -1) return;

    const contentWidth = maxX - minX + 1;
    const contentHeight = maxY - minY + 1;

    // 根据实际内容大小计算格子尺寸，确保内容居中且撑满
    const cellSize = Math.min((previewSize - padding * 2) / contentWidth, (previewSize - padding * 2) / contentHeight);

    pCtx.clearRect(0, 0, previewSize, previewSize);

    // 计算居中偏移量
    const offsetX = (previewSize - contentWidth * cellSize) / 2;
    const offsetY = (previewSize - contentHeight * cellSize) / 2;

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const colorId = mask[y][x];
            if (colorId !== 0) {
                pCtx.fillStyle = currentLevelData.colors[colorId] || "#000";

                const px = Math.floor(offsetX + (x - minX) * cellSize);
                const py = Math.floor(offsetY + (y - minY) * cellSize);
                const pw = Math.ceil(cellSize) + 1;
                const ph = Math.ceil(cellSize) + 1;

                pCtx.fillRect(px, py, pw, ph);

                // 极淡的边框
                pCtx.strokeStyle = "rgba(0,0,0,0.06)";
                pCtx.lineWidth = 1;
                pCtx.strokeRect(px, py, pw, ph);
            }
        }
    }
}

let isVictoryTriggered = false;

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 绘制目标底槽
    pieces.forEach(p => p.drawTarget(ctx));

    // 2. 绘制已锁定的碎片（作为背景底层）
    pieces.filter(p => p.isLocked).forEach(p => p.draw(ctx));

    // 3. 绘制未锁定的碎片（悬浮在顶层，确保容易被看到和拾取）
    pieces.filter(p => !p.isLocked).forEach(p => p.draw(ctx));

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

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
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
}, { passive: false });

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

window.addEventListener('touchmove', e => {
    if (draggingPiece) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        let nextX = touch.clientX - rect.left - offset.x;
        let nextY = touch.clientY - rect.top - offset.y;

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
}, { passive: false });

window.addEventListener('mouseup', () => {
    if (draggingPiece) {
        draggingPiece.checkSnap();
        draggingPiece = null;
        render();
    }
});

window.addEventListener('touchend', e => {
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
    showDishes(currentRegion);
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
    initGameFromData(currentLevelData, currentRegion, currentLevelIdx);
});

window.addEventListener('resize', () => {
    if (!gameUI.classList.contains('hidden') && currentLevelData) {
        initGameFromData(currentLevelData, currentRegion, currentLevelIdx);
    }
});
