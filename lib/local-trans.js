window.ra2webInjection = {
    joy: null,
    CdApi: null,
};
/**
 * 额外的翻译和DOM处理逻辑
 */
ra2webInjection.translationMap = {
    '当前游戏模式不可用': "当前游戏模式不可用，请微信关注公众号 思牛逼 阅读里面文章获取解决方案！",
    'Americas & Europe': "北美-欧洲大区",
    'South-East Asia': "大中华区",
    "https://xwis.net/dl/Red-Alert-2-Multiplayer.exe": "dom-node:discordlink",
    "Running version PvPGN 1.99.7.1.1-PRO.": "严禁辱骂、发表种族歧视言论、恶意骚扰行为，轻则禁言，重则永久封号",
    'Ladder Season 4 is live. Play a "Quick Match" and get your rank badge now!': "第四赛季已经开赛！！主菜单选择 排位赛 尽情取得自己的徽章吧！！",
    'Ladder Season 2 is live. Play a "Quick Match" and get your rank badge now!':
        "这里是联机大厅，你也可以从主菜单的‘快速匹配’选项来开启排位赛征程并获得徽章！现在天梯第二赛季已经开赛，尽情挑战吧！游玩人机请返回主菜单并选择 单机模式",
    "Having trouble with a command? Type /help to learn more about it.":
        "不了解聊天指令如何操作？输入/help并回车获取更多关于聊天指令的介绍。",
    'Ladder Season 2 is live. Play a "Quick Match" and get your rank badge now! ':
        "这里是联机大厅，你也可以从主菜单的‘快速匹配’选项来开启排位赛征程并获得徽章！现在天梯第二赛季已经开赛，尽情挑战吧！游玩人机请返回主菜单并选择 单机模式",
    "Join us on Discord: https://discord.gg/uavJ34JTWY":
        "网页红井问题反馈，请微信关注公众号 思牛逼 获取",
    您加入了美國指揮中心頻道:
        "您已返回房间大厅。问题反馈、游戏交流，欢迎微信关注公众号 思牛逼",
    您已經與伺服器斷線了:
        "您已经与服务器断开连接，微信关注公众号 思牛逼 阅读里面文章获取解决方案",
    自訂戰役: "定制对局",
    基地重新部署: "基地可重新部署",
    升級工具箱: "随机宝箱",
    部隊數: "初始作战单位",
    資金: "初始资金",
    遭遇戰模式: "单机模式",
    於盟友建造場旁建設: "可在盟友建造场旁建造",
    起始位置: "出生点",
    播放: "启动",
    "您的密碼必須為八個字元長。": "你的密码必须为8个字符",
    新帳號: "注册",
    綽號: "账号",
    快速配對競賽: "排位赛",
    自訂競賽: "联机大厅",
    巨砲: "巨炮",
    "法國的巨砲是究極防守武器，能發射長程破壞力驚人的砲彈。":
        "法国巨炮拥有惊人破坏力。可被V3火箭、驱逐舰、火箭飞行兵、天启坦克等单位克制，除此之外几乎是所向披靡。对了，小心被停电和红警魔鬼蓝天。",
    傘兵: "空降部队",
    "美國擁有世上最佳的傘兵。興建一座空指部，空降傘兵到戰場的各個角落。":
        "美国可以建造空指部获取空降部队支援权限，每隔一段时间后可以在任意地点空投8名美国大兵。该支援可与占领科技机场后的伞兵同时存在！",
    黑鷹戰機: "黑鹰战机",
    "黑鷹戰機是世界上最具威脅性的戰機之一。韓國軍隊一向受到這些戰技高超的戰機飛行員，和威力強大的戰轟機保護。":
        "韩国黑鹰战机与入侵者战机价格一样，但其装甲与火力远超入侵者战机。7架飞机可以瞬间摧毁敌方基地！",
    坦克殺手: "坦克杀手",
    "德國坦克殺手能輕易消滅敵方車輛，但先進的穿甲砲對付敵方步兵或建築物則威力欠佳。":
        "德国坦克杀手可以轻松消灭敌方载具，尤其是消灭敌方矿车以摧毁敌方经济来源，但对付步兵和建筑犹如挠痒痒一样几乎伤害为零。受制于炮塔不能旋转，只能在小规模纯坦克作战情况下发挥优异的作用。",
    狙擊手: "狙击手",
    "英國狙擊手能輕易在遠距離宰殺敵方步兵。":
        "英国狙击手可以轻松击杀敌方步兵于超远的距离。如果将其派驻到多功能步兵车，可以帮助步兵车尽快升级。对建筑和载具伤害如挠痒痒一样几乎为0.",
    自爆卡車: "自爆卡车",
    "利比亞自爆卡車能摧毀敵方目標，引爆小型核彈。":
        "利比亚自爆卡车可以在接近敌人时引爆小型核弹，与敌人一起上西天。小心保护，不要让别人在自家引爆！",
    輻射工兵: "辐射工兵",
    "伊拉克輻射工兵能用輻射砲射出的有毒輻射污染土地，以及毀滅敵方部隊。":
        "伊拉克辐射工兵可以远程瞬间融化敌人步兵和击杀载具。部署后可形成辐射场，批量损毁载具和融化步兵，但这种模式不会为他带来经验。",
    恐怖份子: "恐怖分子",
    "古巴恐怖份子為蘇維埃犧牲性命在所不惜，會在身上綁上炸彈，直接衝入敵陣，再加以引爆，炸死自己和所有靠近的敵人。":
        "古巴恐怖分子可以灵活、快速地接近敌人并引爆炸药。当其进入盟军的多功能步兵车，将化身小型自爆卡车！从建筑的不同角度接近自爆伤害大有差异，也可以配合疯狂伊文绑上炸弹进入防空履带车，请尽情探索！",
    "俄國磁能坦克能發射出短距磁能彈，讓敵方車輛短路，甚至能以弧形穿越敵方圍牆。":
        "苏俄磁能坦克拥有均衡的速度和稍高于普通坦克的攻击，可以越过敌人围墙攻击，升级到精英级别后射出的闪电会分叉。",
    OR: "或",
    "Prefetching assets...": "提前拉取资源中",
    "Connecting...": "连接中...",
    "Downloading...": "下载中...",
    "Loading...": "加载中...",
    "The download failed, please check your connection and try again later.":
        "下载失败，请检查你的网络连接并刷新重试。",
    "Locate original game assets": "定位游戏源文件（这将让你最快开始体验）",
    "If you have a copy of RA2 already installed, you can import it below. You can also download a free multiplayer-only RA2 archive from XWIS.net (official server) here:":
        "如果您已安装 RA2(红色警戒2) 副本，您可直接导入。您还可以从 XWIS.net（官方服务器）下载一个免费的仅限多人游戏的 RA2 存档，请用下载工具复制下面的链接下载：",
    'HINT: Use Right-click -> "Save link as...", then drop the downloaded file in the box below:Download size: ~200 MiB':
        "提示：右键点击链接->链接另存为，下载完毕后把东西拖入这个窗口。下载大小大约200MB",
    "Select folder...": "选择文件夹",
    "Select archive...": "选择归档包",
    "Supported archive formats: rar, tar, tar.gz, tar.bz2, tar.xz, zip, 7z, exe (sfx)":
        "支持的归档类型：rar, tar, tar.gz, tar.bz2, tar.xz, zip, 7z, exe (sfx)",
    "Drop the required game files hereOR": "将上面两类东西拖动到此，或者",
    "Main Menu": "主菜单",
    "https://discord.gg/yxkVn4wBad": "dom-node:discordlink",
    "Quick Match": "排位赛",
    "Custom Match": "联机大厅",
    "Demo Mode": "单机模式",
    Replays: "回放",
    Mods: "MOD",
    "Info & Credits": "信息与鸣谢",
    Options: "选项与设置",
    "Fullscreen (Alt+F)": "全屏（Alt+F）",
    "Set up a game automatically": "自动、快速地开始游戏",
    "Join a lobby to select an opponent": "加入游戏大厅以自由选择对手",
    "Play a singleplayer match against a training dummy":
        "单人游戏以对抗训练用假对手",
    "Play back a recording of a previously played": "回放先前精彩的对抗过程",
    "Manage and play modified versions of the base game":
        "游玩其他的Mod版本，基于原生红色井界",
    "View additional information and credits": "查看更多的关于游戏的信息，和鸣谢",
    "Adjust game difficulty, audio / visual settings, and controls.":
        "调整游戏音频、视觉、控制设置",
    "Toggle full screen mode": "切换到全屏（进入对战后看到效果）",
    Login: "登录",
    Server: "大区",
    Nickname: "昵称",
    Password: "密码",
    "New Account": "新建账户",
    Back: "返回",
    "Europe (EU1)": "欧洲一区",
    "South-East Asia (HK)": "中国香港一区",
    "South-East Asia (SG)": "新加坡一区",
    OK: "确定",
    "Your password must be 8 letters long.": "你的密码必须等于8个字符",
    "Re-enter Password:": "再次输入密码",
    "Available Games": "活动的对局",
    "The games you can join.": "你可以加入的游戏（如果还有空位的话）",
    "You've been disconnected from the server":
        "你已掉线（网络原因或在大厅里长时间未活动）",
    "Play on another game server or region": "切换到其他大区游玩",
    Observe: "旁观对局",
    "Observe an existing multiplayer game": "旁观一个已存在的多人游戏",
    "Create Game": "创建对局",
    "Creates a new multiplayer game.": "新建一个新的多人游戏",
    "Join Game": "加入对局",
    "Join an existing multiplayer game.": "加入一个已存在的多人游戏",
    "Change server": "切换大区",
    "Room Description": "房间描述",
    Cancel: "取消",
    Players: "玩家",
    Side: "阵营",
    Color: "颜色",
    Start: "出生点",
    Team: "队伍",
    Closed: "关闭",
    "Short Game": "快速游戏",
    "MCV Repacks": "基地可重新部署",
    "Crates Appear": "随机宝箱",
    Superweapons: "超级武器",
    "Host Teams": "房主决定成员队伍",
    "Game Speed": "游戏速度",
    Credits: "初始资金",
    "Unit Count": "初始作战单位",
    "Build Off Ally ConYards": "可在盟友建造场旁建造",
    "Start Game": "开始游戏",
    "Customize Battle": "定制对局",
    "Host Screen": "房主视角",
    Open: "打开",
    Observer: "旁观者",
    "Open Observer": "允许旁观",
    "Game Type": "游戏类型",
    "Select Engagement": "选择作战配置",
    "Game Map": "游戏地图",
    "Use Map": "使用该地图",
    "Custom Map...": "自定义(上传地图)",
    Search: "搜索",
    "Join Screen": "参与者视角",
    Accept: "准备",
    "Skirmish Game": "模拟战斗",
    "Training dummy": "训练用敌人",
    "Select replay:": "选择回放",
    Load: "读取",
    Keep: "保持",
    "Import...": "导入",
    "Export...": "导出",
    Delete: "删除",
    "Patch Notes": "版本更新说明",
    "Report a Bug": "问题与反馈",
    Donate: "捐赠",
    "View Credits": "鸣谢",
    Gameplay: "游玩",
    "Scroll Rate": "滚动速率",
    "Attack/Move Button": "攻击/移动",
    "Right Click Scrolling": "右键按住自由滚动",
    "Show Flyer Helper": "辅助确定飞行单位位置",
    "See Hidden Objects": "隐藏目标有特殊标记",
    "Target Lines": "目标指示线",
    Graphics: "图形",
    Resolution: "分辨率",
    Models: "模型精度",
    "Dynamic Shadows": "动态阴影",
    Sound: "声音",
    Keyboard: "键盘",
    Storage: "存储管理",
    "Resume Mission": "回到作战",
    "Abort Mission": "放弃作战",
    Quit: "退出",
    "Random (???)": "随机 (???)",
    America: "美国",
    Korea: "韩国",
    France: "法国",
    Germany: "德国",
    "Great Britain": "英国",
    Libya: "利比亚",
    Iraq: "伊拉克",
    Cuba: "古巴",
    Russia: "苏俄",
    "Map Name ↓": "地图名称 ↓",
    "Map Name ↑": "地图名称 ↑",
    "Max Slots ↓": "最大玩家数 ↓",
    "Max Slots ↑": "最大玩家数 ↑",
    Paradrop: "空降部队",
    "The USA has the best paratroopers in the world. Build an Airforce Command Center to drop paratroopers anywhere on the battlefield.":
        "美国可以建造空指部获取空降部队支援权限，每隔一段时间后可以在任意地点空投8名美国大兵。该支援可与占领科技机场后的伞兵同时存在！",
    "Black Eagle": "黑鹰战机",
    "The Black Eagles are the most dangerous fighter pilots in the world. Korean forces are always well protected by these deadly air men and their lethal fighter-bombers.":
        "韩国黑鹰战机与入侵者战机价格一样，但其装甲与火力远超入侵者战机。7架飞机可以瞬间摧毁敌方基地！",
    "Grand Cannon": "巨炮",
    "The French Grand Cannon is the ultimate defensive gun, firing at long range for massive damage.":
        "法国巨炮拥有惊人破坏力。可被V3火箭、驱逐舰、火箭飞行兵、天启坦克等单位克制，除此之外几乎是所向披靡。对了，小心被停电和红警魔鬼蓝天。",
    "Tank Destroyer": "坦克杀手",
    "The German Tank Destroyer can easily eliminate enemy vehicles. Its advanced armor-piercing gun is weak against enemy infantry and structures.":
        "德国坦克杀手可以轻松消灭敌方载具，尤其是消灭敌方矿车以摧毁敌方经济来源，但对付步兵和建筑犹如挠痒痒一样几乎伤害为零。受制于炮塔不能旋转，只能在小规模纯坦克作战情况下发挥优异的作用。",
    Sniper: "狙击手",
    "The British Sniper can easily eliminate enemy infantry at great ranges.":
        "英国狙击手可以轻松击杀敌方步兵于超远的距离。如果将其派驻到多功能步兵车，可以帮助步兵车尽快升级。对建筑和载具伤害如挠痒痒一样几乎为0.",
    "Demolition Truck": "自爆卡车",
    "The Libyan Demolition Truck self-destructs on an enemy target, setting off a small nuclear bomb.":
        "利比亚自爆卡车可以在接近敌人时引爆小型核弹，与敌人一起上西天。小心保护，不要让别人在自家引爆！",
    Desolator: "辐射工兵",
    "The Iraqi Desolator can poison land with toxic radiation or annihilate enemy troops with his powerful Rad-Cannon.":
        "伊拉克辐射工兵可以远程瞬间融化敌人步兵和击杀载具。部署后可形成辐射场，批量损毁载具和融化步兵，但这种模式不会为他带来经验。",
    Terrorist: "恐怖分子",
    "The Cuban terrorist is a fanatic for the Soviet cause and will actually carry a bomb right up to the enemy before detonating it, destroying himself and anything nearby.":
        "古巴恐怖分子可以灵活、快速地接近敌人并引爆炸药。当其进入盟军的多功能步兵车，将化身小型自爆卡车！从建筑的不同角度接近自爆伤害大有差异，也可以配合疯狂伊文绑上炸弹进入防空履带车，请尽情探索！",
    "Tesla Tank": "磁能坦克",
    "Russian Tesla Tanks fire a short range Tesla Bolt that can short circuit enemy vehicles and even arc over enemy walls.":
        "苏俄磁能坦克拥有均衡的速度和稍高于普通坦克的攻击，可以越过敌人围墙攻击，升级到精英级别后射出的闪电会分叉。",
    "Not Ready": "取消准备",
    "Not ready": "取消准备",
    "Select Mode": "选择模式",
    Ranked: "排位赛",
    Unranked: "非排位赛",
    "Breaking News": "突发新闻",
    "Preferred Country": "选择阵营",
    "Preferred Color": "选择颜色",
    "Wins :": "胜利 :",
    "Losses :": "失败 :",
    "Disconnects :": "掉线 :",
    "Rank :": "段位 :",
    "Points :": "得分点 :",
    Offline: "离线",
    Play: "开始游戏",
    "View ladder": "查看排行榜",
    "The host wants to start the game. Press the flashing Accept button.":
        "房主准备开始游戏，请点击右侧菜单 准备 按钮！",
    "Master Volume": "主音量",
    "Music Volume": "音乐音量",
    "Voice Volume": "语音音量",
    "SFX Volume": "音效音量",
    "Ambient Volume": "环境音量",
    "UI Volume": "UI音量",
    "Credits Volume": "货币音量",
    "Multiplayer Score": "多人游戏得分",
    Player: "玩家",
    Kills: "击杀",
    Losses: "损失",
    Built: "建造",
    Score: "得分",
    Continue: "下一步",
};

ra2webInjection.transDOMMap = {
    "dom-node:discordlink": `<p style="color: red;font-weight: bold;">如果您没微信，可以使用亲戚朋友的关注，感谢您的理解和支持~</p>`,
    "dom-node:快速匹配": `排位赛`,
};

/**
 * 敏感词过滤功能
 */
ra2webInjection.sensitiveWords = [
    "习",
    "产党", 
    "丽媛",
    "中共",
    "共产",
    "支那",
    "法轮"
];

// 检查文本是否包含敏感词
ra2webInjection.containsSensitiveWord = function(text) {
    if (!text) return false;
    text = text.toLowerCase();
    return this.sensitiveWords.some(word => text.includes(word));
};

// 过滤DOM中的敏感内容
ra2webInjection.filterSensitiveContent = function(node) {
    // 如果不是元素节点，直接返回
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    
    // 检查是否是目标元素（class为"list-item game"的div）
    if (node.tagName === 'DIV' && node.classList.contains('list-item') && node.classList.contains('game')) {
        // 获取元素的文本内容
        const textContent = node.textContent || '';
        
        // 检查是否包含敏感词
        if (this.containsSensitiveWord(textContent)) {
            // 如果包含敏感词，则隐藏整个元素
            node.style.display = 'none';
            console.log('已过滤含有敏感内容的游戏项');
            return; // 已处理此节点，无需继续检查子节点
        }
    }
    
    // 递归处理所有子节点
    for (const child of node.childNodes) {
        this.filterSensitiveContent(child);
    }
};

ra2webInjection.isNodeTransDom = (value = "") => {
    const valueType = value.split(":")[0] || "normal";
    if (valueType === "dom-node") {
        return true;
    } else {
        return false;
    }
};

ra2webInjection.containsOnlyTextOrIsEmpty = (element) => {
    // 获取所有子节点
    const childNodes = element.childNodes;

    // 如果没有子节点，那么元素是空的
    if (childNodes.length === 0) {
        return true;
    }

    // 检查所有子节点
    for (let i = 0; i < childNodes.length; i++) {
        // 如果有一个子节点是元素节点，那么返回false
        if (childNodes[i].nodeType === Node.ELEMENT_NODE) {
            return false;
        }
    }

    // 如果所有子节点都是文本节点，那么返回true
    return true;
};

ra2webInjection.isStringOnlyWhitespace = (str) => {
    return /^\s*$/.test(str);
};

ra2webInjection.translateDOM = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const textContent = node.textContent;
        const textValue = ra2webInjection.translationMap[textContent];
        if (textValue) {
            if (ra2webInjection.isNodeTransDom(textValue)) {
                const tempTransDom = ra2webInjection.transDOMMap[textValue];
                node.innerHTML = tempTransDom || `<div></div>`;
            } else {
                if (ra2webInjection.containsOnlyTextOrIsEmpty(node)) {
                    node.textContent = textValue;
                }
            }
        }

        for (const child of node.childNodes) {
            ra2webInjection.translateDOM(child);
        }
    }
};

// 事件处理，挂载对JS的处理
document.addEventListener("DOMContentLoaded", (event) => {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                ra2webInjection.translateDOM(mutation.target);
                ra2webInjection.filterSensitiveContent(mutation.target);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 初始处理当前DOM
    ra2webInjection.filterSensitiveContent(document.body);
});

/**
 *  处理CSS增加，主要是摇杆和面板逻辑
 */
let css = `
    #joystick-container {
        position: absolute;
        left: 30px;
        bottom: 30px;
        width: 210px;
        height: 210px;
        pointer-events: auto;
    }
    
    .static-bottom {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: rgba(255, 0, 0, 0.3);
        transform-origin: top left;
        color: yellow;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    
    .static-bottom .bottom-inner-text {
        display: inline-block;
    }
    
    .joystick-message {
        user-select: none;
        display: none;
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.5);
        color: yellow;
        font-weight: bold;
        padding: 10px;
        z-index: 1000;
    }

    .tips-message {
        user-select: none;
        display: none;
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.5);
        color: yellow;
        font-weight: bold;
        padding: 10px;
        font-size: 28px;
        z-index: 1000;
    }
    
    #ra2web-func-button-container {
        user-select: none;
        position: absolute;
        left: 80px;
        top: 100px;
        display: grid;
        grid-template-columns: repeat(2, 1fr); /* 将按钮容器分为两列 */
        grid-gap: 10px; /* 列之间的间隔 */
    }
    #ra2web-func-button-container .button {
        width: 70px;
        height: 70px;
        background-color: rgba(255, 0, 0, 0.3);
        color: yellow;
        text-align: center;
        line-height: 65px;
        margin-bottom: 10px;
        user-select: none;
        position: relative;
        font-size: 28px;
        border-radius: 50%;
    }
    
    #ra2web-func-button-container .button::before {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    
    .right-position {
        transform: translateX(120px);
    }
    
    #ra2web-func-navbar {
        user-select: none;
        position: absolute;
        left: 80px;
        top: 50px;
        width: 380px;
        height: 30px;
        display: none;
        justify-content: space-between;
    }
    
    #ra2web-func-navbar .func-navbar-button {
        user-select: none;
        color: yellow;
        font-weight: bold;
        background-color: rgba(39,90,153,0.5);
    }

    #ctrl-shift-alt-container {
        width: 60px;
        height: 220px;
        position: absolute;
        bottom: 50px;
        left: 200px;
    }

    #ctrl-shift-alt-container .button::before, #ctrl-shift-alt-container .press-button::before {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    #ctrl-shift-alt-container .button {
        width: 50px;
        height: 50px;
        background-color: rgba(255, 0, 0, 0.3);
        color: yellow;
        text-align: center;
        line-height: 50px;
        margin-bottom: 6px;
        user-select: none;
        position: relative;
        font-size: 20px;
        border-radius: 50%;
    }

    #ctrl-shift-alt-container .press-button {
        width: 50px;
        height: 50px;
        background-color: rgba(255, 0, 0, 0.3);
        color: red;
        text-align: center;
        line-height: 50px;
        margin-bottom: 6px;
        user-select: none;
        position: relative;
        font-size: 20px;
        border-radius: 50%;
    }
    `;

let style = document.createElement("style");
style.type = "text/css";
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);

/**
 *  处理工具面板相关增加逻辑
 */
var O9p,
    k6p = /iPhone/i,
    e9e = /iPod/i,
    t9e = /iPad/i,
    n9e = /\biOS-universal(?:.+)Mac\b/i,
    a9e = /Silk/i,
    l9e = /Windows Phone/i,
    q9r = /\bWindows(?:.+)ARM\b/i,
    u9e = /BlackBerry/i,
    c9e = /BB10/i,
    m9w = /Opera Mini/i,
    h9e = /\b(CriOS|Chrome)(?:.+)Mobile/i,
    r9e = /\bAndroid(?:.+)Mobile\b/i,
    i9e = /Android/i,
    o9e = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i,
    p9e = /Mobile(?:.+)Firefox\b/i,
    y9n = function (e) {
        return (
            void 0 !== e &&
            "MacIntel" === e.platform &&
            "number" == typeof e.maxTouchPoints &&
            e.maxTouchPoints > 1 &&
            "undefined" == typeof MSStream
        );
    };
// function preventExternalTouch(e) {
//     e.touches.length > 1 && (e.preventDefault(), e.stopPropagation());
// }
// function preventDefaultForMultiTouch(e) {
//     e.touches.length > 1 && e.preventDefault();
// }

function preventExternalTouch(e) {
    e.stopPropagation();
}
function preventDefaultForMultiTouch(e) {
    e.touches.length > 1 && e.preventDefault();
}

function createCustomLetterButtonEvents(e) {
    const t = {
        key: e,
        code: `Key${e.toUpperCase()}`,
        keyCode: e.toUpperCase().charCodeAt(0),
    },
        i = new KeyboardEvent("keydown", t),
        r = new KeyboardEvent("keyup", t);
    return [
        new CustomEvent(Ra2webGameKeyboardDownEvent, {
            detail: { keyboardEvent: i },
        }),
        new CustomEvent(Ra2webGameKeyboardUpEvent, {
            detail: { keyboardEvent: r },
        }),
    ];
}
function CheckNavgator(e) {
    var t = { userAgent: "", platform: "", maxTouchPoints: 0 };
    e || "undefined" == typeof navigator
        ? "string" == typeof e
            ? (t.userAgent = e)
            : e &&
            e.userAgent &&
            (t = {
                userAgent: e.userAgent,
                platform: e.platform,
                maxTouchPoints: e.maxTouchPoints || 0,
            })
        : (t = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            maxTouchPoints: navigator.maxTouchPoints || 0,
        });
    var i = t.userAgent,
        r = i.split("[FBAN");
    void 0 !== r[1] && (i = r[0]),
        void 0 !== (r = i.split("Twitter"))[1] && (i = r[0]);
    var s = (function (e) {
        return function (t) {
            return t.test(e);
        };
    })(i),
        n = {
            apple: {
                phone: s(k6p) && !s(l9e),
                ipod: s(e9e),
                tablet: !s(k6p) && (s(t9e) || y9n(t)) && !s(l9e),
                universal: s(n9e),
                device: (s(k6p) || s(e9e) || s(t9e) || s(n9e) || y9n(t)) && !s(l9e),
            },
            amazon: {
                phone: s(o9e),
                tablet: !s(o9e) && s(a9e),
                device: s(o9e) || s(a9e),
            },
            android: {
                phone: (!s(l9e) && s(o9e)) || (!s(l9e) && s(r9e)),
                tablet: !s(l9e) && !s(o9e) && !s(r9e) && (s(a9e) || s(i9e)),
                device:
                    (!s(l9e) && (s(o9e) || s(a9e) || s(r9e) || s(i9e))) ||
                    s(/\bokhttp\b/i),
            },
            windows: { phone: s(l9e), tablet: s(q9r), device: s(l9e) || s(q9r) },
            other: {
                blackberry: s(u9e),
                blackberry10: s(c9e),
                opera: s(m9w),
                firefox: s(p9e),
                chrome: s(h9e),
                device: s(u9e) || s(c9e) || s(m9w) || s(p9e) || s(h9e),
            },
            any: !1,
            phone: !1,
            tablet: !1,
        };
    return (
        (n.any =
            n.apple.device || n.android.device || n.windows.device || n.other.device),
        (n.phone = n.apple.phone || n.android.phone || n.windows.phone),
        (n.tablet = n.apple.tablet || n.android.tablet || n.windows.tablet),
        n
    );
}

var Ra2webGameKeyboardDownEvent = "ra2webGameKeyboardDownEvent",
    Ra2webGameKeyboardUpEvent = "ra2webGameKeyboardUpEvent";

var [customHDownEvent, customHUpEvent] = createCustomLetterButtonEvents("h"),
    [customXDownEvent, customXUpEvent] = createCustomLetterButtonEvents("x"),
    [customYDownEvent, customYUpEvent] = createCustomLetterButtonEvents("y"),
    [customPDownEvent, customPUpEvent] = createCustomLetterButtonEvents("p"),
    [customCDownEvent, customCUpEvent] = createCustomLetterButtonEvents("c"),
    [customTDownEvent, customTUpEvent] = createCustomLetterButtonEvents("t"),
    [customDDownEvent, customDUpEvent] = createCustomLetterButtonEvents("d"),
    [customMDownEvent, customMUpEvent] = createCustomLetterButtonEvents("m"),
    [customNDownEvent, customNUpEvent] = createCustomLetterButtonEvents("n"),
    [customSDownEvent, customSUpEvent] = createCustomLetterButtonEvents("s"),
    [customGDownEvent, customGUpEvent] = createCustomLetterButtonEvents("g"),
    keySpace = { key: " ", code: "Space", keyCode: 32 },
    keyboardSpaceUpEvent = new KeyboardEvent("keyup", keySpace),
    keyboardSpaceDownEvent = new KeyboardEvent("keydown", keySpace),
    customSpaceDownEvent = new CustomEvent(Ra2webGameKeyboardDownEvent, {
        detail: { keyboardEvent: keyboardSpaceDownEvent },
    }),
    customSpaceUpEvent = new CustomEvent(Ra2webGameKeyboardUpEvent, {
        detail: { keyboardEvent: keyboardSpaceUpEvent },
    });

function createButtons() {
    const e = toolContainer;
    [
        { text: "空格", des: "事", handleClick: handleButtonClick },
        { text: "H", des: "家", handleClick: handleButtonClick },
        { text: "P", des: "斗", handleClick: handleButtonClick },
        { text: "X", des: "散", handleClick: handleButtonClick },
        { text: "T", des: "同", handleClick: handleButtonClick },
        { text: "D", des: "署", handleClick: handleButtonClick },
        { text: "N", des: "找", handleClick: handleButtonClick },
        { text: "S", des: "停", handleClick: handleButtonClick },
    ].forEach((t) => {
        const i = document.createElement("div");
        i.classList.add("button"),
            (i.dataset.text = t.des),
            i.addEventListener("click", t.handleClick),
            e.appendChild(i);
    });
}

function createKeyButtons() {
    const c = ctrlShiftAltContainer;
    const oo = document.createElement("div");
    oo.classList.add("button"),
        (oo.dataset.text = "松"),
        oo.addEventListener("click", handleButtonClick),
        c.appendChild(oo);
    const aa = document.createElement("div");
    aa.classList.add(ctrlIsPress ? "press-button" : "button"),
        (aa.dataset.text = "Ctrl"),
        aa.addEventListener("click", handleButtonClick),
        c.appendChild(aa);
    const bb = document.createElement("div");
    bb.classList.add(shiftIsPress ? "press-button" : "button"),
        (bb.dataset.text = "Shift"),
        bb.addEventListener("click", handleButtonClick),
        c.appendChild(bb);
    const cc = document.createElement("div");
    cc.classList.add(altIsPress ? "press-button" : "button"),
        (cc.dataset.text = "Alt"),
        cc.addEventListener("click", handleButtonClick),
        c.appendChild(cc);
}

function destroyButtons() {
    toolContainer.innerHTML = "";
}

function destroyKeyButtons() {
    ctrlShiftAltContainer.innerHTML = "";
}

function handleButtonClick() {
    const e = this.dataset.text;
    switch ((console.log("点击了按钮:", e), e)) {
        case "家":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('CenterBase');
            break;
        case "事":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('CenterOnRadarEvent');
            break;
        case "斗":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('CombatantSelect');
            break;
        case "级":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('VeterancyNav');
            break;
        case "散":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('ScatterObject');
            break;
        case "署":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('DeployObject');
            break;
        case "同":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('TypeSelect');
            break;
        case "找":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('PreviousObject');
            break;
        case "停":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('StopObject');
            break;
        case "戒":
            window.ra2webInjection.CdApi.battleControl.executeKeyCommand('GuardObject');
            break;
        case "松":
            ctrlIsPress = false;
            altIsPress = false;
            shiftIsPress = false;
            console.log("松开状态")
            window.ra2webInjection.CdApi.battleControl.applyKeyModifiers({
                ctrlKey: ctrlIsPress,
                shiftKey: shiftIsPress,
                altKey: altIsPress,
            });
            ra2webGlobalToolFunc.destroyKeyButtons();
            ra2webGlobalToolFunc.createKeyButtons();
            break;
        case "Ctrl":
            ctrlIsPress = !ctrlIsPress;
            console.log("ctrl状态", ctrlIsPress)
            window.ra2webInjection.CdApi.battleControl.applyKeyModifiers({
                ctrlKey: ctrlIsPress,
                shiftKey: shiftIsPress,
                altKey: altIsPress,
            });
            ra2webGlobalToolFunc.destroyKeyButtons();
            ra2webGlobalToolFunc.createKeyButtons();
            break;
        case "Shift":
            shiftIsPress = !shiftIsPress;
            console.log("shift状态", shiftIsPress)
            window.ra2webInjection.CdApi.battleControl.applyKeyModifiers({
                ctrlKey: ctrlIsPress,
                shiftKey: shiftIsPress,
                altKey: altIsPress,
            });
            ra2webGlobalToolFunc.destroyKeyButtons();
            ra2webGlobalToolFunc.createKeyButtons();
            break;
        case "Alt":
            altIsPress = !altIsPress;
            console.log("alt状态", altIsPress)
            window.ra2webInjection.CdApi.battleControl.applyKeyModifiers({
                ctrlKey: ctrlIsPress,
                shiftKey: shiftIsPress,
                altKey: altIsPress,
            });
            ra2webGlobalToolFunc.destroyKeyButtons();
            ra2webGlobalToolFunc.createKeyButtons();
            break;
    }
}

function switchJoyStatus() {
    joyOpen = !joyOpen;
    if (joyOpen) {
        joySwitchButton.innerText = "关闭摇杆";
    } else {
        joySwitchButton.innerText = "打开摇杆";
    }
    ra2webGlobalToolFunc.initRA2WEBJoyAndTools(true);
}

function switchToolbarStatus() {
    toolOpen = !toolOpen;
    if (toolOpen) {
        toolSwitchButton.innerText = "关闭快捷区";
    } else {
        toolSwitchButton.innerText = "打开快捷区";
    }
    ra2webGlobalToolFunc.initRA2WEBJoyAndTools(true);
}

function switchKeyBarStatus() {
    funcKeyOpen = !funcKeyOpen;
    if (funcKeyOpen) {
        keyBarSwitchButton.innerText = "关闭特别键";
    } else {
        keyBarSwitchButton.innerText = "打开特别键";
    }
    ra2webGlobalToolFunc.initRA2WEBJoyAndTools(true);
}

function switchLocation() {
    toolBoxPositionToRight = !toolBoxPositionToRight;
    if (toolBoxPositionToRight) {
        locationSwitchButton.innerText = "整体左移";
        joystickContainer.classList.add("right-position");
        toolContainer.classList.add("right-position");
        ctrlShiftAltContainer.classList.add("right-position");
    } else {
        locationSwitchButton.innerText = "整体右移";
        joystickContainer.classList.remove("right-position");
        toolContainer.classList.remove("right-position");
        ctrlShiftAltContainer.classList.remove("right-position");
    }
    ra2webGlobalToolFunc.initRA2WEBJoyAndTools(true);
}

function switchTips(status = undefined) {
    if (typeof status === "boolean") {
        tipsShow = status;
    } else {
        tipsShow = !tipsShow;
    }
    if (tipsShow) {
        tipsSwitchButton.innerText = "关闭提示";
        tipsElement.style.display = "block";
    } else {
        tipsSwitchButton.innerText = "打开提示";
        tipsElement.style.display = "none";
    }
}

var ra2webGlobalToolFunc = {
    createKeyButtons: createKeyButtons,
    createButtons: createButtons,
    destroyButtons: destroyButtons,
    destroyKeyButtons: destroyKeyButtons,
    switchJoyStatus: switchJoyStatus,
    switchToolbarStatus: switchToolbarStatus,
    switchLocation: switchLocation,
    switchKeyBarStatus: switchKeyBarStatus,
    switchTips: switchTips,
    initRA2WEBJoyAndTools: initRA2WEBJoyAndTools,
    destroyRA2WEBJoyAndTools: destroyRA2WEBJoyAndTools,
};
var toolBoxPositionToRight = false;
var joyOpen = true;
var toolOpen = true;
var funcKeyOpen = true;
var ctrlShiftAltContainer;
var toolContainer;
var toolBoxInTouch = false;
var joystickInTouch = false;
var tipsShow = false;
var joystickContainer;
var messageElement;
var toolNavbarContainer;
var joySwitchButton;
var toolSwitchButton;
var locationSwitchButton;
var tipsSwitchButton;
var tipsElement;
var keyBarSwitchButton;

var shiftIsPress = false;
var altIsPress = false;
var ctrlIsPress = false;

window.addEventListener("DOMContentLoaded", function () {
    // 这部分逻辑会在RA2WEB-ROOT DOM结构加载后立即执行，仅负责事件注册即可
    const rootElement = document.getElementById("ra2web-root");
    if (rootElement) {
        rootElement.insertAdjacentHTML(
            "afterend",
            `
                <div id="joystick-message" class="joystick-message">快捷栏或摇杆操作中，禁止其他操作</div>
                <div id="tips-message" class="tips-message">移动端操作提示：<br />双指点按作战区域是取消选择<br />双指拖动作战区域或者左下角红色摇杆是滑动地图<br />左侧红色底圆形按钮是快捷键<br />长按作战区域是强制攻击<br />长按或者双指点按生产栏目是暂停或者取消生产<br />其他单指操作等于鼠标左键</div>
                <div id="ra2web-func-navbar">
                <div id="location-switch" class="func-navbar-button">整体右移</div>
                <div id="joy-switch" class="func-navbar-button">关闭摇杆</div>
                <div id="tool-switch" class="func-navbar-button">关闭快捷栏</div>
                <div id="key-bar-switch" class="func-navbar-button">关闭特别键</div>
                <div id="tips-switch" class="func-navbar-button">打开提示</div>
                </div>
                <div id="ra2web-func-button-container"></div>
                <div id="joystick-container" style="width: 20px;height: 30px;"></div>
                <div id="ctrl-shift-alt-container"></div>
            `
        );
    }

    toolContainer = document.getElementById("ra2web-func-button-container");
    (toolBoxInTouch = !1),
        (joystickInTouch = !1),
        (joystickContainer = document.getElementById("joystick-container")),
        (ctrlShiftAltContainer = document.getElementById("ctrl-shift-alt-container")),
        (messageElement = document.getElementById("joystick-message")),
        (tipsElement = document.getElementById("tips-message"));
    toolContainer.addEventListener("touchstart", () => {
        ((toolBoxInTouch = !0) || joystickInTouch) &&
            (messageElement.style.display = "block");
    }),
        toolContainer.addEventListener("touchend", () => {
            (toolBoxInTouch = !1) ||
                joystickInTouch ||
                (messageElement.style.display = "none");
        });
    // joystickContainer.addEventListener("touchstart", preventExternalTouch, !1);
    // joystickContainer.addEventListener("touchmove", preventExternalTouch, !1);
    // joystickContainer.addEventListener("touchend", preventExternalTouch, !1);
    joystickContainer.addEventListener("touchstart", preventExternalTouch);
    joystickContainer.addEventListener("touchmove", preventExternalTouch);
    joystickContainer.addEventListener("touchend", preventExternalTouch);
    toolNavbarContainer = document.getElementById("ra2web-func-navbar");
    joySwitchButton = document.getElementById("joy-switch");
    joySwitchButton.addEventListener(
        "click",
        ra2webGlobalToolFunc.switchJoyStatus
    ),
        (toolSwitchButton = document.getElementById("tool-switch"));
    toolSwitchButton.addEventListener(
        "click",
        ra2webGlobalToolFunc.switchToolbarStatus
    ),
        (locationSwitchButton = document.getElementById("location-switch"));
    locationSwitchButton.addEventListener(
        "click",
        ra2webGlobalToolFunc.switchLocation
    );
    (keyBarSwitchButton = document.getElementById("key-bar-switch"));
    keyBarSwitchButton.addEventListener(
        "click",
        ra2webGlobalToolFunc.switchKeyBarStatus
    );
    (tipsSwitchButton = document.getElementById("tips-switch"));
    tipsSwitchButton.addEventListener(
        "click",
        ra2webGlobalToolFunc.switchTips
    );

    const jihuAdLoad = function () {
        // 创建样式
        const style = document.createElement('style');
        style.innerHTML = `
                @keyframes blink {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0;
                    }
                }
                #jihu-ad-link {
                    display: block;
                    width: 300px;
                    height: 160px;
                    padding: 0;
                    margin: 0;
                    position: fixed;
                    left: 0;
                    top: 0;
                    background-color: rgba(0, 0, 0, 0.4);
                    cursor: pointer;
                    color: yellow;
                    font-size: 32px;
                    text-decoration: none;
                    animation: blink 0.2s linear infinite;
                }
            `;
        document.head.appendChild(style);

        // 创建并插入链接元素
        const link = document.createElement('a');
        link.id = 'jihu-ad-link';
        link.href = 'https://jihujiasuqi.com/';
        link.target = '_blank';
        link.innerHTML = '感谢【极狐】赞助<br />网页红井CDN资源<br />使加载速度极大提升';
        document.body.appendChild(link);

        let w = document.documentElement.clientWidth;
        let h = document.documentElement.clientHeight;
        let gox = 1; //控制是否反向
        let goy = 1;
        let speed = 1; // Adjust the speed here
        let animationFrameId; // Used to store the requestAnimationFrame id

        function move() {
            let x = link.offsetLeft;
            let y = link.offsetTop;
            if (x > w - 200 || x < 0) gox = -gox;
            link.style.left = x + speed * gox + "px";
            if (y > h - 100 || y < 0) goy = -goy;
            link.style.top = y + speed * goy + "px";
            animationFrameId = requestAnimationFrame(move);
        }

        link.onmouseenter = function () {
            cancelAnimationFrame(animationFrameId); // Stop the animation
        };

        link.onmouseleave = function () {
            move(); // Resume animation loop
        };

        // 检查是否存在具有 "archive-formats" 类的元素
        function checkForArchiveFormats() {
            const archiveFormatsElement = document.querySelector('.archive-formats');
            if (archiveFormatsElement) {
                link.style.display = 'block';
                move(); // Start the animation loop
            } else {
                link.style.display = 'none';
                cancelAnimationFrame(animationFrameId); // Stop the animation
            }
        }

        // 使用 MutationObserver 监视 DOM 变化
        const observer = new MutationObserver(checkForArchiveFormats);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        checkForArchiveFormats(); // Initial check
    };
    //jihuAdLoad();
})

function initRA2WEBJoyAndTools(skipChangeNavbar = false) {
    //只有移动端情况下才开启！
    if (CheckNavgator(window.navigator).any) {
        toolNavbarContainer.style.display = "flex";
        // 先销毁一遍
        ra2webGlobalToolFunc.destroyRA2WEBJoyAndTools(skipChangeNavbar);
        // 再进行初始化
        if (toolOpen) {
            ra2webGlobalToolFunc.createButtons();
        }
        if (funcKeyOpen) {
            ra2webGlobalToolFunc.createKeyButtons();
        }
        if (joyOpen) {
            ra2webInjection.joy = nipplejs.create({
                mode: "static",
                position: { left: "100px", bottom: "125px" },
                color: "red",
                zone: document.getElementById("joystick-container"),
            });
            ra2webInjection.joy.on("start move end", function (t, i) {
                let a = (i?.position?.x || 0) - (i?.instance?.position?.x || 0),
                    o = (i?.position?.y || 0) - (i?.instance?.position?.y || 0),
                    l = 0,
                    c = 0;
                switch (
                (i?.instance?.options?.size &&
                    ((l = a / (i.instance.options.size / 2)),
                        (c = o / (i.instance.options.size / 2))),
                    t.type)
                ) {
                    case "start":
                        (joystickInTouch = !0), (messageElement.style.display = "block");
                        window.ra2webInjection.CdApi.battleControl.requestPan(1.3 * l, 1.3 * c);
                        break;
                    case "move":
                        (messageElement.style.display = "block"), (joystickInTouch = !0);
                        window.ra2webInjection.CdApi.battleControl.requestPan(1.3 * l, 1.3 * c);
                        break;
                    case "end":
                        (messageElement.style.display = "none"), (joystickInTouch = !1);
                        window.ra2webInjection.CdApi.battleControl.cancelPan();
                        break;
                }
            });
        }
    }
}

function destroyRA2WEBJoyAndTools(skipChangeNavbar = false) {
    if (!skipChangeNavbar) {
        toolNavbarContainer.style.display = "none";
    }
    console.log("执行销毁工具区域任务", toolContainer, ra2webInjection);
    ra2webGlobalToolFunc.destroyButtons();
    ra2webInjection?.joy?.destroy();
    ra2webGlobalToolFunc.destroyKeyButtons();
    console.log("结束销毁工具区域任务", toolContainer, ra2webInjection);
}

// 对接新版cdapi
(async () => {
    // 等待 CdApiReady 事件并获取 CdApi 实例
    window.ra2webInjection.CdApi = window.CdApi || await new Promise(resolve => {
        window.addEventListener("CdApiReady", ev => resolve(ev.detail));
    });

    // 使用 battleControl API
    window.ra2webInjection.CdApi.battleControl.onToggle(enabled => {
        if (enabled) {
            // 设置摇杆监听器
            console.log("Joystick enabled");
            // 在这里添加你的设置摇杆监听器的逻辑
            ra2webGlobalToolFunc.initRA2WEBJoyAndTools(true);
        } else {
            // 关闭提示
            ra2webGlobalToolFunc.switchTips(false)
            // 移除摇杆监听器
            console.log("Joystick disabled");
            // 在这里添加你的移除摇杆监听器的逻辑
            ra2webGlobalToolFunc.destroyRA2WEBJoyAndTools();
        }
    });
})();



// 请求CSS文件
fetch("/style.css?v=0.77.0")
    .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.text();
    })
    .then((cssCode) => {
        // 创建一个<style>元素，将CSS代码插入其中
        const styleElement = document.createElement("style");
        styleElement.textContent = cssCode;

        // 将<style>元素添加到<head>中
        document.head.appendChild(styleElement);
    })
    .catch((error) => {
        console.error("Error fetching CSS:", error);
    });

const monitorTargetSite = "wyhjres2.bun.sh.cn"
function sendPostRequest(url) {
    return fetch(url).catch(error => console.error('Error in sending monitor data, please 微信关注公众号 思牛逼 反馈问题！:', error));
}

fetch(`//${monitorTargetSite}/manifest.json`)
    .then(response => {
        return sendPostRequest(`//monitor-agent.ra2web.cn/api/can-access-site/${monitorTargetSite}/monitor-log-metrics?a=114514`);
    })
    .catch(error => {
        return sendPostRequest(`//monitor-agent.ra2web.cn/api/can-access-site/${monitorTargetSite}/monitor-log-metrics?a=1919810`);
    });
