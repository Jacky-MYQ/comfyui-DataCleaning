import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { $el } from "../../scripts/ui.js";

async function createCanvasWidget(node, widget, app) {

    // 添加全局样式
    const style = document.createElement('style');
    style.textContent = `
        .body {
            background: linear-gradient(to bottom, #404040, #383838);
            border-bottom: 1px solid #2a2a2a;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .h1 {
            text-align: center;
            flex-shrink: 0; /* 防止标题被压缩 */
        }

        .crop-settings {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #505050;
            border-radius: 5px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;  /* <--- 添加：让 flex 项目在主轴上居中 */
            position: relative; /* <--- 添加：为按钮的绝对定位（如果需要）或相对边距提供基础 */
            min-width: 600px;
            max-width: 90%;
            margin-left: auto;
            margin-right: auto;
        }

        /* 包裹输入框的容器样式 */
        .crop-inputs-wrapper {
            /* margin: 0 auto; */ /* <--- 移除此行，或改为 margin: 0; */
            white-space: nowrap; 
        }

        .crop-settings label {
            margin: 0 5px 0 15px; /* 调整间距 */
        }

        .crop-settings input[type="number"] {
            width: 60px;
            padding: 5px;
            margin-right: 5px;
        }
            
        #select-folder-button { 
            margin-right: auto;
            cursor: pointer;
            padding: 5px 10px; 
        }
        
        #save-img-button {
            margin-left: auto; /* <--- 修改这里：从 auto 改为一个固定值，例如 10px，以保持与前一个按钮的固定间距 */
            cursor: pointer;
            padding: 5px 10px;
        }

        #drop-zone {
            border: 3px dashed #ccc;
            /* padding: 40px; */ /* 移除固定 padding，改为 flex 内部处理 */
            text-align: center;
            background-color: #f0f0f0;
            padding: 25px; /* 保留内边距 */
            flex-grow: 1; /* 让 drop-zone 占据剩余的垂直空间 */
            display: flex; /* 内部也使用 Flexbox */
            flex-direction: column; /* 内部元素垂直排列 */
            /* align-items: center; */ /* 注释掉，让 image-container 水平撑满 */
            justify-content: flex-start; /* 从顶部开始排列 */
            overflow-y: auto; /* 如果内容超出，允许垂直滚动 */
            height: 100%;
        }

        #drop-zone p { /* 初始提示文字样式 */
            display: flex;
            margin: auto; /* 在 flex 容器中居中 */
            justify-content: center; /* 水平居中 */
            align-items: center; /* 垂直居中 */
            height: 100%;
            color: #888;
        }

        #image-container {
            display: flex; /* 保持 Flexbox 布局 */
            flex-wrap: wrap; /* 允许换行 */
            /* gap: 20px; */ /* 图片之间的间距 */
            row-gap: 85px; /* 图片上下间距 */
            column-gap: 20px; /* 图片左右间距 */
            justify-content: center; /* 居中显示图片项 */
            /* position: relative; */ /* 这个移到 .image-item-wrapper 了 */
            width: 100%; /* 让图片容器宽度撑满 drop-zone */
            height: 100%;
            /* flex-grow: 1; */ /* 不需要让它增长，内容决定高度 */
        }

        /* (可选) 裁剪框的拖动句柄样式 */
        .crop-handle {
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: white;
            border: 1px solid black;
            z-index: 3;
        }
    `;
    document.head.appendChild(style);


    const datacleaningInterface = 
    $el("div.body",{
        style: {
            position: "absolute",
            top: "0px",
            left: "10px",
            right: "10px",
            bottom: "10px",
            width: `calc(100% - 20px)`, //CSS 中的计算表达式
            higtht: `calc(100% - 20px)`,
            overflow: "auto"
        }
    },[
        $el("h1.h1",{textContent:"Data Cleaning"},[]),
        $el("div.crop-settings",{},[
            $el("div.crop-inputs-wrapper",{},[
                //for="crop-width"关联了id为crop-width的宽度输入框，这样点击"裁剪宽度:"文字时，输入框就会获得焦点
                $el("label", {for: "crop-width", textContent: "crop width:"}, []),
                $el("input", {type: "number", value: "300", id: "crop-width"}, []),
                $el("label", {for: "crop-height", textContent: "crop height:"}, []),
                $el("input", {type: "number", value: "200", id: "crop-height"}, [])
            ]),
            $el("button", {id: "select-folder-button", textContent: "select images"}, []),
            $el("input", {type: "file", id: "folder-input", multiple: true, accept: "image/jpeg,image/png,image/jpg", style: {display: "none"}}, []),
            $el("button", {id: "save-img-button", textContent: "save images"}, []),
        ]),
        $el("div", {id: "drop-zone"},[
            $el("p", {textContent: "Drag the picture here    or   click the button above to select the picture"},[]),
            $el("div", {id: "image-container"},[])
        ])
    ])

    // 创建一个包含控制面板和画布的容器
    const mainContainer = $el("div.painterMainContainer", {
        style: {
            position: "relative",
            width: "100%",
            height: "100%"
        }
    }, [datacleaningInterface]); //}, [controlPanel, canvasContainer]);

    // 将主容器添加到节点，将一个包含了控制面板和画布的自定义 HTML 结构 ( mainContainer ) 作为一个小部件（widget）集成到当前 ComfyUI 节点的界面中。
    //.addDOMWidget(...) :
    // 这是 ComfyUI 前端 API 为自定义节点提供的一个方法。
    // 它允许开发者将自定义的 HTML 内容（DOM 元素）添加到节点的图形界面中。这意味着你可以在节点内部显示不仅仅是标准的输入/输出框，还可以嵌入更复杂的交互式界面。
    const mainWidget = node.addDOMWidget("mainContainer", "widget", mainContainer);

    // 设置节点的默认大小
    node.size = [1000, 1000]; // 设置初始大小为正方形
    
    // 修改节点大小调整逻辑
    // `onResize`通常是LiteGraph节点的内置事件处理函数，当节点大小改变时触发
    // node.onResize主要处理节点整体的尺寸变化，调整画布容器的大小和位置。
    // 而onresize监听器则是针对控制面板内部元素的高度变化，比如按钮换行导致面板高度改变时，动态调整画布容器的top位置，防止重叠
    node.onResize = function() {
        const minSize = 1000;
        
        // 保持节点宽度，高度根据画布比例调整
        const width = Math.max(this.size[0], minSize);
        const height = Math.max(this.size[1], minSize);
        
        this.size[0] = width; //comfyui当前节点的宽度
        this.size[1] = height;
        
        //在创建画布容器时使用的绝对定位样式（position: "absolute"），会继承父容器（节点）的尺寸，所以不用在这里显示设定其大小
        // if (datacleaningInterface) {
        //     datacleaningInterface.style.width = width + "px";
        //     datacleaningInterface.style.height = height + "px";
        // }
    };
}


app.registerExtension({
    name: "Comfy.CleanData",
    
    //在nodeType参数中传递的对象本质上充当了所有将创建此类型的节点的模板.
    // nodeData是Python代码中定义的节点方面的封装，例如其类别，输入和输出。app是对主Comfy应用对象的引用（您已经导入了该对象！）
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === "CleanData") { //CanvasNode是启动该节点的py类
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = async function() {

                //this 指向 节点实例（即 CanvasNode 类型的节点对象），该实例是通过框架（如 ComfyUI）在创建节点时自动生成的。
                const r = onNodeCreated?.apply(this, arguments); 
                //widgets 数组中，查找第一个 name 属性等于 "canvas_image" 的控件（widget）对象
                const widget = this.widgets.find(w => w.name === "save_img_path"); //widget.value是canvas_image.png,所以可以通过this.widgets.find()来将python的值传递到这
                await createCanvasWidget(this, widget, app);

                //------------------------分割线--------------------------
                //下面创建的控件不支持在上面的style里修改css格式，也不支持下面这样添加css样式
                // const style1 = document.createElement('style');
                // style1.textContent = ``;
                // document.head.appendChild(style1);

                const dropZone = document.getElementById('drop-zone');
                const imageContainer = document.getElementById('image-container');
                // 获取裁剪尺寸输入框
                const cropWidthInput = document.getElementById('crop-width');
                const cropHeightInput = document.getElementById('crop-height');
                
                // 定义最大显示尺寸阈值和目标尺寸
                const MAX_DISPLAY_DIMENSION = 300;
                
                // --- 拖放事件处理 --- (保持不变)
                
                // 阻止默认行为，允许放置
                dropZone.addEventListener('dragover', (event) => {
                    event.preventDefault();
                    dropZone.classList.add('dragover'); // 添加视觉反馈
                });
                
                // 移除视觉反馈
                dropZone.addEventListener('dragleave', () => {
                    dropZone.classList.remove('dragover');
                });
                
                // 处理放置的文件
                dropZone.addEventListener('drop', (event) => {
                    event.preventDefault(); // 阻止浏览器默认打开文件
                    dropZone.classList.remove('dragover');
                
                    const files = event.dataTransfer.files; // 获取拖放的文件列表
                
                    if (files.length > 0) {
                        // 隐藏提示文字
                        const dropZoneText = dropZone.querySelector('p');
                        if (dropZoneText) {
                            dropZoneText.style.display = 'none';
                        }
                    }
                
                    for (const file of files) {
                        if (file.type.startsWith('image/')) { // 检查是否是图片文件
                            processImageFile(file);
                        } else {
                            console.warn(`文件 "${file.name}" 不是图片，已跳过。`);
                        }
                    }
                });
                
                // --- 图片处理函数 ---
                
                // 获取新添加的元素
                const selectFolderButton = document.getElementById('select-folder-button');
                const folderInput = document.getElementById('folder-input');
                
                // --- 文件夹选择逻辑 --- 
                
                // 点击按钮时触发隐藏的文件输入框
                selectFolderButton.addEventListener('click', () => {
                    folderInput.click();
                });
                
                // 处理文件夹选择后的文件
                folderInput.addEventListener('change', (event) => {
                    const files = event.target.files; // 获取选定文件夹中的所有文件
                
                    if (files.length > 0) {
                        // 隐藏提示文字 (如果还显示的话)
                        const dropZoneText = dropZone.querySelector('p');
                        if (dropZoneText && dropZoneText.style.display !== 'none') {
                            dropZoneText.style.display = 'none';
                        }
                    }
                
                    let imageFound = false;
                    for (const file of files) {
                        // 检查文件类型是否为支持的图片格式
                        if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg') {
                            processImageFile(file); // 使用现有的函数处理图片文件
                            imageFound = true;
                        } else {
                            // 可以选择性地忽略非图片文件或给出提示
                            // console.log(`忽略非图片文件: ${file.name}`);
                        }
                    }
                
                    if (!imageFound && files.length > 0) {
                        console.warn("选择的文件夹中未找到支持的图片文件 (jpg, jpeg, png)。");
                        // 如果没有找到图片，可以考虑是否恢复提示文字
                    }
                
                    // 重置 input 的值，以便用户可以再次选择同一个文件夹（如果需要）
                    folderInput.value = null; 
                });
                
                //-----------------------------save all img----------------------
                
                const saveAllImgButton = document.getElementById("save-img-button");
                saveAllImgButton.addEventListener('click', async () => { 
                    if (!cropWidthInput || !cropHeightInput) {
                        alert("无法找到裁剪宽度或高度输入框。");
                        return;
                    }
                
                    const targetSaveWidth = parseInt(cropWidthInput.value, 10);
                    const targetSaveHeight = parseInt(cropHeightInput.value, 10);
                
                    if (isNaN(targetSaveWidth) || targetSaveWidth <= 0 || isNaN(targetSaveHeight) || targetSaveHeight <= 0) {
                        alert("请输入有效的全局保存宽度和高度。");
                        return;
                    }
                
                    const imageContainer = document.getElementById('image-container');
                    if (!imageContainer) {
                        alert("无法找到图片容器。");
                        return;
                    }
                    const imageWrappers = imageContainer.querySelectorAll('.image-item-wrapper');
                
                    if (imageWrappers.length === 0) {
                        alert("没有图片可保存。");
                        return;
                    }
                
                    let allSuccessful = true;
                    let filesProcessed = 0;
                    let errorsEncountered = [];
                
                    for (const wrapper of imageWrappers) {
                        let originalFileNameForError = "未知图片"; 
                        try {
                            const originalImage = wrapper.querySelector('img');
                            const cropBox = wrapper.querySelector('.crop-box');
                            const fileNameElement = wrapper.querySelector('span'); // Filename is in a span
                
                            let baseName = `cropped_image_${Date.now()}`;
                            let extension = 'png'; // Default to png
                
                            if (fileNameElement && fileNameElement.textContent) {
                                const fullFileName = fileNameElement.textContent.trim();
                                originalFileNameForError = fullFileName;
                                const lastDotIndex = fullFileName.lastIndexOf('.');
                                if (lastDotIndex !== -1 && lastDotIndex > 0) { 
                                    baseName = fullFileName.substring(0, lastDotIndex);
                                    extension = fullFileName.substring(lastDotIndex + 1).toLowerCase();
                                    // Keep original extension if supported, otherwise default to png
                                    if (!['png', 'jpeg', 'jpg'].includes(extension)) {
                                        console.warn(`Unsupported extension "${extension}" for file ${fullFileName}, defaulting to png for saving.`);
                                        extension = 'png';
                                    }
                                } else {
                                    baseName = fullFileName; 
                                }
                            }
                            // Construct a new filename for the saved cropped image, including target dimensions
                            const finalFileName = `${baseName}_cropped_${targetSaveWidth}x${targetSaveHeight}.${extension}`;
                
                            if (!originalImage) {
                                console.warn(`跳过 ${originalFileNameForError}，缺少图像元素。`, wrapper);
                                errorsEncountered.push(`${originalFileNameForError}: 缺少图像元素`);
                                allSuccessful = false;
                                continue;
                            }
                            if (!cropBox) {
                                console.warn(`跳过 ${originalFileNameForError}，缺少裁剪框元素。`, wrapper);
                                errorsEncountered.push(`${originalFileNameForError}: 缺少裁剪框元素`);
                                allSuccessful = false;
                                continue;
                            }
                
                            const displayImgWidth = parseFloat(wrapper.dataset.displayWidth);
                            const displayImgHeight = parseFloat(wrapper.dataset.displayHeight);
                
                            if (isNaN(displayImgWidth) || displayImgWidth <= 0 || isNaN(displayImgHeight) || displayImgHeight <= 0) {
                                console.warn(`跳过 ${originalFileNameForError}，其显示尺寸无效。`, wrapper);
                                errorsEncountered.push(`${originalFileNameForError}: 显示尺寸无效`);
                                allSuccessful = false;
                                continue;
                            }
                
                            const cropX = parseFloat(cropBox.style.left) || 0;
                            const cropY = parseFloat(cropBox.style.top) || 0;
                            const cropW = parseFloat(cropBox.style.width);
                            const cropH = parseFloat(cropBox.style.height);
                
                            if (isNaN(cropW) || cropW <= 0 || isNaN(cropH) || cropH <= 0) {
                                console.warn(`跳过 ${originalFileNameForError}，其裁剪框尺寸无效 (W: ${cropBox.style.width}, H: ${cropBox.style.height}).`, wrapper);
                                errorsEncountered.push(`${originalFileNameForError}: 裁剪框尺寸无效`);
                                allSuccessful = false;
                                continue;
                            }
                
                            const scaleFactorX = originalImage.naturalWidth / displayImgWidth;
                            const scaleFactorY = originalImage.naturalHeight / displayImgHeight;
                
                            const sourceX = cropX * scaleFactorX;
                            const sourceY = cropY * scaleFactorY;
                            const sourceWidth = cropW * scaleFactorX;
                            const sourceHeight = cropH * scaleFactorY;
                
                            if (sourceWidth <= 0 || sourceHeight <= 0) {
                                console.warn(`跳过 ${originalFileNameForError}，计算得到的源裁剪尺寸无效 (W: ${sourceWidth}, H: ${sourceHeight}).`);
                                errorsEncountered.push(`${originalFileNameForError}: 计算得到的源裁剪尺寸无效`);
                                allSuccessful = false;
                                continue;
                            }
                
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = targetSaveWidth;
                            tempCanvas.height = targetSaveHeight;
                            const tempCtx = tempCanvas.getContext('2d');
                
                            // Draw the cropped and scaled image onto the temporary canvas
                            tempCtx.drawImage(
                                originalImage,
                                sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
                                0, 0, targetSaveWidth, targetSaveHeight    // Destination rectangle
                            );
                
                            // Get image data as Base64
                            // Use appropriate image type based on original extension if possible
                            let mimeType = 'image/png';
                            if (extension === 'jpeg' || extension === 'jpg') {
                                mimeType = 'image/jpeg';
                            }
                            const imageDataUrl = tempCanvas.toDataURL(mimeType, 0.9); // 0.9 quality for JPEG
                            const base64ImageData = imageDataUrl.split(',')[1];
                
                            // 获取 save_img_path 控件的值
                            // 假设 'this.widgets' 或 'node.widgets' 在当前作用域可用
                            // 如果此事件监听器在 onNodeCreated 内部或其调用的函数中，'this' 通常指向节点实例
                            let saveDirectory = "default_output_path"; // 提供一个默认值
                            try {
                                // 尝试从节点实例的widgets中找到 save_img_path
                                // 'this' 可能指向当前节点实例，具体取决于此代码块的上下文
                                // 如果 'this' 不是节点实例，您可能需要通过其他方式传递节点实例或其widgets
                                const savePathWidget = this.widgets.find(w => w.name === "save_img_path");
                                if (savePathWidget && savePathWidget.value) {
                                    saveDirectory = savePathWidget.value;
                                } else {
                                    alert("未能获取到 'save_img_path' 控件的值，将使用默认路径或操作可能失败。");
                                    // 可以选择在这里 return，或者让后端处理路径问题
                                }
                            } catch (e) {
                                console.error("获取 save_img_path 控件时出错:", e);
                                alert("获取保存路径控件时出错，请检查控制台。");
                                // return; // 阻止继续执行
                            }
                
                            if (!saveDirectory || saveDirectory.trim() === "" || saveDirectory === "Set your path here!") {
                                alert("set a valid save img path in 'save_img_path' !");
                                // alert("请在节点的 'save_img_path' 输入框中设置一个有效的保存路径。");
                                return;
                            }
                
                            // Send to backend
                            try {
                                const response = await fetch('/save_cropped_image_yc', { // API endpoint (修改了名称以避免冲突)
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        image_data: base64ImageData,
                                        file_name: finalFileName,
                                        original_file_type: mimeType,
                                        save_directory: saveDirectory // <--- 添加这一行
                                    }),
                                });
                                const result = await response.json();
                                if (response.ok && result.success) {
                                    console.log(`图片 ${finalFileName} 保存成功: ${result.message}`);
                                    filesProcessed++;
                                } else {
                                    console.error(`保存图片 ${finalFileName} 失败: ${result.error || '未知错误'}`);
                                    errorsEncountered.push(`${finalFileName}: ${result.error || '保存失败'}`);
                                    allSuccessful = false;
                                }
                            } catch (apiError) {
                                console.error(`调用保存 API 时出错 (${finalFileName}):`, apiError);
                                errorsEncountered.push(`${finalFileName}: API调用失败 - ${apiError.message}`);
                                allSuccessful = false;
                            }
                
                        } catch (error) {
                            console.error(`处理图片 ${originalFileNameForError} 时发生错误:`, error);
                            errorsEncountered.push(`${originalFileNameForError}: 处理时发生错误 - ${error.message}`);
                            allSuccessful = false;
                        }
                    }
                
                    // Final feedback to user
                    if (allSuccessful && imageWrappers.length > 0) {
                        alert(`All ${imageWrappers.length} images save successfully!`);
                        // alert(`所有 ${imageWrappers.length} 张图片已成功发送到后端进行保存！`);
                    } else if (filesProcessed > 0) {
                        alert(`${filesProcessed} images save successfully，but ${errorsEncountered.length} mistakes have happened。\nError Message:\n${errorsEncountered.join('\n')}`);
                        // alert(`${filesProcessed} 张图片已成功发送到后端，但有 ${errorsEncountered.length} 个错误发生。\n错误详情:\n${errorsEncountered.join('\n')}`);
                    } else if (imageWrappers.length > 0) {
                        alert(`All the images failed to be saved.\nError Message:\n${errorsEncountered.join('\n')}`);
                        // alert(`所有图片保存失败。\n错误详情:\n${errorsEncountered.join('\n')}`);
                    } else {
                        // This case should ideally be caught earlier
                        alert("No images are processed.");
                        // alert("没有图片被处理。");
                    }
                });
                
                //-----------------------------save all img--------------------

                                
                // --- 图片处理函数 processImageFile (保持不变) ---
                function processImageFile(file) {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            let displayWidth = img.naturalWidth;
                            let displayHeight = img.naturalHeight;
                            const widthDim = displayWidth;

                            // --- 图片缩放逻辑 (保持不变) ---
                            const scaleRatio = MAX_DISPLAY_DIMENSION / widthDim;
                            displayWidth = Math.round(displayWidth * scaleRatio);
                            displayHeight = Math.round(displayHeight * scaleRatio);
                            console.log(`图片 "${file.name}" 原尺寸 ${img.naturalWidth}x${img.naturalHeight}，已缩放至 ${displayWidth}x${displayHeight}`);
                            // --- 缩放结束 ---

                            // --- 创建 DOM 结构 (保持不变) ---
                            const wrapper = document.createElement('div');
                            wrapper.className = 'image-item-wrapper';
                            wrapper.style.width = `${displayWidth}px`;
                            wrapper.style.height = `${displayHeight}px`;
                            wrapper.style.position = 'relative';
                            wrapper.style.display = 'block';
                            wrapper.style.marginBottom = '70 px';
                            wrapper.dataset.displayWidth = displayWidth;
                            wrapper.dataset.displayHeight = displayHeight;

                            img.width = displayWidth;
                            img.height = displayHeight;
                            img.style.display = 'block';
                            img.style.maxWidth = '100%';
                            img.style.height = 'auto';
                            img.style.userSelect = 'none'; //防止拖动时选中图片
                            wrapper.appendChild(img);

                            const canvas = document.createElement('canvas'); //裁剪框
                            canvas.width = displayWidth;
                            canvas.height = displayHeight;
                            canvas.className = 'crop-overlay';
                            canvas.style.position = 'absolute';
                            canvas.style.top = '0';
                            canvas.style.left = '0';
                            canvas.style.width = '100%';
                            canvas.style.height = '100%';
                            canvas.style.pointerEvents = 'none'; // 确保鼠标事件不会穿透到图片上
                            canvas.style.zIndex = '1'; // 确保裁剪框在图片上方
                            const ctx = canvas.getContext('2d');
                            wrapper.appendChild(canvas);

                            const cropBox = document.createElement('div'); //裁剪框本身
                            cropBox.className = 'crop-box'; 
                            cropBox.style.position = 'absolute';
                            cropBox.style.border = '2px solid white';
                            cropBox.style.boxSizing = 'border-box';
                            cropBox.style.cursor = 'move'; //鼠标悬停时显示移动光标 
                            cropBox.style.zIndex = '2'; // 确保裁剪框在图片上方
                            wrapper.appendChild(cropBox);
                            // --- DOM 结构结束 ---

                            // --- 裁剪框状态和绘制逻辑 ---
                            let cropState = {
                                x: 0,
                                y: 0,
                                width: 512, // Initial placeholder, will be set by updateCropSize
                                height: 512, // Initial placeholder
                                isDragging: false,
                                startX: 0,
                                startY: 0,
                                initialX: 0,
                                initialY: 0
                            };

                            // 绘制覆盖层和裁剪框样式的函数 (保持不变)
                            function drawOverlayAndCropBox() {
                                // 1. 更新裁剪框位置和大小
                                cropBox.style.left = `${cropState.x}px`;
                                cropBox.style.top = `${cropState.y}px`;
                                cropBox.style.width = `${cropState.width}px`;
                                cropBox.style.height = `${cropState.height}px`;

                                // 2. 绘制 Canvas 覆盖层 (保持不变)
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                                ctx.fillRect(0, 0, canvas.width, cropState.y);
                                ctx.fillRect(0, cropState.y + cropState.height, canvas.width, canvas.height - (cropState.y + cropState.height));
                                ctx.fillRect(0, cropState.y, cropState.x, cropState.height);
                                ctx.fillRect(cropState.x + cropState.width, cropState.y, canvas.width - (cropState.x + cropState.width), cropState.height);
                            }

                            // --- 裁剪框拖动逻辑 (保持不变) ---
                            cropBox.addEventListener('mousedown', (e) => {
                                cropState.isDragging = true;
                                cropState.startX = e.clientX;
                                cropState.startY = e.clientY;
                                cropState.initialX = cropState.x;
                                cropState.initialY = cropState.y;
                                cropBox.style.cursor = 'grabbing';
                                e.preventDefault();
                            });

                            document.addEventListener('mousemove', (e) => {
                                if (!cropState.isDragging) return;
                                const dx = e.clientX - cropState.startX;
                                const dy = e.clientY - cropState.startY;
                                let newX = cropState.initialX + dx;
                                let newY = cropState.initialY + dy;
                                newX = Math.max(0, Math.min(newX, displayWidth - cropState.width));
                                newY = Math.max(0, Math.min(newY, displayHeight - cropState.height));
                                cropState.x = newX;
                                cropState.y = newY;
                                drawOverlayAndCropBox();
                            });

                            document.addEventListener('mouseup', () => {
                                if (cropState.isDragging) {
                                    cropState.isDragging = false;
                                    cropBox.style.cursor = 'move';
                                }
                            });
                            document.addEventListener('mouseleave', () => {
                                if (cropState.isDragging) {
                                    cropState.isDragging = false;
                                    cropBox.style.cursor = 'move';
                                }
                            });
                            // --- 拖动逻辑结束 ---

                            // --- 更新裁剪框尺寸的逻辑 (核心修改) ---
                            function updateCropSize() {
                                const targetWidth = parseInt(cropWidthInput.value, 10);
                                const targetHeight = parseInt(cropHeightInput.value, 10);

                                // 基本验证
                                if (isNaN(targetWidth) || targetWidth <= 0 || isNaN(targetHeight) || targetHeight <= 0) {
                                    console.warn("请输入有效的正数裁剪尺寸比例。");
                                    // 可以选择不更新，或者使用默认值，这里我们不更新
                                    // 如果需要默认值，可以在这里设置 cropState.width/height 并调用 draw
                                    return; 
                                }

                                const targetRatio = targetWidth / targetHeight;
                                const imageRatio = displayWidth / displayHeight;

                                let newWidth, newHeight;

                                if (imageRatio > targetRatio) {
                                    // 图片比目标比例宽，以高为基准
                                    newHeight = displayHeight;
                                    newWidth = displayHeight * targetRatio;
                                } else {
                                    // 图片比目标比例高或比例相同，以宽为基准
                                    newWidth = displayWidth;
                                    newHeight = displayWidth / targetRatio;
                                }

                                // 四舍五入
                                newWidth = Math.round(newWidth);
                                newHeight = Math.round(newHeight);

                                // 确保尺寸至少为1像素，并防止计算错误导致超出边界（理论上不应发生）
                                newWidth = Math.max(1, Math.min(newWidth, displayWidth));
                                newHeight = Math.max(1, Math.min(newHeight, displayHeight));

                                cropState.width = newWidth;
                                cropState.height = newHeight;

                                // 重新居中
                                cropState.x = Math.max(0, (displayWidth - newWidth) / 2);
                                cropState.y = Math.max(0, (displayHeight - newHeight) / 2);

                                drawOverlayAndCropBox();
                            }

                            // 监听输入框变化
                            cropWidthInput.addEventListener('change', updateCropSize);
                            cropHeightInput.addEventListener('change', updateCropSize);

                            // --- 添加文件名和删除按钮 (保持不变) ---
                            const p = document.createElement('span'); //文件名不能用<p>,不然会占一大截画面空间？
                            p.textContent = file.name;
                            p.style.marginTop = '5px';
                            p.style.textAlign = 'center';
                            p.style.fontSize = '0.9em';
                            p.style.color = 'black';
                            p.style.display = 'block'; //它会尝试占据父元素 wrapper 的全部可用宽度。这为文本换行提供了必要的宽度限制
                            p.style.overflowWrap = 'break-word'; //如果一个单词本身太长而无法适应容器宽度，那么可以在单词内部的任意位置进行断开换行，以防止文本溢出
                            wrapper.appendChild(p);

                            const deleteButton = document.createElement('button');
                            deleteButton.textContent = 'delete';
                            // 移除单独的 display: block 和 margin: auto
                            deleteButton.onclick = () => {
                                imageContainer.removeChild(wrapper);
                                // updateCropInputLimits();
                            };
                            // wrapper.appendChild(deleteButton); // 稍后添加到按钮组

                            // --- 新增：保存裁剪图片按钮 ---
                            const saveButton = document.createElement('button');
                            saveButton.textContent = 'save';
                            // 移除单独的 display: block 和 margin: auto
                            // saveButton.style.display = 'block'; // 移除
                            // saveButton.style.margin = '5px auto 0'; // 移除

                            // 创建一个容器来并排放置按钮
                            const buttonGroup = document.createElement('div');
                            buttonGroup.style.display = 'flex'; // 设置为flex布局
                            buttonGroup.style.justifyContent = 'center'; // 按钮组居中（如果按钮未填满空间）
                            buttonGroup.style.gap = '10px'; // 按钮之间的间距
                            buttonGroup.style.marginTop = '5px'; // 按钮组的顶部外边距

                            buttonGroup.appendChild(deleteButton); // 将删除按钮添加到按钮组
                            buttonGroup.appendChild(saveButton);   // 将保存按钮添加到按钮组

                            wrapper.appendChild(buttonGroup); // 将按钮组添加到主包装器
                            saveButton.onclick = () => {
                                const targetSaveWidth = parseInt(cropWidthInput.value, 10);
                                const targetSaveHeight = parseInt(cropHeightInput.value, 10);

                                if (isNaN(targetSaveWidth) || targetSaveWidth <= 0 || isNaN(targetSaveHeight) || targetSaveHeight <= 0) {
                                    alert("Please enter valid width and height. ");
                                    // alert("请输入有效的保存宽度和高度。");
                                    return;
                                }

                                // img 是当前 wrapper 内的原始图片对象
                                const originalImage = img; 
                                
                                // 从 wrapper 的 dataset 获取显示尺寸
                                const displayImgWidth = parseFloat(wrapper.dataset.displayWidth);
                                const displayImgHeight = parseFloat(wrapper.dataset.displayHeight);

                                if (isNaN(displayImgWidth) || isNaN(displayImgHeight) || displayImgWidth <= 0 || displayImgHeight <= 0) {
                                    alert("无法获取图片的显示尺寸，无法保存。");
                                    return;
                                }

                                // 计算裁剪区域在原始图片上的坐标和尺寸
                                // cropState.x, cropState.y, cropState.width, cropState.height 是相对于缩放后的显示图片的
                                const scaleFactorX = originalImage.naturalWidth / displayImgWidth;
                                const scaleFactorY = originalImage.naturalHeight / displayImgHeight;

                                const sourceX = cropState.x * scaleFactorX;
                                const sourceY = cropState.y * scaleFactorY;
                                const sourceWidth = cropState.width * scaleFactorX;
                                const sourceHeight = cropState.height * scaleFactorY;

                                // 创建临时 canvas 用于绘制和导出
                                const tempCanvas = document.createElement('canvas');
                                tempCanvas.width = targetSaveWidth;
                                tempCanvas.height = targetSaveHeight;
                                const tempCtx = tempCanvas.getContext('2d');

                                // 绘制裁剪区域到临时 canvas，并缩放到目标保存尺寸
                                tempCtx.drawImage(
                                    originalImage,    // 源图像
                                    sourceX,          // 源图像裁剪区域的 x 坐标
                                    sourceY,          // 源图像裁剪区域的 y 坐标
                                    sourceWidth,      // 源图像裁剪区域的宽度
                                    sourceHeight,     // 源图像裁剪区域的高度
                                    0,                // 目标画布上的 x 坐标
                                    0,                // 目标画布上的 y 坐标
                                    targetSaveWidth,  // 目标画布上的宽度 (即保存宽度)
                                    targetSaveHeight  // 目标画布上的高度 (即保存高度)
                                );

                                // 将 canvas 内容转换为 data URL
                                const dataURL = tempCanvas.toDataURL('image/png'); // 或者 'image/jpeg'

                                // 创建下载链接并触发下载
                                const link = document.createElement('a');
                                link.href = dataURL;
                                
                                // --- 您可以在这里定义图片保存的默认文件名 ---
                                // 例如，基于原始文件名和裁剪尺寸
                                const originalFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                                link.download = `${originalFileName}_cropped_${targetSaveWidth}x${targetSaveHeight}.png`; 
                                // --- 图片保存地址/文件名标记结束 ---

                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);

                                console.log(`图片 "${file.name}" 的裁剪区域已准备保存为 ${link.download}，尺寸 ${targetSaveWidth}x${targetSaveHeight}`);
                            };
                            // wrapper.appendChild(saveButton); // Already added to buttonGroup
                            // --- 保存按钮结束 ---

                            

                            // 将完整的 wrapper 添加到 imageContainer
                            imageContainer.appendChild(wrapper);

                            // --- 初始设置裁剪框 --- 
                            updateCropSize(); // 使用 updateCropSize 来设置初始状态
                            // (不再需要 drawOverlayAndCropBox() 在这里单独调用，updateCropSize内部会调用)
                        };

                        img.onerror = () => {
                            console.error(`无法加载图片: ${file.name}`);
                            alert(`Failed to load the image: ${file.name}. Please check your file.`);
                            // alert(`无法加载图片: ${file.name}。请检查文件是否损坏或格式是否正确。`);
                        };
                        img.src = e.target.result;
                    };

                    reader.onerror = (error) => {
                        console.error("FileReader 读取文件失败:", error);
                        alert(`Failed to read the file: "${file.name}"`);
                        // alert(`读取文件 "${file.name}" 失败。`);
                    };
                    reader.readAsDataURL(file);
                }
                
                // (可选) 添加全局事件监听器，当输入框的值改变时，更新所有已存在图片的裁剪框
                function updateAllCropBoxes() {
                    const wrappers = imageContainer.querySelectorAll('.image-item-wrapper');
                    wrappers.forEach(wrapper => {
                        // 这里需要一种方式来重新触发每个 wrapper 内部的 updateCropSize
                        // 这需要更复杂的结构，比如将 cropState 和相关函数与 wrapper 关联起来
                        // 简单起见，此示例中仅在新图片加载时和对应输入框改变时更新
                        console.warn('全局更新裁剪框的功能在此简化示例中未完全实现');
                    });
                }
                // cropWidthInput.addEventListener('change', updateAllCropBoxes);
                // cropHeightInput.addEventListener('change', updateAllCropBoxes);

                // --- 确保 updateCropInputLimits 函数定义在全局作用域 --- 
                function updateCropInputLimits() {
                    const remainingWrappers = imageContainer.querySelectorAll('.image-item-wrapper');
                    let minWidth = Infinity;
                    let minHeight = Infinity;
                    let hasImages = remainingWrappers.length > 0;

                    if (hasImages) {
                        remainingWrappers.forEach(w => {
                            // 从 dataset 读取存储的尺寸
                            const wWidth = parseInt(w.dataset.displayWidth, 10);
                            const wHeight = parseInt(w.dataset.displayHeight, 10);
                            if (!isNaN(wWidth)) {
                                minWidth = Math.min(minWidth, wWidth);
                            }
                            if (!isNaN(wHeight)) {
                                minHeight = Math.min(minHeight, wHeight);
                            }
                        });

                        // 确保最小值不是 Infinity (如果所有图片都没有有效尺寸)
                        minWidth = minWidth === Infinity ? 512 : minWidth; // 使用默认值或进行错误处理
                        minHeight = minHeight === Infinity ? 512 : minHeight;

                        // 更新输入框的 max 属性
                        cropWidthInput.max = minWidth;
                        cropHeightInput.max = minHeight;

                        // 检查当前值是否超过新的最大值，如果超过则修正
                        let currentCropWidth = parseInt(cropWidthInput.value, 10);
                        let currentCropHeight = parseInt(cropHeightInput.value, 10);
                        let needsUpdate = false;

                        if (currentCropWidth > minWidth) {
                            cropWidthInput.value = minWidth;
                            needsUpdate = true;
                        }
                        if (currentCropHeight > minHeight) {
                            cropHeightInput.value = minHeight;
                            needsUpdate = true;
                        }

                        // 如果修正了输入框的值，理想情况下应触发所有现有裁剪框的更新
                        // 在此简化版本中，我们仅更新输入框的值和 max 属性
                        if (needsUpdate) {
                            console.warn("裁剪尺寸已调整以适应最小图片。如果 change 事件未触发，可能需要手动更新裁剪框。");
                            // 理想情况下，这里应该调用一个函数来更新所有现存的 cropBox
                            // updateAllExistingCropBoxes();
                        }

                    } else {
                        // 没有图片了，移除限制并重置输入框值
                        cropWidthInput.removeAttribute('max');
                        cropHeightInput.removeAttribute('max');
                        cropWidthInput.value = 512; // 重置为默认值
                        cropHeightInput.value = 512; // 重置为默认值

                        // 显示提示文字
                        const dropZoneText = dropZone.querySelector('p');
                        if (dropZoneText) {
                            dropZoneText.style.display = 'block';
                        }
                    }
                }

                // (可选) 添加全局事件监听器...
                updateCropInputLimits(); // 初始化限制
                
            
                //------------------------分割线--------------------------
                return r;
            };
        }
    }
});


