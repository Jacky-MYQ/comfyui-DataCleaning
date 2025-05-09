from .clean_note import CleanData

CleanData.setup_routes() 

WEB_DIRECTORY = './js'

NODE_CLASS_MAPPINGS = {
    "CleanData": CleanData  # 确保这里的键名与 JS 中 comfyClass 的值一致
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "CleanData": "Clean Data" # 节点在UI中显示的名称
}

__all__ = [
    'WEB_DIRECTORY',
    'NODE_CLASS_MAPPINGS',
    'NODE_DISPLAY_NAME_MAPPINGS',
]