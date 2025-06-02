# 语音处理后端服务

这是一个集成了silero-vad和FunASR的语音处理后端服务，为uni-app微信小程序提供VAD（语音活动检测）和ASR（自动语音识别）功能。

## 功能特性

- **语音活动检测 (VAD)**: 使用silero-vad 4检测音频中的语音片段
- **自动语音识别 (ASR)**: 使用FunASR 3进行中文语音识别
- **完整流水线**: 支持VAD+ASR一体化处理
- **多种接口**: 提供分步处理和完整流水线处理接口
- **高质量音频**: 支持多种音频格式，自动预处理为16kHz单声道
- **实时处理**: 快速响应，适合小程序实时语音处理需求

## 系统要求

- Python 3.8+
- PyTorch 2.0+
- 至少4GB内存（推荐8GB+）
- 支持CUDA的GPU（可选，CPU也可运行）

## 快速开始

### 1. 安装依赖

```bash
# 安装Python依赖
pip install -r requirements.txt
```

### 2. 启动服务

**方式一：使用启动脚本（推荐）**
```bash
# Windows
start_server.bat

# Linux/Mac
python start_server.py
```

**方式二：直接运行**
```bash
python voice_server.py
```

### 3. 验证服务

访问以下地址验证服务状态：

- 健康检查: http://localhost:5000/health
- 模型状态: http://localhost:5000/models/status

## API接口

### 1. 健康检查
```
GET /health
```

### 2. VAD语音活动检测
```
POST /vad
Content-Type: multipart/form-data

参数:
- audio: 音频文件
- threshold: 检测阈值 (可选，默认0.5)
- min_speech_duration: 最小语音时长 (可选，默认0.25s)
```

### 3. ASR语音识别
```
POST /asr
Content-Type: multipart/form-data

参数:
- audio: 音频文件
- language: 语言 (可选，默认zh-cn)
```

### 4. 完整流水线处理
```
POST /process
Content-Type: multipart/form-data

参数:
- audio: 音频文件
- language: 语言 (可选，默认zh-cn)
- vad_threshold: VAD阈值 (可选，默认0.5)
- min_speech_duration: 最小语音时长 (可选，默认0.25s)
```

### 5. 模型状态
```
GET /models/status
```

## 响应格式

### 成功响应
```json
{
  "success": true,
  "full_text": "识别的文本内容",
  "overall_confidence": 0.85,
  "voice_segments": [
    {
      "start_time": 0.5,
      "end_time": 3.0,
      "confidence": 0.9,
      "type": "speech"
    }
  ],
  "asr_results": [
    {
      "text": "识别的文本",
      "confidence": 0.85,
      "duration": 2.5,
      "words": [...]
    }
  ],
  "processing_time": 1.23,
  "audio_duration": 3.0,
  "timestamp": "2025-06-02T10:30:00"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息",
  "timestamp": "2025-06-02T10:30:00"
}
```

## 配置说明

### 模型配置

1. **Silero VAD**: 自动从torch hub下载
2. **FunASR**: 使用阿里巴巴的Paraformer中文模型，首次运行时自动下载

### 服务配置

- 监听地址: 0.0.0.0:5000
- 最大文件大小: 50MB
- 支持格式: MP3, WAV, M4A等
- 目标采样率: 16kHz
- 声道: 单声道

## 前端集成

在uni-app中配置服务器地址：

```javascript
// 在demo页面中配置
serverConfig: {
  url: 'http://your-server-ip:5000',
  vadEnabled: true,
  asrEnabled: true
}
```

## 性能优化

1. **GPU加速**: 如有CUDA GPU，模型会自动使用GPU加速
2. **批处理**: 支持批量处理多个音频文件
3. **内存管理**: 自动清理临时文件，避免内存泄漏
4. **并发处理**: 支持多线程并发处理请求

## 故障排除

### 常见问题

1. **模型下载慢**
   - 首次运行需要下载模型，请耐心等待
   - 可配置镜像源加速下载

2. **内存不足**
   - 确保系统有足够内存（推荐8GB+）
   - 可尝试降低音频质量或时长

3. **CUDA相关错误**
   - 如无GPU或CUDA环境，服务会自动使用CPU
   - CPU模式性能较慢但功能完整

4. **网络连接错误**
   - 检查防火墙设置
   - 确保端口5000未被占用

### 日志查看

服务运行时会生成 `voice_server.log` 文件，包含详细的运行日志。

## 开发说明

### 项目结构
```
backend/
├── voice_server.py          # 主服务文件
├── requirements.txt         # Python依赖
├── start_server.py         # 启动脚本
├── start_server.bat        # Windows启动脚本
├── README.md               # 说明文档
├── models/                 # 模型缓存目录
└── temp/                   # 临时文件目录
```

### 扩展开发

- 添加新的ASR模型支持
- 集成更多语言
- 优化音频预处理
- 添加音频质量评估

## 许可证

本项目仅供学习和研究使用。