window.ra2webInjection = {
    joy: null,
    CdApi: null,
};

/**
 * 域名故障转移系统 v2.0
 * 智能域名质量评分 + 自动故障转移
 * 
 * 特性:
 * - 域名质量评分系统（根据成功率、响应时间、错误次数动态评分）
 * - 低质量域名自动降级，优先使用高质量域名
 * - 完全失败的域名暂时禁用，一段时间后自动恢复尝试
 * - 支持 fetch 和 XMLHttpRequest 拦截
 */
ra2webInjection.domainFallback = {
    // 主域名 -> 备用域名列表的映射
    fallbackMap: {
        'wyhjres.ra2web.cn': [
            'wyhjres2.bun.sh.cn',  // 备用域名1
        ],
        'download.ra2web.com': [
        ],
    },

    // ========== 敏感环境评分策略 ==========
    // 设计原则：
    // 1. 一次失败立即标记为"有问题"，下次请求优先用其他域名
    // 2. 只有当所有域名都出过问题，才从"非完全阻断"的域名中选择
    // 3. 完全阻断 = 连续多次失败
    config: {
        // 初始质量分数（满分100）
        initialScore: 100,
        // 请求成功加分（很小，因为一次失败就要切换）
        successBonus: 1,
        // 请求失败扣分（非常高，一次失败就降到很低优先级）
        failurePenalty: 80,
        // 慢速请求扣分（超过 slowThreshold 毫秒）
        slowPenalty: 30,
        // 慢速阈值（毫秒）
        slowThreshold: 3000,
        // 非常慢的阈值（毫秒）
        verySlowThreshold: 8000,
        // 非常慢扣分
        verySlowPenalty: 50,
        // 最低可用分数（低于此分数视为"有问题"，但不是完全阻断）
        minUsableScore: 50,
        // 完全阻断阈值（连续失败次数超过此值则完全禁用）
        maxConsecutiveFailures: 2,
        // 禁用后恢复时间（毫秒）
        recoveryTime: 120000, // 2分钟
        // 分数恢复间隔（毫秒）
        scoreRecoveryInterval: 60000, // 1分钟
        // 每次恢复增加的分数
        scoreRecoveryAmount: 10,
        // 最大分数
        maxScore: 100,
    },

    // ========== 域名状态分类 ==========
    // PRISTINE: 从未失败过（最高优先级）
    // DEGRADED: 失败过但不是完全阻断（次优先级）
    // BLOCKED: 完全阻断（最低优先级，只有其他都不行才用）
    DomainStatus: {
        PRISTINE: 'pristine',   // 从未失败
        DEGRADED: 'degraded',   // 有过失败
        BLOCKED: 'blocked',     // 完全阻断
    },

    // ========== 域名质量数据 ==========
    // 域名 -> { score, successCount, failureCount, consecutiveFailures, lastFailure, lastSuccess, totalResponseTime, requestCount, disabledUntil, everFailed }
    domainStats: new Map(),

    // 存储当前正在使用的域名映射（原始域名 -> 当前使用的域名）
    activeDomainMap: new Map(),

    /**
     * 初始化或获取域名统计数据
     */
    getStats(host) {
        if (!this.domainStats.has(host)) {
            this.domainStats.set(host, {
                score: this.config.initialScore,
                successCount: 0,
                failureCount: 0,
                consecutiveFailures: 0,
                lastFailure: null,
                lastSuccess: null,
                totalResponseTime: 0,
                requestCount: 0,
                disabledUntil: null,
                everFailed: false,  // 是否曾经失败过
            });
        }
        return this.domainStats.get(host);
    },

    /**
     * 获取域名当前状态
     */
    getDomainStatus(host) {
        const stats = this.getStats(host);
        const now = Date.now();

        // 检查是否完全阻断（禁用中或连续失败过多）
        if (stats.disabledUntil && now < stats.disabledUntil) {
            return this.DomainStatus.BLOCKED;
        }
        if (stats.consecutiveFailures >= this.config.maxConsecutiveFailures) {
            return this.DomainStatus.BLOCKED;
        }

        // 检查是否曾经失败过
        if (stats.everFailed) {
            return this.DomainStatus.DEGRADED;
        }

        return this.DomainStatus.PRISTINE;
    },

    /**
     * 记录请求成功
     */
    recordSuccess(host, responseTime) {
        const stats = this.getStats(host);
        const now = Date.now();

        stats.successCount++;
        stats.consecutiveFailures = 0;
        stats.lastSuccess = now;
        stats.requestCount++;
        stats.totalResponseTime += responseTime;
        stats.disabledUntil = null;

        // 加分
        stats.score = Math.min(this.config.maxScore, stats.score + this.config.successBonus);

        // 慢速请求扣分
        if (responseTime > this.config.verySlowThreshold) {
            stats.score = Math.max(0, stats.score - this.config.verySlowPenalty);
            console.warn(`[DomainFallback] 域名 ${host} 响应非常慢 (${responseTime}ms)，当前评分: ${stats.score}`);
        } else if (responseTime > this.config.slowThreshold) {
            stats.score = Math.max(0, stats.score - this.config.slowPenalty);
            console.warn(`[DomainFallback] 域名 ${host} 响应较慢 (${responseTime}ms)，当前评分: ${stats.score}`);
        }

        this.logStats(host, '成功');
    },

    /**
     * 记录请求失败（严重问题，立即标记为有问题的域名）
     */
    recordFailure(host, error) {
        const stats = this.getStats(host);
        const now = Date.now();

        stats.failureCount++;
        stats.consecutiveFailures++;
        stats.lastFailure = now;
        stats.everFailed = true;  // 标记为曾经失败过

        // 大幅扣分，一次失败就降到很低优先级
        stats.score = Math.max(0, stats.score - this.config.failurePenalty);

        // 连续失败过多则完全阻断
        if (stats.consecutiveFailures >= this.config.maxConsecutiveFailures) {
            stats.disabledUntil = now + this.config.recoveryTime;
            console.error(`[DomainFallback] ⛔ 域名 ${host} 连续失败 ${stats.consecutiveFailures} 次，完全阻断至 ${new Date(stats.disabledUntil).toLocaleTimeString()}`);
        } else {
            console.warn(`[DomainFallback] ⚠️ 域名 ${host} 失败，已标记为低质量，下次请求将优先使用其他域名`);
        }

        this.logStats(host, '失败', error);
    },

    /**
     * 记录请求过程中的错误（问题较轻，但仍标记为有问题）
     */
    recordError(host, errorType) {
        const stats = this.getStats(host);
        const now = Date.now();
        
        stats.everFailed = true;  // 任何错误都标记为曾经失败过
        stats.lastFailure = now;
        
        // 根据错误类型扣分（敏感模式下扣分更重）
        const penaltyMap = {
            'timeout': 60,
            'partial': 50,
            'slow': 40,
            '5xx': 70,
            '4xx': 20,
            'network': 80,
        };

        const penalty = penaltyMap[errorType] || 50;
        stats.score = Math.max(0, stats.score - penalty);
        stats.failureCount++;

        console.warn(`[DomainFallback] ⚠️ 域名 ${host} 发生 ${errorType} 错误，已标记为低质量，下次请求将优先使用其他域名`);
    },

    /**
     * 输出统计日志
     */
    logStats(host, status, error = null) {
        const stats = this.getStats(host);
        const avgTime = stats.requestCount > 0 
            ? Math.round(stats.totalResponseTime / stats.requestCount) 
            : 0;
        
        console.log(`[DomainFallback] ${host} [${status}] 评分:${stats.score} 成功:${stats.successCount} 失败:${stats.failureCount} 平均响应:${avgTime}ms` + 
            (error ? ` 错误:${error}` : ''));
    },

    /**
     * 检查域名是否可尝试（注意：这不同于"优先使用"）
     * 即使返回 true，也可能是 DEGRADED 状态
     */
    isAvailable(host) {
        const status = this.getDomainStatus(host);
        // BLOCKED 状态的域名在正常情况下不可用
        // 但如果所有域名都是 BLOCKED，则允许尝试
        return status !== this.DomainStatus.BLOCKED;
    },

    /**
     * 检查域名是否完美可用（从未失败过）
     */
    isPristine(host) {
        return this.getDomainStatus(host) === this.DomainStatus.PRISTINE;
    },

    /**
     * 获取域名的所有候选域名列表（包括原始域名），按质量排序
     */
    getCandidates(originalHost) {
        const candidates = [originalHost];
        const fallbacks = this.fallbackMap[originalHost];
        if (fallbacks) {
            candidates.push(...fallbacks);
        }
        return candidates;
    },

    /**
     * 获取按优先级排序的候选域名
     * 优先级：PRISTINE（从未失败）> DEGRADED（失败过）> BLOCKED（完全阻断）
     * 同优先级内按分数排序
     */
    getSortedAvailableCandidates(originalHost) {
        const allCandidates = this.getCandidates(originalHost);
        const { PRISTINE, DEGRADED, BLOCKED } = this.DomainStatus;
        
        // 按状态分类
        const pristine = [];  // 从未失败的域名
        const degraded = [];  // 失败过但未完全阻断的域名
        const blocked = [];   // 完全阻断的域名
        
        for (const host of allCandidates) {
            const status = this.getDomainStatus(host);
            switch (status) {
                case PRISTINE:
                    pristine.push(host);
                    break;
                case DEGRADED:
                    degraded.push(host);
                    break;
                case BLOCKED:
                    blocked.push(host);
                    break;
            }
        }
        
        // 每个分类内按分数降序排序
        const sortByScore = (a, b) => this.getStats(b).score - this.getStats(a).score;
        pristine.sort(sortByScore);
        degraded.sort(sortByScore);
        blocked.sort(sortByScore);
        
        // 记录选择日志
        if (pristine.length > 0) {
            console.log(`[DomainFallback] 🟢 优先使用从未失败的域名: ${pristine[0]}`);
        } else if (degraded.length > 0) {
            console.log(`[DomainFallback] 🟡 所有域名都失败过，使用评分最高的: ${degraded[0]} (评分: ${this.getStats(degraded[0]).score})`);
        } else if (blocked.length > 0) {
            console.log(`[DomainFallback] 🔴 所有域名都被阻断，尝试恢复: ${blocked[0]}`);
        }
        
        // 返回顺序：pristine -> degraded -> blocked
        return [...pristine, ...degraded, ...blocked];
    },

    /**
     * 替换URL中的域名
     */
    replaceHost(url, newHost) {
        try {
            const urlObj = new URL(url, window.location.origin);
            urlObj.host = newHost;
            return urlObj.href;
        } catch (e) {
            // 处理协议相对URL（以 // 开头）
            if (url.startsWith('//')) {
                const urlObj = new URL('https:' + url);
                urlObj.host = newHost;
                return '//' + urlObj.host + urlObj.pathname + urlObj.search + urlObj.hash;
            }
            return url;
        }
    },

    /**
     * 从URL中提取主机名
     */
    extractHost(url) {
        try {
            if (url.startsWith('//')) {
                return new URL('https:' + url).host;
            }
            return new URL(url, window.location.origin).host;
        } catch (e) {
            return null;
        }
    },

    /**
     * 检查是否是我们需要处理的域名
     */
    shouldIntercept(url) {
        const host = this.extractHost(url);
        return host && (this.fallbackMap.hasOwnProperty(host) || 
                        Object.values(this.fallbackMap).flat().includes(host));
    },

    /**
     * 获取原始域名（如果是备用域名则返回对应的原始域名）
     */
    getOriginalHost(host) {
        if (this.fallbackMap.hasOwnProperty(host)) {
            return host;
        }
        for (const [original, fallbacks] of Object.entries(this.fallbackMap)) {
            if (fallbacks.includes(host)) {
                return original;
            }
        }
        return host;
    },

    /**
     * 重置所有域名状态（完全重置，所有域名恢复到 PRISTINE）
     */
    resetAllStats() {
        this.domainStats.clear();
        this.activeDomainMap.clear();
        console.log('[DomainFallback] ✅ 已重置所有域名统计数据，所有域名恢复为正常状态');
    },

    /**
     * 仅重置阻断状态（不清除失败历史，但允许 BLOCKED 域名重新尝试）
     */
    resetBlockedDomains() {
        for (const [host, stats] of this.domainStats) {
            if (stats.disabledUntil) {
                stats.disabledUntil = null;
                stats.consecutiveFailures = 0;
                stats.score = Math.max(stats.score, 30); // 给予最低分数
                console.log(`[DomainFallback] 域名 ${host} 已解除阻断，当前评分: ${stats.score}`);
            }
        }
    },

    /**
     * 获取所有域名的状态报告
     */
    getStatusReport() {
        const report = {};
        const statusEmoji = {
            [this.DomainStatus.PRISTINE]: '🟢 正常',
            [this.DomainStatus.DEGRADED]: '🟡 降级',
            [this.DomainStatus.BLOCKED]: '🔴 阻断',
        };
        
        for (const [host, stats] of this.domainStats) {
            const status = this.getDomainStatus(host);
            report[host] = {
                状态: statusEmoji[status],
                评分: stats.score,
                成功: stats.successCount,
                失败: stats.failureCount,
                连续失败: stats.consecutiveFailures,
                曾失败: stats.everFailed ? '是' : '否',
                平均响应: stats.requestCount > 0
                    ? Math.round(stats.totalResponseTime / stats.requestCount) + 'ms'
                    : '-',
                阻断至: stats.disabledUntil ? new Date(stats.disabledUntil).toLocaleTimeString() : '-',
            };
        }
        return report;
    },

    /**
     * 打印状态报告到控制台
     */
    printStatusReport() {
        console.table(this.getStatusReport());
    },
};

/**
 * 增强版 fetch，支持智能域名故障转移和质量评分
 */
(function() {
    const originalFetch = window.fetch;
    const fallback = ra2webInjection.domainFallback;

    // 保存原始 fetch 引用
    window.fetch.__original = originalFetch;

    window.fetch = async function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        
        // 如果不是需要处理的域名，直接使用原始 fetch
        if (!fallback.shouldIntercept(url)) {
            return originalFetch.call(window, input, init);
        }

        const originalHost = fallback.extractHost(url);
        const primaryHost = fallback.getOriginalHost(originalHost);
        
        // 获取按优先级排序的候选域名
        let sortedCandidates = fallback.getSortedAvailableCandidates(primaryHost);
        
        // 如果返回的列表为空或全部是 BLOCKED，尝试解除阻断
        if (sortedCandidates.length === 0) {
            console.warn('[DomainFallback] 所有候选域名都被阻断，解除阻断状态重试...');
            fallback.resetBlockedDomains();
            sortedCandidates = fallback.getSortedAvailableCandidates(primaryHost);
        }
        
        // 如果仍然为空，完全重置
        if (sortedCandidates.length === 0) {
            console.warn('[DomainFallback] 仍无可用域名，完全重置统计数据...');
            fallback.resetAllStats();
            sortedCandidates = fallback.getCandidates(primaryHost);
        }

        let lastError = null;
        
        for (const candidateHost of sortedCandidates) {
            const newUrl = fallback.replaceHost(url, candidateHost);
            const newInput = typeof input === 'string' ? newUrl : new Request(newUrl, input);
            
            const startTime = Date.now();
            
            try {
                const response = await originalFetch.call(window, newInput, init);
                const responseTime = Date.now() - startTime;
                
                // 检查响应状态
                if (response.ok) {
                    // 完全成功
                    fallback.recordSuccess(candidateHost, responseTime);
                    
                    // 更新活跃域名映射
                    if (candidateHost !== primaryHost) {
                        fallback.activeDomainMap.set(primaryHost, candidateHost);
                    }
                    
                    return response;
                } else if (response.status >= 500) {
                    // 5xx 服务器错误 - 记录错误并尝试下一个
                    fallback.recordError(candidateHost, '5xx');
                    lastError = new Error(`HTTP ${response.status}`);
                    continue;
                } else if (response.status >= 400) {
                    // 4xx 客户端错误 - 可能是资源问题而非域名问题，轻微扣分
                    fallback.recordError(candidateHost, '4xx');
                    // 4xx 错误仍然返回响应，让调用者处理
                    return response;
                } else {
                    // 其他状态码（1xx, 3xx）视为成功
                    fallback.recordSuccess(candidateHost, responseTime);
                    return response;
                }
            } catch (error) {
                const responseTime = Date.now() - startTime;
                
                // 区分错误类型
                if (error.name === 'AbortError') {
                    // 请求被取消，不记录为失败
                    throw error;
                } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    // 网络错误
                    fallback.recordFailure(candidateHost, 'network');
                } else if (responseTime > fallback.config.verySlowThreshold) {
                    // 超时类错误
                    fallback.recordFailure(candidateHost, 'timeout');
                } else {
                    // 其他错误
                    fallback.recordFailure(candidateHost, error.message);
                }
                
                lastError = error;
            }
        }

        // 所有候选域名都失败
        console.error('[DomainFallback] 所有域名请求失败:', url);
        console.log('[DomainFallback] 当前域名状态:');
        fallback.printStatusReport();
        throw lastError || new Error('All domain candidates failed');
    };
})();

/**
 * 增强版 XMLHttpRequest，支持智能域名故障转移和质量评分
 */
(function() {
    const OriginalXHR = window.XMLHttpRequest;
    const fallback = ra2webInjection.domainFallback;

    window.XMLHttpRequest = function() {
        const xhr = new OriginalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        let interceptedUrl = null;
        let interceptedMethod = null;
        let usedHost = null;
        let startTime = null;

        xhr.open = function(method, url, async = true, user, password) {
            interceptedMethod = method;
            interceptedUrl = url;

            // 如果是需要处理的域名
            if (fallback.shouldIntercept(url)) {
                const originalHost = fallback.extractHost(url);
                const primaryHost = fallback.getOriginalHost(originalHost);
                
                // 获取最佳可用域名
                const sortedCandidates = fallback.getSortedAvailableCandidates(primaryHost);
                
                if (sortedCandidates.length > 0) {
                    const bestHost = sortedCandidates[0];
                    usedHost = bestHost;
                    
                    if (bestHost !== originalHost) {
                        url = fallback.replaceHost(url, bestHost);
                        console.log(`[DomainFallback] XHR 使用最佳域名: ${originalHost} -> ${bestHost} (评分: ${fallback.getStats(bestHost).score})`);
                    }
                } else {
                    usedHost = originalHost;
                }
            }

            return originalOpen.call(this, method, url, async, user, password);
        };

        xhr.send = function(body) {
            startTime = Date.now();
            
            // 监听请求完成
            if (usedHost && fallback.shouldIntercept(interceptedUrl)) {
                const handleComplete = () => {
                    const responseTime = Date.now() - startTime;
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        // 成功
                        fallback.recordSuccess(usedHost, responseTime);
                    } else if (xhr.status >= 500) {
                        // 5xx 错误
                        fallback.recordError(usedHost, '5xx');
                    } else if (xhr.status >= 400) {
                        // 4xx 错误
                        fallback.recordError(usedHost, '4xx');
                    } else if (xhr.status === 0) {
                        // 网络错误
                        fallback.recordFailure(usedHost, 'network');
                    }
                };

                xhr.addEventListener('load', handleComplete);
                xhr.addEventListener('error', () => {
                    fallback.recordFailure(usedHost, 'network');
                });
                xhr.addEventListener('timeout', () => {
                    fallback.recordError(usedHost, 'timeout');
                });
            }

            return originalSend.call(this, body);
        };

        return xhr;
    };

    // 保留原型链和静态属性
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
    window.XMLHttpRequest.UNSENT = OriginalXHR.UNSENT;
    window.XMLHttpRequest.OPENED = OriginalXHR.OPENED;
    window.XMLHttpRequest.HEADERS_RECEIVED = OriginalXHR.HEADERS_RECEIVED;
    window.XMLHttpRequest.LOADING = OriginalXHR.LOADING;
    window.XMLHttpRequest.DONE = OriginalXHR.DONE;
})();

/**
 * 域名健康检查（可选：启动时预检测域名可用性和响应速度）
 */
ra2webInjection.domainFallback.healthCheck = async function(testPath = '/favicon.ico') {
    const originalFetch = window.fetch.__original || window.fetch;
    
    console.log('[DomainFallback] 开始域名健康检查...');
    
    const checkPromises = [];
    
    for (const [primaryDomain, fallbacks] of Object.entries(this.fallbackMap)) {
        const allDomains = [primaryDomain, ...fallbacks];
        
        for (const domain of allDomains) {
            const checkPromise = (async () => {
                const startTime = Date.now();
                
                try {
                    const testUrl = `//${domain}${testPath}`;
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
                    
                    const response = await originalFetch(testUrl, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    const responseTime = Date.now() - startTime;
                    
                    // 记录成功（no-cors 模式下 response.ok 总是 false，但没抛错就是成功）
                    this.recordSuccess(domain, responseTime);
                    console.log(`[DomainFallback] 健康检查通过: ${domain} (${responseTime}ms)`);
                    
                } catch (error) {
                    const responseTime = Date.now() - startTime;
                    
                    if (error.name === 'AbortError') {
                        this.recordError(domain, 'timeout');
                        console.warn(`[DomainFallback] 健康检查超时: ${domain}`);
                    } else {
                        this.recordFailure(domain, 'network');
                        console.warn(`[DomainFallback] 健康检查失败: ${domain}`, error.message);
                    }
                }
            })();
            
            checkPromises.push(checkPromise);
        }
    }
    
    // 等待所有检查完成
    await Promise.allSettled(checkPromises);
    
    console.log('[DomainFallback] 健康检查完成，当前域名状态:');
    this.printStatusReport();
};

/**
 * 定时恢复域名分数（让暂时出问题的域名有机会恢复）
 */
ra2webInjection.domainFallback.startRecoveryTimer = function() {
    const self = this;
    
    setInterval(() => {
        const now = Date.now();
        
        for (const [host, stats] of self.domainStats) {
            // 检查禁用状态是否可以解除
            if (stats.disabledUntil && now >= stats.disabledUntil) {
                stats.disabledUntil = null;
                stats.consecutiveFailures = 0;
                stats.score = Math.min(self.config.maxScore, stats.score + 20); // 恢复一些分数
                console.log(`[DomainFallback] 域名 ${host} 禁用期结束，当前评分: ${stats.score}`);
            }
            
            // 逐渐恢复低分域名的分数
            if (stats.score < self.config.maxScore && stats.score > 0) {
                const timeSinceLastFailure = stats.lastFailure ? now - stats.lastFailure : Infinity;
                
                if (timeSinceLastFailure > self.config.scoreRecoveryInterval) {
                    const oldScore = stats.score;
                    stats.score = Math.min(self.config.maxScore, stats.score + self.config.scoreRecoveryAmount);
                    if (stats.score !== oldScore) {
                        console.log(`[DomainFallback] 域名 ${host} 分数自动恢复: ${oldScore} -> ${stats.score}`);
                    }
                }
            }
        }
    }, this.config.scoreRecoveryInterval);
    
    console.log('[DomainFallback] 分数恢复定时器已启动');
};

// 自动启动分数恢复定时器
ra2webInjection.domainFallback.startRecoveryTimer();

console.log('[DomainFallback] 智能域名故障转移系统 v2.0 已初始化');
console.log('[DomainFallback] 使用 ra2webInjection.domainFallback.printStatusReport() 查看域名状态');
console.log('[DomainFallback] 使用 ra2webInjection.domainFallback.healthCheck() 进行健康检查');

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

    // 完全体副本地址图片漂移功能
    const fullCopyAddrImageLoad = function () {
        // 创建样式
        const style = document.createElement('style');
        style.innerHTML = `
            #full-copy-addr-container {
                display: none;
                position: fixed;
                left: 50px;
                top: 50px;
                z-index: 9999;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
            #full-copy-addr-image {
                display: block;
                max-width: 350px;
                max-height: 600px;
                width: auto;
                height: auto;
            }
            #full-copy-addr-close-btn {
                position: absolute;
                top: -10px;
                right: -10px;
                width: 30px;
                height: 30px;
                background-color: red;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                font-weight: bold;
                line-height: 30px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                z-index: 10000;
            }
            #full-copy-addr-close-btn:hover {
                background-color: darkred;
            }
        `;
        document.head.appendChild(style);

        // 创建容器和图片元素
        const container = document.createElement('div');
        container.id = 'full-copy-addr-container';

        const closeBtn = document.createElement('button');
        closeBtn.id = 'full-copy-addr-close-btn';
        closeBtn.textContent = '×';
        closeBtn.title = '关闭';

        const img = document.createElement('img');
        img.id = 'full-copy-addr-image';
        img.src = '/QQ20251012-191104.png';
        img.alt = '完全体副本地址';

        container.appendChild(closeBtn);
        container.appendChild(img);
        document.body.appendChild(container);

        let w = document.documentElement.clientWidth;
        let h = document.documentElement.clientHeight;
        let gox = 1; // 控制横向移动方向
        let goy = 1; // 控制纵向移动方向
        let speed = 0.8; // 缓慢移动速度
        let animationFrameId; // 存储 requestAnimationFrame id
        let isClosed = false; // 标记是否已关闭

        function move() {
            if (isClosed) return;

            let x = container.offsetLeft;
            let y = container.offsetTop;
            let containerWidth = container.offsetWidth;
            let containerHeight = container.offsetHeight;

            if (x > w - containerWidth || x < 0) gox = -gox;
            container.style.left = x + speed * gox + "px";
            
            if (y > h - containerHeight || y < 0) goy = -goy;
            container.style.top = y + speed * goy + "px";
            
            animationFrameId = requestAnimationFrame(move);
        }

        // 鼠标悬停时暂停动画
        container.onmouseenter = function () {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };

        // 鼠标离开时恢复动画
        container.onmouseleave = function () {
            if (!isClosed && container.style.display === 'block') {
                move();
            }
        };

        // 关闭按钮事件
        closeBtn.onclick = function () {
            isClosed = true;
            container.style.display = 'none';
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };

        // 检查是否存在包含"完全体副本地址"文本的节点
        function checkForFullCopyAddr() {
            if (isClosed) return; // 如果已关闭，不再检查

            // 获取页面所有文本节点
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let found = false;
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent && node.textContent.includes('完全体副本地址')) {
                    found = true;
                    break;
                }
            }

            if (found && container.style.display !== 'block') {
                container.style.display = 'block';
                // 更新窗口尺寸
                w = document.documentElement.clientWidth;
                h = document.documentElement.clientHeight;
                move(); // 开始动画
            } else if (!found && container.style.display === 'block') {
                container.style.display = 'none';
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            }
        }

        // 使用 MutationObserver 监视 DOM 变化
        const observer = new MutationObserver(checkForFullCopyAddr);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // 窗口大小改变时更新尺寸
        window.addEventListener('resize', function() {
            w = document.documentElement.clientWidth;
            h = document.documentElement.clientHeight;
        });

        checkForFullCopyAddr(); // 初始检查
    };

    // 启动完全体副本地址图片漂移功能
    // fullCopyAddrImageLoad();
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
fetch("https://wyhj.k0s.cn/style.css?v=0.65.0")
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
