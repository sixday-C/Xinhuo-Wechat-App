@echo off
echo 正在启动语音处理后端服务...
echo ================================

cd /d "%~dp0"

echo 检查Python环境...
python --version
if errorlevel 1 (
    echo 错误: 未找到Python，请确保已安装Python 3.8+
    pause
    exit /b 1
)

echo.
echo 安装依赖包...
pip install -r requirements.txt
if errorlevel 1 (
    echo 警告: 依赖安装可能失败，但继续尝试启动服务
)

echo.
echo 启动语音处理服务...
echo 服务地址: http://localhost:5000
echo 健康检查: http://localhost:5000/health
echo 模型状态: http://localhost:5000/models/status
echo.
echo 按Ctrl+C停止服务
echo ================================

python voice_server.py

pause
