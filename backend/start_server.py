#!/usr/bin/env python3
"""
语音服务启动脚本
"""
import os
import sys
import subprocess
import time

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 8):
        print("错误: 需要Python 3.8或更高版本")
        sys.exit(1)

def install_dependencies():
    """安装依赖"""
    print("正在安装依赖...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("依赖安装完成")
    except subprocess.CalledProcessError as e:
        print(f"依赖安装失败: {e}")
        sys.exit(1)

def download_models():
    """下载模型"""
    print("正在下载模型（首次运行需要时间）...")
    try:
        # 创建模型目录
        os.makedirs("./models", exist_ok=True)
        
        # 导入必要的库来下载模型
        import torch
        
        # Silero VAD模型会在第一次使用时自动下载
        print("Silero VAD模型将在首次使用时自动下载")
        
        # FunASR模型也会在第一次使用时自动下载
        print("FunASR模型将在首次使用时自动下载")
        
        print("模型准备完成")
    except ImportError as e:
        print(f"模型下载失败，缺少依赖: {e}")
        print("请确保已正确安装所有依赖")

def start_server():
    """启动服务器"""
    print("正在启动语音处理服务...")
    print("服务地址: http://localhost:5000")
    print("健康检查: http://localhost:5000/health")
    print("模型状态: http://localhost:5000/models/status")
    print("按Ctrl+C停止服务")
    print("-" * 50)
    
    try:
        subprocess.run([sys.executable, "voice_server.py"], check=True)
    except KeyboardInterrupt:
        print("\n服务已停止")
    except subprocess.CalledProcessError as e:
        print(f"服务启动失败: {e}")

def main():
    print("语音处理服务启动器")
    print("=" * 50)
    
    # 检查Python版本
    check_python_version()
    
    # 切换到脚本目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 安装依赖
    install_dependencies()
    
    # 下载模型
    download_models()
    
    # 启动服务器
    start_server()

if __name__ == "__main__":
    main()
