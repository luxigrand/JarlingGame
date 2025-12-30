// DEĞİŞKENLER
let player, enemiesContainer, scoreEl, healthEl;

let gameLoop;
let spawnLoop;
let isGameRunning = false;
let score = 0;
let health = 3;
let maxHealth = 3;
let enemies = [];
let gameSpeed = 4; 
let spawnRate = 1500;

// Mağaza ve Toplam Skor Sistemi
let totalScore = 0;
let purchasedItems = {};
let isShopOpen = false; 

const enemyTypes = ['🔥'];

// DOM elementlerini başlat (sayfa yüklendiğinde çağrılacak)
function initGameVariables() {
    player = document.getElementById('player');
    enemiesContainer = document.getElementById('enemies-container');
    scoreEl = document.getElementById('score');
    healthEl = document.getElementById('health');
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // Satın alınan öğeleri uygula
    applyPurchasedItems();
    
    // Tüm sesleri durdur
    stopAllSounds();
    
    // Arka plan müziğini başlat
    const bgMusic = document.getElementById('background-music');
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.volume = 0.5; // Arka plan müziği için ses seviyesi
        bgMusic.play().catch(e => {
            console.log('Arka plan müziği çalınamadı:', e);
        });
    }
    
    // Arkaplan karakterini gizle
    const characterLeft = document.querySelector('.character-left');
    if (characterLeft) {
        characterLeft.classList.add('hidden');
    }
    
    score = 0;
    health = maxHealth; 
    updateUI();
    
    enemies = [];
    if (enemiesContainer) {
        enemiesContainer.innerHTML = '';
    }
    isGameRunning = true;

    gameLoop = requestAnimationFrame(update);
    spawnLoop = setInterval(spawnEnemy, spawnRate);
}

function stopAllSounds() {
    const sounds = ['background-music', 'death-sound', 'sword-hit-sound', 'fireball-hit-sound', 'damage-sound'];
    sounds.forEach(soundId => {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    });
}

function resetGame() {
    // Tüm sesleri durdur
    stopAllSounds();
    
    // Game over ekranını sıfırla
    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) {
        gameOverScreen.classList.remove('show');
    }
    
    // Kararma overlay'ini sıfırla
    const deathOverlay = document.getElementById('death-overlay');
    if (deathOverlay) {
        deathOverlay.classList.remove('active');
    }
    
    startGame();
}

function gameOver() {
    isGameRunning = false;
    clearInterval(spawnLoop);
    cancelAnimationFrame(gameLoop);
    
    // Skoru toplam skora ekle (sadece skor varsa)
    if (score > 0) {
        addScoreToTotal(score);
    }
    
    // Arka plan müziğini durdur
    const bgMusic = document.getElementById('background-music');
    if (bgMusic) {
        bgMusic.pause();
    }
    
    const deathOverlay = document.getElementById('death-overlay');
    const deathSound = document.getElementById('death-sound');
    const gameOverScreen = document.getElementById('game-over-screen');
    
    // Kararma efektini başlat
    setTimeout(() => {
        deathOverlay.classList.add('active');
        
        // Ölüm ses efektini çal (kısa - 2 saniye sonra otomatik durdur)
        if (deathSound) {
            deathSound.currentTime = 0;
            deathSound.volume = 0.5;
            deathSound.play().catch(e => {
                console.log('Ölüm sesi çalınamadı:', e);
            });
            
            // 2-3 saniye sonra ölüm sesini durdur
            setTimeout(() => {
                if (deathSound) {
                    deathSound.pause();
                    deathSound.currentTime = 0;
                }
            }, 3000);
        }
        
        // 1 saniye sonra game over ekranını göster
        setTimeout(() => {
            document.getElementById('game-screen').classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
            gameOverScreen.classList.add('show');
            
            // Arkaplan karakterini tekrar göster
            const characterLeft = document.querySelector('.character-left');
            if (characterLeft) {
                characterLeft.classList.remove('hidden');
            }
            
            // Kararma overlay'ini kaldır
            setTimeout(() => {
                deathOverlay.classList.remove('active');
            }, 100);
        }, 1000);
    }, 100);
}

function spawnEnemy() {
    if (!isGameRunning || !enemiesContainer) return;

    const enemyEl = document.createElement('div');
    enemyEl.classList.add('enemy');
    enemyEl.innerText = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    enemyEl.style.left = '800px'; 
    
    enemiesContainer.appendChild(enemyEl);

    enemies.push({
        element: enemyEl,
        x: 800,
        active: true
    });

    if(score > 500) gameSpeed = 6;
}

function update() {
    if (!isGameRunning || isShopOpen) {
        if (isGameRunning && !isShopOpen) {
            gameLoop = requestAnimationFrame(update);
        }
        return;
    }

    enemies.forEach((enemy, index) => {
        if (enemy.active && enemy.element) {
            enemy.x -= gameSpeed;
            enemy.element.style.left = enemy.x + 'px';

            if (enemy.x < 110) {
                takeDamage();
                enemy.element.remove();
                enemy.active = false;
            }
        }
    });

    enemies = enemies.filter(e => e.active);
    gameLoop = requestAnimationFrame(update);
}

function takeDamage() {
    health--;
    updateUI();
    
    // Hasar alma ses efekti
    const damageSound = document.getElementById('damage-sound');
    if (damageSound) {
        damageSound.currentTime = 0;
        damageSound.volume = 0.5;
        damageSound.play().catch(e => {
            console.log('Hasar sesi çalınamadı:', e);
        });
    }
    
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
        gameScreen.style.backgroundColor = 'rgba(255,0,0,0.3)';
        setTimeout(() => { gameScreen.style.backgroundColor = 'transparent'; }, 100);
    }

    if (health <= 0) {
        gameOver();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && isGameRunning) {
        event.preventDefault();
        attack();
    }
});

// Mouse click ile saldırı
document.addEventListener('click', function(event) {
    if (isGameRunning) {
        attack();
    }
    // ESC tuşu ile mağazayı aç/kapat
    if (event.code === 'Escape' && isGameRunning) {
        if (isShopOpen) {
            closeShop();
        } else {
            openShop();
        }
    }
});

// ========== GELİŞMİŞ ÇARPIŞMA TESPİTİ FONKSİYONLARI ==========

/**
 * CSS transform ile dönüştürülmüş noktayı hesapla
 */
function getTransformedPoint(x, y, angle, originX, originY) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const dx = x - originX;
    const dy = y - originY;
    
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;
    
    return {
        x: rotatedX + originX,
        y: rotatedY + originY
    };
}

/**
 * Kılıcın anlık rotasyon açısını CSS'ten parse et
 */
function getWeaponRotation() {
    const weapon = document.querySelector('.weapon');
    if (!weapon) return -45;
    
    const style = window.getComputedStyle(weapon);
    const transform = style.transform || style.webkitTransform;
    
    if (transform === 'none' || !transform) return -45;
    
    const matrix = transform.match(/matrix\(([^)]+)\)/);
    if (matrix) {
        const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length >= 4) {
            const a = values[0];
            const b = values[1];
            const angle = Math.atan2(b, a) * (180 / Math.PI);
            return angle;
        }
    }
    
    const matrix3d = transform.match(/matrix3d\(([^)]+)\)/);
    if (matrix3d) {
        const values = matrix3d[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length >= 16) {
            const a = values[0];
            const b = values[1];
            const angle = Math.atan2(b, a) * (180 / Math.PI);
            return angle;
        }
    }
    
    const rotate = transform.match(/rotate\(([^)]+)deg\)/);
    if (rotate) {
        return parseFloat(rotate[1]);
    }
    
    return -45;
}

/**
 * Kılıcın pivot ve uç noktalarını dünya koordinatlarında hesapla
 */
function getWeaponWorldPosition() {
    const weapon = document.querySelector('.weapon');
    const playerEl = document.getElementById('player');
    const gameContainer = document.getElementById('game-container');
    
    if (!weapon || !playerEl || !gameContainer) {
        return { pivot: {x: 0, y: 0}, tip: {x: 0, y: 0}, length: 0, width: 0 };
    }
    
    const containerRect = gameContainer.getBoundingClientRect();
    const playerRect = playerEl.getBoundingClientRect();
    const weaponRect = weapon.getBoundingClientRect();
    
    const playerLeft = playerRect.left - containerRect.left;
    const playerTop = playerRect.top - containerRect.top;
    const playerHeight = playerRect.height;
    
    const pivotX = playerLeft + 105;
    const pivotY = playerTop + playerHeight;
    
    const weaponLength = 378 * 0.7;
    const rotation = getWeaponRotation();
    const rad = (rotation * Math.PI) / 180;
    
    const tipX = pivotX + weaponLength * Math.cos(rad);
    const tipY = pivotY - weaponLength * Math.sin(rad);
    
    return {
        pivot: { x: pivotX, y: pivotY },
        tip: { x: tipX, y: tipY },
        length: weaponLength,
        rotation: rotation,
        width: 30
    };
}

/**
 * Bir noktanın bir line segment'e olan mesafesini hesapla
 */
function distanceToLineSegment(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Line-segment ile AABB çarpışma kontrolü (Capsule collision)
 */
function checkLineSegmentVsAABB(weapon, enemyRect) {
    const corners = [
        { x: enemyRect.left, y: enemyRect.top },
        { x: enemyRect.right, y: enemyRect.top },
        { x: enemyRect.right, y: enemyRect.bottom },
        { x: enemyRect.left, y: enemyRect.bottom }
    ];
    
    for (const corner of corners) {
        const distance = distanceToLineSegment(corner, weapon.pivot, weapon.tip);
        if (distance < weapon.width) {
            return true;
        }
    }
    
    const enemyCenterX = (enemyRect.left + enemyRect.right) / 2;
    const enemyCenterY = (enemyRect.top + enemyRect.bottom) / 2;
    const centerDistance = distanceToLineSegment(
        { x: enemyCenterX, y: enemyCenterY },
        weapon.pivot,
        weapon.tip
    );
    
    const enemyRadius = Math.max(
        (enemyRect.right - enemyRect.left) / 2,
        (enemyRect.bottom - enemyRect.top) / 2
    );
    
    return centerDistance < (enemyRadius + weapon.width);
}

function attack() {
    if (!player || isShopOpen) return;
    
    player.classList.add('attacking');
    
    const swordSound = document.getElementById('sword-hit-sound');
    if (swordSound) {
        swordSound.currentTime = 0;
        swordSound.volume = 0.4;
        swordSound.play().catch(e => {
            console.log('Kılıç sesi çalınamadı:', e);
        });
    }

    const hitEnemies = new Set();
    // Saldırı hızı güçlendirmesi uygula
    const baseAnimationDuration = 150;
    const animationDuration = baseAnimationDuration * attackSpeedMultiplier;
    const startTime = Date.now();
    
    function checkCollision() {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= animationDuration) {
            if (player) player.classList.remove('attacking');
            return;
        }
        
        const weapon = getWeaponWorldPosition();
        if (weapon.length === 0) {
            if (player) player.classList.remove('attacking');
            return;
        }
        
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            if (player) player.classList.remove('attacking');
            return;
        }
        
        const containerRect = gameContainer.getBoundingClientRect();
        
        enemies.forEach(enemy => {
            if (!enemy.active || hitEnemies.has(enemy) || !enemy.element) return;
            
            const enemyRect = enemy.element.getBoundingClientRect();
            const enemyAABB = {
                left: enemyRect.left - containerRect.left,
                right: enemyRect.right - containerRect.left,
                top: enemyRect.top - containerRect.top,
                bottom: enemyRect.bottom - containerRect.top
            };
            
            const enemyCenterX = (enemyAABB.left + enemyAABB.right) / 2;
            const enemyCenterY = (enemyAABB.top + enemyAABB.bottom) / 2;
            const weaponCenterX = (weapon.pivot.x + weapon.tip.x) / 2;
            const weaponCenterY = (weapon.pivot.y + weapon.tip.y) / 2;
            
            const distX = enemyCenterX - weaponCenterX;
            const distY = enemyCenterY - weaponCenterY;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            const maxDistance = weapon.length + 150;
            if (distance > maxDistance) return;
            
            if (checkLineSegmentVsAABB(weapon, enemyAABB)) {
                enemy.element.innerText = '💥';
                enemy.active = false;
                hitEnemies.add(enemy);
                
                const fireballSound = document.getElementById('fireball-hit-sound');
                if (fireballSound) {
                    fireballSound.currentTime = 0;
                    fireballSound.volume = 0.5;
                    fireballSound.play().catch(e => {
                        console.log('Ateş topu sesi çalınamadı:', e);
                    });
                }
                
                // Hasar çarpanı ve bonus hasarı uygula
                const weaponData = shopItems.weapons.find(w => w.id === currentWeapon);
                const damageMultiplier = weaponData ? weaponData.damageMultiplier : 1.0;
                const baseScore = 100;
                const finalScore = Math.floor(baseScore * damageMultiplier) + damageBonus;
                
                score += finalScore;
                updateUI();

                setTimeout(() => {
                    if (enemy.element && enemy.element.parentNode) {
                        enemy.element.remove();
                    }
                }, 200);

                showHitEffect(enemy.x, 250, `+${finalScore}`);
            }
        });
        
        if (elapsed < animationDuration) {
            requestAnimationFrame(checkCollision);
        } else {
            if (player) player.classList.remove('attacking');
        }
    }
    
    setTimeout(() => {
        checkCollision();
    }, 10);
}

function showHitEffect(x, y, text = "+100") {
    const effect = document.createElement('div');
    effect.classList.add('hit-effect');
    effect.innerText = text;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
        gameScreen.appendChild(effect);
        setTimeout(() => effect.remove(), 500);
    }
}

function updateUI() {
    if (scoreEl) {
        scoreEl.innerText = score.toFixed(2);
    }
    
    if (healthEl) {
        let heartHTML = "";
        for(let i=0; i<maxHealth; i++) {
            if(i < health) {
                heartHTML += '<span style="opacity: 1;">❤️</span>';
            } else {
                heartHTML += '<span style="opacity: 0.2;">❤️</span>';
            }
        }
        healthEl.innerHTML = heartHTML;
    }
}

// ========== ÖĞE TANIMLARI ==========

const shopItems = {
    weapons: [
        {
            id: 'weapon_basic',
            name: 'Temel Kılıç',
            icon: '⚔️',
            description: 'Başlangıç silahı',
            price: 0,
            image: 'assets/kilic.png',
            damageMultiplier: 1.0
        },
        {
            id: 'weapon_iron',
            name: 'Demir Kılıç',
            icon: '⚔️',
            description: '%20 hasar artışı',
            price: 500,
            image: 'assets/kilic.png',
            damageMultiplier: 1.2
        },
        {
            id: 'weapon_gold',
            name: 'Altın Kılıç',
            icon: '⚔️',
            description: '%50 hasar artışı',
            price: 1500,
            image: 'assets/kilic.png',
            damageMultiplier: 1.5
        },
        {
            id: 'weapon_legendary',
            name: 'Efsanevi Kılıç',
            icon: '⚔️',
            description: '%100 hasar artışı',
            price: 3000,
            image: 'assets/kilic.png',
            damageMultiplier: 2.0
        }
    ],
    health: [
        {
            id: 'health_boost_1',
            name: 'Can Artırma I',
            icon: '❤️',
            description: '+1 maksimum can',
            price: 1000,
            healthIncrease: 1
        },
        {
            id: 'health_boost_2',
            name: 'Can Artırma II',
            icon: '❤️',
            description: '+1 maksimum can (toplam +2)',
            price: 2500,
            healthIncrease: 1
        }
    ],
    powerups: [
        {
            id: 'powerup_fast_attack',
            name: 'Hızlı Saldırı',
            icon: '⚡',
            description: 'Saldırı hızı %25 artar',
            price: 800,
            attackSpeedMultiplier: 0.75
        },
        {
            id: 'powerup_strong_attack',
            name: 'Güçlü Saldırı',
            icon: '💪',
            description: 'Hasar çarpanı +50',
            price: 1200,
            damageBonus: 50
        }
    ]
};

// Oyun değişkenleri (güçlendirmeler için)
let currentWeapon = 'weapon_basic';
let attackSpeedMultiplier = 1.0;
let damageBonus = 0;

// ========== TOPLAM SKOR SİSTEMİ ==========

function loadTotalScore() {
    const saved = localStorage.getItem('jarling_totalScore');
    if (saved) {
        totalScore = parseFloat(saved) || 0;
    } else {
        totalScore = 0;
    }
}

function saveTotalScore() {
    localStorage.setItem('jarling_totalScore', totalScore.toString());
}

function addScoreToTotal(amount) {
    totalScore += amount;
    saveTotalScore();
    updateShopUI();
}

// ========== SATIN ALINAN ÖĞELER SİSTEMİ ==========

function loadPurchasedItems() {
    const saved = localStorage.getItem('jarling_purchasedItems');
    if (saved) {
        try {
            purchasedItems = JSON.parse(saved);
        } catch (e) {
            purchasedItems = {};
        }
    } else {
        purchasedItems = {};
    }
}

function savePurchasedItems() {
    localStorage.setItem('jarling_purchasedItems', JSON.stringify(purchasedItems));
}

function hasPurchasedItem(itemId) {
    return purchasedItems[itemId] === true;
}

// ========== MAĞAZA SİSTEMİ ==========

function openShop() {
    if (!isGameRunning) {
        console.log('Oyun çalışmıyor, mağaza açılamaz');
        return;
    }
    
    // totalScore'u yükle (emin olmak için)
    loadTotalScore();
    
    isShopOpen = true;
    const shopScreen = document.getElementById('shop-screen');
    if (shopScreen) {
        shopScreen.classList.remove('hidden');
        setTimeout(() => {
            shopScreen.classList.add('show');
        }, 10);
        updateShopUI();
    } else {
        console.error('Mağaza ekranı bulunamadı!');
    }
    // Oyunu duraklat (spawn döngüsünü durdur)
    if (spawnLoop) {
        clearInterval(spawnLoop);
        spawnLoop = null;
        console.log('Oyun duraklatıldı');
    }
}

function closeShop() {
    isShopOpen = false;
    const shopScreen = document.getElementById('shop-screen');
    if (shopScreen) {
        shopScreen.classList.remove('show');
        setTimeout(() => {
            shopScreen.classList.add('hidden');
        }, 300);
    }
    // Oyunu devam ettir (spawn döngüsünü yeniden başlat)
    // setTimeout ile biraz gecikme ekle ki animasyon tamamlansın
    setTimeout(() => {
        if (isGameRunning && !spawnLoop) {
            spawnLoop = setInterval(spawnEnemy, spawnRate);
            console.log('Oyun devam ediyor, spawn döngüsü başlatıldı');
        }
    }, 350);
}

function updateShopUI() {
    // Toplam skor gösterimi
    const totalScoreEl = document.getElementById('total-score-display');
    if (totalScoreEl) {
        totalScoreEl.textContent = totalScore.toFixed(2);
    }
    
    // Silahlar
    renderShopCategory('weapons-container', shopItems.weapons);
    
    // Can artırma
    renderShopCategory('health-container', shopItems.health);
    
    // Güçlendirmeler
    renderShopCategory('powerups-container', shopItems.powerups);
    
    console.log('Mağaza UI güncellendi, toplam skor:', totalScore);
}

function renderShopCategory(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    items.forEach(item => {
        const isPurchased = hasPurchasedItem(item.id);
        const canAfford = totalScore >= item.price && !isPurchased;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${isPurchased ? 'purchased' : ''}`;
        
        itemDiv.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-price">💰 ${item.price.toFixed(2)}</div>
            <button class="shop-btn" 
                    onclick="purchaseItem('${item.id}')" 
                    ${isPurchased ? 'disabled' : ''}
                    ${!canAfford && !isPurchased ? 'disabled' : ''}>
                ${isPurchased ? '✓ SATIN ALINDI' : 'Satın Al'}
            </button>
        `;
        
        container.appendChild(itemDiv);
    });
}

function canAfford(price) {
    return totalScore >= price;
}

function purchaseItem(itemId) {
    // Öğeyi bul
    let item = null;
    let category = null;
    
    for (const cat in shopItems) {
        const found = shopItems[cat].find(i => i.id === itemId);
        if (found) {
            item = found;
            category = cat;
            break;
        }
    }
    
    if (!item) {
        console.log('Öğe bulunamadı:', itemId);
        return;
    }
    
    // Zaten satın alınmış mı?
    if (hasPurchasedItem(itemId)) {
        console.log('Bu öğe zaten satın alınmış');
        return;
    }
    
    // Yeterli para var mı?
    if (!canAfford(item.price)) {
        alert('Yetersiz para! Gerekli: ' + item.price.toFixed(2) + ', Mevcut: ' + totalScore.toFixed(2));
        return;
    }
    
    // Satın al
    totalScore -= item.price;
    purchasedItems[itemId] = true;
    
    saveTotalScore();
    savePurchasedItems();
    updateShopUI();
    applyPurchasedItems();
    
    console.log('Satın alındı:', item.name);
}

function applyPurchasedItems() {
    // En yüksek seviye silahı bul ve uygula
    const weaponOrder = ['weapon_legendary', 'weapon_gold', 'weapon_iron', 'weapon_basic'];
    for (const weaponId of weaponOrder) {
        if (hasPurchasedItem(weaponId) || weaponId === 'weapon_basic') {
            currentWeapon = weaponId;
            const weapon = shopItems.weapons.find(w => w.id === weaponId);
            if (weapon) {
                const weaponImg = document.querySelector('.weapon');
                if (weaponImg) {
                    weaponImg.src = weapon.image;
                }
            }
            break;
        }
    }
    
    // Can artırma uygula
    let healthIncrease = 0;
    shopItems.health.forEach(healthItem => {
        if (hasPurchasedItem(healthItem.id)) {
            healthIncrease += healthItem.healthIncrease;
        }
    });
    maxHealth = 3 + healthIncrease;
    
    // Mevcut can'ı maxHealth'e ayarla (eğer daha yüksekse)
    if (health > maxHealth) {
        health = maxHealth;
    }
    
    // Güçlendirmeleri uygula
    attackSpeedMultiplier = 1.0;
    damageBonus = 0;
    
    if (hasPurchasedItem('powerup_fast_attack')) {
        attackSpeedMultiplier = 0.75;
    }
    
    if (hasPurchasedItem('powerup_strong_attack')) {
        damageBonus = 50;
    }
    
    // UI'ı güncelle
    updateUI();
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
    initGameVariables();
    loadTotalScore();
    loadPurchasedItems();
    applyPurchasedItems();
});

