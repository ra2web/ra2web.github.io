let translationMap = {
    "https://xwis.net/dl/Red-Alert-2-Multiplayer.exe": "dom-node:discordlink",
    "Ladder Season 2 is live. Play a \"Quick Match\" and get your rank badge now!": "这里是自定义房间大厅，你也可以从主菜单的‘快速匹配’选项来开启排位赛征程并获得徽章！现在天梯第二赛季已经开赛，尽情挑战吧！游玩人机请返回主菜单并选择 单机模式",
    "Having trouble with a command? Type /help to learn more about it.":"不了解聊天指令如何操作？输入/help并回车获取更多关于聊天指令的介绍。",
    "Ladder Season 2 is live. Play a \"Quick Match\" and get your rank badge now! ": "这里是自定义房间大厅，你也可以从主菜单的‘快速匹配’选项来开启排位赛征程并获得徽章！现在天梯第二赛季已经开赛，尽情挑战吧！游玩人机请返回主菜单并选择 单机模式",
    "Join us on Discord: https://discord.gg/uavJ34JTWY": "网页红井问题反馈，请微信关注公众号 思牛逼 获取",
    "您加入了美國指揮中心頻道":"您已返回房间大厅。问题反馈、游戏交流，欢迎微信关注公众号 思牛逼",
    "您已經與伺服器斷線了":"您已经与服务器断开连接，微信关注公众号 思牛逼 获取解决方案",
    "自訂戰役":"定制对局",
    "基地重新部署":"基地可重新部署",
    "升級工具箱": "随机宝箱",
    "部隊數": "初始作战单位",
    "資金":"初始资金",
    "遭遇戰模式": "单机模式",
    "於盟友建造場旁建設": "可在盟友建造场旁建造",
    "起始位置": "出生点",
    "播放": "启动",
    "您的密碼必須為八個字元長。": "你的密码必须为8个字符",
    "新帳號": "注册",
    "綽號": "账号",
    "快速配對競賽": "排位赛",
    "自訂競賽": "自定义房间",
    "巨砲": "巨炮",
    "法國的巨砲是究極防守武器，能發射長程破壞力驚人的砲彈。":"法国巨炮拥有惊人破坏力。可被V3火箭、驱逐舰、火箭飞行兵、天启坦克等单位克制，除此之外几乎是所向披靡。对了，小心被停电和红警魔鬼蓝天。",
    "傘兵": "空降部队",
    "美國擁有世上最佳的傘兵。興建一座空指部，空降傘兵到戰場的各個角落。": "美国可以建造空指部获取空降部队支援权限，每隔一段时间后可以在任意地点空投8名美国大兵。该支援可与占领科技机场后的伞兵同时存在！",
    "黑鷹戰機": "黑鹰战机",
    "黑鷹戰機是世界上最具威脅性的戰機之一。韓國軍隊一向受到這些戰技高超的戰機飛行員，和威力強大的戰轟機保護。": "韩国黑鹰战机与入侵者战机价格一样，但其装甲与火力远超入侵者战机。7架飞机可以瞬间摧毁敌方基地！",
    "坦克殺手": "坦克杀手",
    "德國坦克殺手能輕易消滅敵方車輛，但先進的穿甲砲對付敵方步兵或建築物則威力欠佳。": "德国坦克杀手可以轻松消灭敌方载具，尤其是消灭敌方矿车以摧毁敌方经济来源，但对付步兵和建筑犹如挠痒痒一样几乎伤害为零。受制于炮塔不能旋转，只能在小规模纯坦克作战情况下发挥优异的作用。",
    "狙擊手": "狙击手",
    "英國狙擊手能輕易在遠距離宰殺敵方步兵。": "英国狙击手可以轻松击杀敌方步兵于超远的距离。如果将其派驻到多功能步兵车，可以帮助步兵车尽快升级。对建筑和载具伤害如挠痒痒一样几乎为0.",
    "自爆卡車": "自爆卡车",
    "利比亞自爆卡車能摧毀敵方目標，引爆小型核彈。": "利比亚自爆卡车可以在接近敌人时引爆小型核弹，与敌人一起上西天。小心保护，不要让别人在自家引爆！",
    "輻射工兵": "辐射工兵",
    "伊拉克輻射工兵能用輻射砲射出的有毒輻射污染土地，以及毀滅敵方部隊。": "伊拉克辐射工兵可以远程瞬间融化敌人步兵和击杀载具。部署后可形成辐射场，批量损毁载具和融化步兵，但这种模式不会为他带来经验。",
    "恐怖份子": "恐怖分子",
    "古巴恐怖份子為蘇維埃犧牲性命在所不惜，會在身上綁上炸彈，直接衝入敵陣，再加以引爆，炸死自己和所有靠近的敵人。": "古巴恐怖分子可以灵活、快速地接近敌人并引爆炸药。当其进入盟军的多功能步兵车，将化身小型自爆卡车！从建筑的不同角度接近自爆伤害大有差异，也可以配合疯狂伊文绑上炸弹进入防空履带车，请尽情探索！",
    "俄國磁能坦克能發射出短距磁能彈，讓敵方車輛短路，甚至能以弧形穿越敵方圍牆。": "苏俄磁能坦克拥有均衡的速度和稍高于普通坦克的攻击，可以越过敌人围墙攻击，升级到精英级别后射出的闪电会分叉。",
    "OR": "或",
    "Prefetching assets...": "提前拉取资源中",
    "Connecting...": "连接中...",
    "Downloading...": "下载中...",
    "Loading...": "加载中...",
    "The download failed, please check your connection and try again later.": "下载失败，请检查你的网络连接并刷新重试。",
    "Locate original game assets": "定位游戏源文件（这将让你最快开始体验）",
    "If you have a copy of RA2 already installed, you can import it below. You can also download a free multiplayer-only RA2 archive from XWIS.net (official server) here:": "如果您已安装 RA2(红色警戒2) 副本，您可直接导入。您还可以从 XWIS.net（官方服务器）下载一个免费的仅限多人游戏的 RA2 存档，请用下载工具复制下面的链接下载：",
    "HINT: Use Right-click -> \"Save link as...\", then drop the downloaded file in the box below:Download size: ~200 MiB": "提示：右键点击链接->链接另存为，下载完毕后把东西拖入这个窗口。下载大小大约200MB",
    "Select folder...": "选择文件夹",
    "Select archive...": "选择归档包",
    "Supported archive formats: rar, tar, tar.gz, tar.bz2, tar.xz, zip, 7z, exe (sfx)": "支持的归档类型：rar, tar, tar.gz, tar.bz2, tar.xz, zip, 7z, exe (sfx)",
    "Drop the required game files hereOR": "将上面两类东西拖动到此，或者",
    "Main Menu": "主菜单",
    "https://discord.gg/yxkVn4wBad": "dom-node:discordlink",
    "Quick Match": "排位赛",
    "Custom Match": "自定义房间",
    "Demo Mode": "单机模式",
    "Replays": "回放",
    "Mods": "MOD",
    "Info & Credits": "信息与鸣谢",
    "Options": "选项与设置",
    "Fullscreen (Alt+F)": "全屏（Alt+F）",
    "Set up a game automatically": "自动、快速地开始游戏",
    "Join a lobby to select an opponent": "加入游戏大厅以自由选择对手",
    "Play a singleplayer match against a training dummy": "单人游戏以对抗训练用假对手",
    "Play back a recording of a previously played": "回放先前精彩的对抗过程",
    "Manage and play modified versions of the base game": "游玩其他的Mod版本，基于原生红色井界",
    "View additional information and credits": "查看更多的关于游戏的信息，和鸣谢",
    "Adjust game difficulty, audio / visual settings, and controls.": "调整游戏音频、视觉、控制设置",
    "Toggle full screen mode": "切换到全屏（进入对战后看到效果）",
    "Login": "登录",
    "Server": "大区",
    "Nickname": "昵称",
    "Password": "密码",
    "New Account": "新建账户",
    "Back": "返回",
    "Europe (EU1)": "欧洲一区",
    "South-East Asia (HK)": "中国香港一区",
    "South-East Asia (SG)": "新加坡一区",
    "OK": "确定",
    "Your password must be 8 letters long.": "你的密码必须等于8个字符",
    "Re-enter Password:": "再次输入密码",
    "Available Games": "活动的对局",
    "The games you can join.": "你可以加入的游戏（如果还有空位的话）",
    "You've been disconnected from the server": "你已掉线（网络原因或在大厅里长时间未活动）",
    "Play on another game server or region": "切换到其他大区游玩",
    "Observe": "旁观对局",
    "Observe an existing multiplayer game": "旁观一个已存在的多人游戏",
    "Create Game": "创建对局",
    "Creates a new multiplayer game.": "新建一个新的多人游戏",
    "Join Game": "加入对局",
    "Join an existing multiplayer game.": "加入一个已存在的多人游戏",
    "Change server": "切换大区",
    "Room Description": "房间描述",
    "Cancel": "取消",
    "Players": "玩家",
    "Side": "阵营",
    "Color": "颜色",
    "Start": "出生点",
    "Team": "队伍",
    "Closed": "关闭",
    "Short Game": "快速游戏",
    "MCV Repacks": "基地可重新部署",
    "Crates Appear": "随机宝箱",
    "Superweapons": "超级武器",
    "Host Teams": "房主决定成员队伍",
    "Game Speed": "游戏速度",
    "Credits": "初始资金",
    "Unit Count": "初始作战单位",
    "Build Off Ally ConYards": "可在盟友建造场旁建造",
    "Start Game": "开始游戏",
    "Customize Battle": "定制对局",
    "Host Screen": "房主视角",
    "Open": "打开",
    "Observer": "旁观者",
    "Open Observer": "允许旁观",
    "Game Type": "游戏类型",
    "Select Engagement": "选择作战配置",
    "Game Map": "游戏地图",
    "Use Map": "使用该地图",
    "Custom Map...": "自定义(上传地图)",
    "Search": "搜索",
    "Join Screen": "参与者视角",
    "Accept": "准备",
    "Skirmish Game": "模拟战斗",
    "Training dummy": "训练用敌人",
    "Select replay:": "选择回放",
    "Load": "读取",
    "Keep": "保持",
    "Import...": "导入",
    "Export...": "导出",
    "Delete": "删除",
    "Patch Notes": "版本更新说明",
    "Report a Bug": "问题与反馈",
    "Donate": "捐赠",
    "View Credits": "鸣谢",
    "Gameplay": "游玩",
    "Scroll Rate": "滚动速率",
    "Attack/Move Button": "攻击/移动",
    "Right Click Scrolling": "右键按住自由滚动",
    "Show Flyer Helper": "辅助确定飞行单位位置",
    "See Hidden Objects": "隐藏目标有特殊标记",
    "Target Lines": "目标指示线",
    "Graphics": "图形",
    "Resolution": "分辨率",
    "Models": "模型精度",
    "Dynamic Shadows": "动态阴影",
    "Sound": "声音",
    "Keyboard": "键盘",
    "Storage": "存储管理",
    "Resume Mission": "回到作战",
    "Abort Mission": "放弃作战",
    "Quit": "退出",
    "Random (???)": "随机 (???)",
    "America": "美国",
    "Korea": "韩国",
    "France": "法国",
    "Germany": "德国",
    "Great Britain": "英国",
    "Libya": "利比亚",
    "Iraq": "伊拉克",
    "Cuba": "古巴",
    "Russia": "苏俄",
    "Map Name ↓": "地图名称 ↓",
    "Map Name ↑": "地图名称 ↑",
    "Max Slots ↓": "最大玩家数 ↓",
    "Max Slots ↑": "最大玩家数 ↑",
    "Paradrop": "空降部队",
    "The USA has the best paratroopers in the world. Build an Airforce Command Center to drop paratroopers anywhere on the battlefield.": "美国可以建造空指部获取空降部队支援权限，每隔一段时间后可以在任意地点空投8名美国大兵。该支援可与占领科技机场后的伞兵同时存在！",
    "Black Eagle": "黑鹰战机",
    "The Black Eagles are the most dangerous fighter pilots in the world. Korean forces are always well protected by these deadly air men and their lethal fighter-bombers.": "韩国黑鹰战机与入侵者战机价格一样，但其装甲与火力远超入侵者战机。7架飞机可以瞬间摧毁敌方基地！",
    "Grand Cannon": "巨炮",
    "The French Grand Cannon is the ultimate defensive gun, firing at long range for massive damage.": "法国巨炮拥有惊人破坏力。可被V3火箭、驱逐舰、火箭飞行兵、天启坦克等单位克制，除此之外几乎是所向披靡。对了，小心被停电和红警魔鬼蓝天。",
    "Tank Destroyer": "坦克杀手",
    "The German Tank Destroyer can easily eliminate enemy vehicles. Its advanced armor-piercing gun is weak against enemy infantry and structures.": "德国坦克杀手可以轻松消灭敌方载具，尤其是消灭敌方矿车以摧毁敌方经济来源，但对付步兵和建筑犹如挠痒痒一样几乎伤害为零。受制于炮塔不能旋转，只能在小规模纯坦克作战情况下发挥优异的作用。",
    "Sniper": "狙击手",
    "The British Sniper can easily eliminate enemy infantry at great ranges.": "英国狙击手可以轻松击杀敌方步兵于超远的距离。如果将其派驻到多功能步兵车，可以帮助步兵车尽快升级。对建筑和载具伤害如挠痒痒一样几乎为0.",
    "Demolition Truck": "自爆卡车",
    "The Libyan Demolition Truck self-destructs on an enemy target, setting off a small nuclear bomb.": "利比亚自爆卡车可以在接近敌人时引爆小型核弹，与敌人一起上西天。小心保护，不要让别人在自家引爆！",
    "Desolator": "辐射工兵",
    "The Iraqi Desolator can poison land with toxic radiation or annihilate enemy troops with his powerful Rad-Cannon.": "伊拉克辐射工兵可以远程瞬间融化敌人步兵和击杀载具。部署后可形成辐射场，批量损毁载具和融化步兵，但这种模式不会为他带来经验。",
    "Terrorist": "恐怖分子",
    "The Cuban terrorist is a fanatic for the Soviet cause and will actually carry a bomb right up to the enemy before detonating it, destroying himself and anything nearby.": "古巴恐怖分子可以灵活、快速地接近敌人并引爆炸药。当其进入盟军的多功能步兵车，将化身小型自爆卡车！从建筑的不同角度接近自爆伤害大有差异，也可以配合疯狂伊文绑上炸弹进入防空履带车，请尽情探索！",
    "Tesla Tank": "磁能坦克",
    "Russian Tesla Tanks fire a short range Tesla Bolt that can short circuit enemy vehicles and even arc over enemy walls.": "苏俄磁能坦克拥有均衡的速度和稍高于普通坦克的攻击，可以越过敌人围墙攻击，升级到精英级别后射出的闪电会分叉。",
    "Not Ready": "取消准备",
    "Not ready": "取消准备",
    "Select Mode": "选择模式",
    "Ranked": "排位赛",
    "Unranked": "非排位赛",
    "Breaking News": "突发新闻",
    "Preferred Country": "选择阵营",
    "Preferred Color": "选择颜色",
    "Wins :": "胜利 :",
    "Losses :": "失败 :",
    "Disconnects :": "掉线 :",
    "Rank :": "段位 :",
    "Points :": "得分点 :",
    "Offline": "离线",
    "Play": "开始游戏",
    "View ladder": "查看排行榜",
    "The host wants to start the game. Press the flashing Accept button.": "房主准备开始游戏，请点击右侧菜单 准备 按钮！",
    "Master Volume": "主音量",
    "Music Volume": "音乐音量",
    "Voice Volume": "语音音量",
    "SFX Volume": "音效音量",
    "Ambient Volume": "环境音量",
    "UI Volume": "UI音量",
    "Credits Volume": "货币音量",
    "Multiplayer Score": "多人游戏得分",
    "Player": "玩家",
    "Kills": "击杀",
    "Losses": "损失",
    "Built": "建造",
    "Score": "得分",
    "Continue": "下一步"
};
let transDOMMap = {
    "dom-node:discordlink": `<p style="color: red;font-weight: bold;">如果您没微信，可以使用亲戚朋友的关注，感谢您的理解和支持~</p>`,
    "dom-node:快速匹配": `排位赛`
}

document.addEventListener('DOMContentLoaded', (event) => {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {

            if (mutation.type === 'childList') {
                translateDOM(mutation.target);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

function isNodeTransDom(value = "") {
    const valueType = value.split(':')[0] || "normal"
    if (valueType === "dom-node") {
        return true
    } else {
        return false
    }
}
function translateDOM(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const textContent = node.textContent;
        const textValue = translationMap[textContent]
        if (textValue) {
            if (isNodeTransDom(textValue)) {
                const tempTransDom = transDOMMap[textValue]
                node.innerHTML = tempTransDom || `<div></div>`
            } else {
                if (containsOnlyTextOrIsEmpty(node)) {
                    node.textContent = textValue;
                }
            }
        }

        for (const child of node.childNodes) {
            translateDOM(child);
        }
    }
}
function containsOnlyTextOrIsEmpty(element) {
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
}
function isStringOnlyWhitespace(str) {
    return /^\s*$/.test(str);
}

// 请求CSS文件
fetch('https://cn.ra2web.cn/style.css?v=0.57.2')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(cssCode => {
    // 创建一个<style>元素，将CSS代码插入其中
    const styleElement = document.createElement('style');
    styleElement.textContent = cssCode;

    // 将<style>元素添加到<head>中
    document.head.appendChild(styleElement);
  })
  .catch(error => {
    console.error('Error fetching CSS:', error);
  });