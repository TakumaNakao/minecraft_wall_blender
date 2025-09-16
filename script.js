document.addEventListener('DOMContentLoaded', () => {
    const blockInputsContainer = document.getElementById('block-inputs');
    const addBlockBtn = document.getElementById('add-block');
    const generateBtn = document.getElementById('generate-btn');
    const canvas = document.getElementById('wall-canvas');
    const ctx = canvas.getContext('2d');
    const wallWidthInput = document.getElementById('wall-width');
    const wallHeightInput = document.getElementById('wall-height');
    const drawBorderCheckbox = document.getElementById('draw-border-checkbox');
    const blockSize = 16; // 1ブロックのピクセルサイズ

    let lastWallData = null;

    // デフォルト画像とアップロードされた画像を格納
    const images = {};
    function createColorImage(name, color) {
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = blockSize;
        imgCanvas.height = blockSize;
        const imgCtx = imgCanvas.getContext('2d');
        imgCtx.fillStyle = color;
        imgCtx.fillRect(0, 0, blockSize, blockSize);
        
        const img = new Image();
        img.src = imgCanvas.toDataURL();
        images[name] = img;
    }

    createColorImage('red.png', '#F08080'); // lightcoral
    createColorImage('green.png', '#90EE90'); // lightgreen
    createColorImage('blue.png', '#87CEFA'); // lightskyblue

    let blockCount = 0;

    function addBlockInput(defaultName = '', defaultRatio = 1) {
        blockCount++;
        const blockDiv = document.createElement('div');
        blockDiv.classList.add('block-input');
        blockDiv.innerHTML = `
            <label for="block-type-${blockCount}">ブロック種類:</label>
            <input type="text" id="block-type-${blockCount}" placeholder="ファイル名 or red.png" value="${defaultName}">
            <label for="block-file-${blockCount}" class="file-label">画像を選択</label>
            <input type="file" id="block-file-${blockCount}" class="file-input" accept="image/*">
            <label for="block-ratio-${blockCount}">割合:</label>
            <input type="number" id="block-ratio-${blockCount}" value="${defaultRatio}" min="0">
        `;
        blockInputsContainer.appendChild(blockDiv);

        const fileInput = blockDiv.querySelector(`#block-file-${blockCount}`);
        const typeInput = blockDiv.querySelector(`#block-type-${blockCount}`);

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    images[file.name] = img;
                    typeInput.value = file.name;
                    console.log(`画像 ${file.name} をロードしました。`);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function drawWall() {
        if (!lastWallData) return;

        const { blocks, width, height } = lastWallData;
        const drawBorders = drawBorderCheckbox.checked;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const blockIndex = y * width + x;
                const blockType = blocks[blockIndex];
                const img = images[blockType];
                if (img && img.complete) {
                    ctx.drawImage(img, x * blockSize, y * blockSize, blockSize, blockSize);
                    if (drawBorders) {
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
                    }
                } else if (!img) {
                    console.warn(`画像 '${blockType}' が見つかりません。`);
                }
            }
        }
    }

    addBlockBtn.addEventListener('click', () => addBlockInput());
    drawBorderCheckbox.addEventListener('change', drawWall);

    generateBtn.addEventListener('click', () => {
        const wallWidth = parseInt(wallWidthInput.value, 10);
        const wallHeight = parseInt(wallHeightInput.value, 10);

        if (wallWidth <= 0 || wallHeight <= 0) {
            alert('幅と高さは1以上である必要があります。');
            return;
        }

        canvas.width = wallWidth * blockSize;
        canvas.height = wallHeight * blockSize;

        const blockRatios = [];
        let totalRatio = 0;
        const blockInputs = blockInputsContainer.querySelectorAll('.block-input');
        for (let i = 0; i < blockInputs.length; i++) {
            const input = blockInputs[i];
            const typeInput = input.querySelector(`input[id^="block-type-"]`);
            const ratioInput = input.querySelector(`input[id^="block-ratio-"]`);
            const type = typeInput.value;
            const ratio = parseInt(ratioInput.value, 10);
            
            if (type && ratio > 0) {
                blockRatios.push({ type, ratio });
                totalRatio += ratio;
            }
        }

        if (totalRatio === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            alert('ブロックの割合を1以上に設定してください。');
            lastWallData = null;
            return;
        }

        const totalBlocks = wallWidth * wallHeight;
        const wallBlocks = [];
        blockRatios.forEach(({ type, ratio }) => {
            const count = Math.round((ratio / totalRatio) * totalBlocks);
            for (let i = 0; i < count; i++) {
                wallBlocks.push(type);
            }
        });

        const mainBlock = blockRatios.sort((a, b) => b.ratio - a.ratio)[0].type;
        while (wallBlocks.length < totalBlocks) {
            wallBlocks.push(mainBlock);
        }
        while (wallBlocks.length > totalBlocks) {
            wallBlocks.pop();
        }

        for (let i = wallBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wallBlocks[i], wallBlocks[j]] = [wallBlocks[j], wallBlocks[i]];
        }

        lastWallData = {
            blocks: wallBlocks,
            width: wallWidth,
            height: wallHeight,
        };
        
        const imageTypes = [...new Set(wallBlocks.filter(type => images[type]))];
        let imagesToLoad = imageTypes.filter(type => !images[type].complete).length;

        if (imagesToLoad === 0) {
            drawWall();
        } else {
            imageTypes.forEach(type => {
                if (!images[type].complete) {
                    images[type].onload = () => {
                        imagesToLoad--;
                        if (imagesToLoad === 0) {
                            drawWall();
                        }
                    };
                }
            });
        }
    });

    addBlockInput('red.png', 1);
    addBlockInput('green.png', 1);
    addBlockInput('blue.png', 1);
});