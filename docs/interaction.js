// interaction.js

const repulsionRadius = 40;   // ヘッダーが細いので範囲を少し狭める
const repulsionStrength = 50;
const returnSpeed = 0.5;

const container = document.getElementById('ascii-container');
const characters = [];
const wordSpacing = 40; // 単語間のスペース(px)
const charWidth = 12;   // 1文字あたりの幅(px)

const mouse = {
    x: -9999,
    y: -9999,
};

// 表示する単語とリンク先(縦位置指定は廃止し、横並びで配置)
const isWorkPage = window.location.pathname.includes('/works/');
const pagePrefix = isWorkPage ? '../../' : '';

const words = [
    { text: 'Work', href: `${pagePrefix}index.html` },
    { text: 'About', href: `${pagePrefix}about me.html` },
];

function setupCharacters() {
    const containerRect = container.getBoundingClientRect();
    const centerY = containerRect.height / 2;

    let cursorX = 0; // 横方向の現在位置(累積)

    words.forEach(wordData => {
        let parentElement;

        if (wordData.href) {
            parentElement = document.createElement('a');
            parentElement.href = wordData.href;
        } else {
            parentElement = document.createElement('span');
        }

        const chars = wordData.text.split('');

        chars.forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.innerText = char;

            const homeX = cursorX + index * charWidth;
            const homeY = centerY; // 常にヘッダーの垂直中央に配置

            span.style.left = `${homeX}px`;
            span.style.top = `${homeY}px`;

            parentElement.appendChild(span);

            characters.push({
                element: span,
                homeX: homeX,
                homeY: homeY,
            });
        });

        container.appendChild(parentElement);

        // 次の単語の開始位置 = 現在の単語の幅 + スペース
        cursorX += chars.length * charWidth + wordSpacing;
    });

    setupSmoothScroll();
}

// マウスの動きを追跡する
container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

container.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
});

// アニメーションループ
function animate() {
    for (const char of characters) {
        const dx = char.homeX - mouse.x;
        const dy = char.homeY - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetX = 0;
        let targetY = 0;

        if (distance < repulsionRadius) {
            const angle = Math.atan2(dy, dx);
            const force = (repulsionRadius - distance) / repulsionRadius;

            targetX = mouse.x + Math.cos(angle) * repulsionRadius * force * 0.2;
            targetY = mouse.y + Math.sin(angle) * repulsionRadius * force * 0.2;

            targetX = Math.max(0, Math.min(container.clientWidth, targetX));
            targetY = Math.max(0, Math.min(container.clientHeight, targetY));

            const moveX = (targetX - char.homeX) * 0.5;
            const moveY = (targetY - char.homeY) * 0.5;

            char.element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        } else {
            char.element.style.transform = `translate(0, 0)`;
        }
    }

    requestAnimationFrame(animate);
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// --- 実行 ---
setupCharacters();
animate();