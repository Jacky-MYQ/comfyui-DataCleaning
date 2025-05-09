import os
import base64
import io
from PIL import Image
import folder_paths
import traceback
import time 
from server import PromptServer # ComfyUI 的 PromptServer
from aiohttp import web # aiohttp 用于 web 响应

class CleanData:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            # "required":{
            #     "save_img_path": ("STRING", {"default": "Set your path here!"})
            # },
            "optional":{
                "save_img_path": ("STRING", {"default": "Set your path here!"}), # 如果不需要可以移除
            }
        }
    RETURN_TYPES = ()
    FUNCTION = "dataclean"
    CATEGORY = "Clean Data"
    OUTPUT_NODE = True # 对于主要进行UI交互或副作用的节点，通常设为True

    def dataclean(self, save_img_path):
        print(f"CleanData node executed. save_img_path: {save_img_path}")
        # 此方法现在主要用于触发UI，实际保存操作由API处理
        return ()

    @classmethod
    def setup_routes(cls):
        print(f"Attempting to setup routes for CleanData. PromptServer.instance: {PromptServer.instance}")
        if PromptServer.instance is None:
            print("ERROR in CleanData.setup_routes: PromptServer.instance is None.")
            # traceback.print_stack() # 可选：打印调用栈
            return

        if not hasattr(PromptServer.instance, 'routes'):
            print(f"ERROR in CleanData.setup_routes: PromptServer.instance (type: {type(PromptServer.instance)}) does not have 'routes' attribute.")
            # print(f"Attributes of PromptServer.instance: {dir(PromptServer.instance)}") # 可选：查看实例的属性
            return

        try:
            # 使用唯一的路由名称，例如加上自定义节点的前缀
            print(f"PromptServer.instance.routes object: {PromptServer.instance.routes}")
            # 修改下面这一行：使用 add_route("POST", ...) 替换 add_post(...)
            # PromptServer.instance.routes.add_route("POST", "/save_cropped_image_yc", cls.save_cropped_image_route)
            @PromptServer.instance.routes.post("/save_cropped_image_yc")
            async def save_cropped_image_route(request):
                try:
                    data = await request.json() # 从 JSON 体获取数据
                    
                    image_data_b64 = data.get('image_data')
                    # 如果前端未提供文件名，则生成一个默认文件名
                    filename = data.get('file_name', f'cropped_image_{int(time.time())}.png') 
                    save_directory = data.get('save_directory')
                    # original_file_type = data.get('original_file_type', 'image/png') # 可选，用于更细致的MIME类型处理

                    if not image_data_b64:
                        return web.json_response({"success": False, "error": "Missing image_data"}, status=400)
                    if not save_directory:
                        return web.json_response({"success": False, "error": "Missing save_directory"}, status=400)

                    # 解码 Base64 图像数据
                    try:
                        image_bytes = base64.b64decode(image_data_b64)
                    except base64.binascii.Error as b64_error:
                        print(f"Base64 decoding error: {str(b64_error)}")
                        return web.json_response({"success": False, "error": f"Invalid base64 data: {str(b64_error)}"}, status=400)
                    
                    # 使用 PIL 从字节数据打开图像
                    try:
                        image = Image.open(io.BytesIO(image_bytes))
                    except Exception as img_open_error:
                        print(f"Error opening image with PIL: {str(img_open_error)}")
                        return web.json_response({"success": False, "error": f"Could not process image data: {str(img_open_error)}"}, status=400)
                    
                    # 确保保存目录存在
                    if not os.path.exists(save_directory):
                        try:
                            os.makedirs(save_directory, exist_ok=True)
                        except Exception as mkdir_error:
                            print(f"Error creating directory {save_directory}: {str(mkdir_error)}")
                            return web.json_response({"success": False, "error": f"Could not create save directory: {str(mkdir_error)}"}, status=500)
                    
                    # 清理文件名，防止路径遍历
                    filename = os.path.basename(filename)
                    save_path = os.path.join(save_directory, filename)
                    
                    # 保存图像
                    try:
                        # PIL.Image.save 会根据文件扩展名自动确定格式
                        image.save(save_path)
                    except Exception as save_error:
                        print(f"Error saving image to {save_path}: {str(save_error)}")
                        return web.json_response({"success": False, "error": f"Could not save image: {str(save_error)}"}, status=500)
                    
                    print(f"Image saved to: {save_path}")
                    return web.json_response({
                        "success": True, 
                        "message": f"Image '{filename}' saved successfully in '{save_directory}'.",
                        "filename": filename,
                        # "url": f"/view?filename={filename}&type=output..." # 如果需要，可以构建查看URL
                    })
                except Exception as e:
                    print(f"Error in save_cropped_image_route: {str(e)}")
                    traceback.print_exc()
                    return web.json_response({"success": False, "error": str(e)}, status=500)

            print("Successfully registered /save_cropped_image_yc route for CleanData")
        except Exception as e:
            print(f"ERROR during CleanData.setup_routes -> add_route: {str(e)}") # 更新了错误信息中的方法名
            traceback.print_exc()

